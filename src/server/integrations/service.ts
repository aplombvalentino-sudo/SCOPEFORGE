/* ================================================================
   IntegrationsService — the facade the API routes talk to.

   Wires vault + oauth + store + audit + adapters into the connect /
   callback / refresh / disconnect lifecycle. Reports mode():
     "live"     vault key AND at least one provider's OAuth env present
     "sandbox"  anything missing — the client-side sandbox store drives
                the demo experience; this layer stays inert and honest.

   Production swap points:
   - InMemoryStorePort → Supabase store adapter (constructor injection).
   - InMemoryAuditPort → Supabase audit table.
   - DEFAULT_WORKSPACE_ID → workspace resolved from the authenticated
     session (the routes pass it in; nothing here assumes a demo).
   ================================================================ */

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import {
  CAPABILITIES,
  type CapabilityKey,
  type IntegrationProvider,
} from "@/lib/integrations";
import { TokenVault, constantTimeEqual } from "../crypto/token-vault";
import { writeAudit } from "./audit";
import { IngestionService } from "./ingestion";
import { OAuthClient, challengeFromVerifier, generateVerifier } from "./oauth";
import type { OAuthStatePayload } from "./oauth";
import { GoogleAdapter } from "./providers/google";
import { GraphAdapter } from "./providers/microsoft";
import { buildScopeSet, capabilitiesFromScopes } from "./registry";
import {
  InMemoryAuditPort,
  InMemoryStorePort,
  ProviderError,
  type AccessTokenProvider,
  type AuditPort,
  type ProviderAdapter,
  type StoredAccount,
  type StorePort,
  type TokenSet,
} from "./types";

/* ---------------- constants & small helpers ---------------- */

export const STATE_COOKIE_NAME = "sf_oauth_state";

/**
 * Demo workspace until sessions land — production resolves the
 * workspace id from the authenticated user, never from a constant.
 */
export const DEFAULT_WORKSPACE_ID = "ws-atelier-north";

const PROVIDERS: IntegrationProvider[] = ["google", "microsoft"];
const STATE_TTL_MS = 10 * 60 * 1000;
/** refresh this long before the access token actually expires */
const REFRESH_SKEW_MS = 5 * 60 * 1000;

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return value === "google" || value === "microsoft";
}

/** Parses "?capabilities=email_import,drive_files" — unknown keys dropped. */
export function parseCapabilityKeys(raw: string | null): CapabilityKey[] {
  if (!raw) return [];
  const known = new Set<string>(CAPABILITIES.map((c) => c.key));
  const keys = raw
    .split(",")
    .map((key) => key.trim())
    .filter((key) => known.has(key)) as CapabilityKey[];
  return [...new Set(keys)];
}

function sanitizeCode(value: string): string {
  return value.replace(/[^a-z0-9_]/gi, "").slice(0, 40) || "provider_error";
}

/**
 * Display-only claim read from the id_token. Production verifies the
 * JWT signature against the provider JWKS before trusting any claim;
 * here the token arrived directly from the token endpoint over TLS,
 * which bounds the risk — and nothing authorizes against this value.
 */
function emailFromIdToken(idToken: string | undefined): string | undefined {
  if (!idToken) return undefined;
  const parts = idToken.split(".");
  if (parts.length < 2) return undefined;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      email?: unknown;
      preferred_username?: unknown;
    };
    if (typeof claims.email === "string") return claims.email;
    if (typeof claims.preferred_username === "string") return claims.preferred_username;
  } catch {
    // malformed id_token — display falls back to "unknown"
  }
  return undefined;
}

function parseStateCookie(value: string): { state: string; verifier: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      state?: unknown;
      verifier?: unknown;
    };
    if (typeof parsed.state === "string" && typeof parsed.verifier === "string") {
      return { state: parsed.state, verifier: parsed.verifier };
    }
  } catch {
    // tampered or stale cookie
  }
  return null;
}

/* ---------------- result shapes ---------------- */

export type IntegrationsMode = "live" | "sandbox";

export interface ProviderStatus {
  provider: IntegrationProvider;
  configured: boolean;
  account?: {
    email: string;
    status: StoredAccount["status"];
    scopes: string[];
  };
}

export interface IntegrationsStatus {
  mode: IntegrationsMode;
  providers: ProviderStatus[];
}

export type BeginConnectResult =
  | {
      mode: "live";
      authUrl: string;
      stateCookie: { name: string; value: string; maxAgeSeconds: number };
    }
  | { mode: "sandbox"; message: string };

export interface CallbackInput {
  provider: IntegrationProvider;
  params: {
    code?: string;
    state?: string;
    error?: string;
    errorDescription?: string;
  };
  stateCookie: string | null;
  /** fallback for audit before the signed state is verified */
  workspaceId: string;
}

export type CallbackResult =
  | { outcome: "connected"; returnTo: string }
  | { outcome: "denied" }
  | { outcome: "admin_required" }
  | { outcome: "error"; code: string };

export interface DisconnectResult {
  revokedAtProvider: boolean;
  purgedRecords: number;
}

export interface IntegrationsServiceDeps {
  vault: TokenVault;
  oauth: OAuthClient;
  store: StorePort;
  audit: AuditPort;
}

/* ---------------- service ---------------- */

export class IntegrationsService {
  private readonly vault: TokenVault;
  private readonly oauth: OAuthClient;
  private readonly store: StorePort;
  private readonly audit: AuditPort;
  /**
   * Single-flight refresh: at most one token refresh in flight per
   * account in this process — concurrent imports share the promise
   * instead of racing (Microsoft rotates refresh tokens; a race would
   * invalidate the winner). Multi-instance deployments add a row-level
   * lock in the store on top of this.
   */
  private readonly refreshing = new Map<string, Promise<TokenSet>>();

  constructor(deps?: Partial<IntegrationsServiceDeps>) {
    this.vault = deps?.vault ?? new TokenVault();
    this.oauth = deps?.oauth ?? new OAuthClient();
    this.store = deps?.store ?? new InMemoryStorePort();
    this.audit = deps?.audit ?? new InMemoryAuditPort();
  }

  /* ---------- mode & status ---------- */

  providerConfigured(provider: IntegrationProvider): boolean {
    return this.vault.isConfigured() && this.oauth.isConfigured(provider);
  }

  mode(): IntegrationsMode {
    return PROVIDERS.some((p) => this.providerConfigured(p)) ? "live" : "sandbox";
  }

  async getStatus(workspaceId: string): Promise<IntegrationsStatus> {
    const accounts = await this.store.listAccounts(workspaceId);
    return {
      mode: this.mode(),
      providers: PROVIDERS.map((provider) => {
        const account = accounts.find((a) => a.provider === provider);
        return {
          provider,
          configured: this.providerConfigured(provider),
          account: account
            ? {
                email: account.accountEmail,
                status: account.status,
                scopes: account.scopes,
              }
            : undefined,
        };
      }),
    };
  }

  /* ---------- connect ---------- */

  beginConnect(
    provider: IntegrationProvider,
    capabilities: CapabilityKey[],
    context: { workspaceId: string; returnTo: string }
  ): BeginConnectResult {
    if (!this.providerConfigured(provider)) {
      return {
        mode: "sandbox",
        message:
          "Provider credentials are not configured on this server, so the in-app sandbox handles this connection. In production this endpoint responds with a 302 to the provider's consent screen.",
      };
    }
    const scopes = buildScopeSet(capabilities, provider);
    const verifier = generateVerifier();
    const statePayload: OAuthStatePayload = {
      nonce: randomUUID(),
      workspaceId: context.workspaceId,
      returnTo: context.returnTo,
      capabilities,
      exp: Date.now() + STATE_TTL_MS,
    };
    const state = this.oauth.signState(statePayload);
    const authUrl = this.oauth.buildAuthorizationUrl({
      provider,
      scopes,
      state,
      codeChallenge: challengeFromVerifier(verifier),
    });
    // The PKCE verifier rides in the httpOnly cookie next to the signed
    // state — it never appears in any URL.
    const cookieValue = Buffer.from(
      JSON.stringify({ state, verifier }),
      "utf8"
    ).toString("base64url");
    return {
      mode: "live",
      authUrl,
      stateCookie: {
        name: STATE_COOKIE_NAME,
        value: cookieValue,
        maxAgeSeconds: STATE_TTL_MS / 1000,
      },
    };
  }

  /* ---------- callback ---------- */

  async handleCallback(input: CallbackInput): Promise<CallbackResult> {
    const { provider, params } = input;

    // Provider returned an error instead of a code.
    if (params.error) {
      const description = params.errorDescription ?? "";
      const adminBlocked =
        description.includes("AADSTS65001") ||
        params.error === "admin_policy_enforced" ||
        params.error === "org_internal" ||
        (params.error === "access_denied" && /admin|polic/i.test(description));
      if (adminBlocked) {
        await writeAudit(this.audit, {
          name: "integration.admin_blocked",
          workspaceId: input.workspaceId,
          provider,
          payload: { reason: sanitizeCode(params.error) },
        });
        return { outcome: "admin_required" };
      }
      if (
        params.error === "access_denied" ||
        params.error === "consent_required" ||
        params.error === "interaction_required"
      ) {
        await writeAudit(this.audit, {
          name: "integration.scope_declined",
          workspaceId: input.workspaceId,
          provider,
          payload: { reason: sanitizeCode(params.error) },
        });
        return { outcome: "denied" };
      }
      return { outcome: "error", code: sanitizeCode(params.error) };
    }

    if (!params.code || !params.state || !input.stateCookie) {
      return { outcome: "error", code: "missing_state" };
    }

    const cookie = parseStateCookie(input.stateCookie);
    if (!cookie) return { outcome: "error", code: "invalid_state" };

    // Timing-safe match between the state echoed by the provider and
    // the one we set in the httpOnly cookie, then signature + expiry
    // verification of the cookie's signed payload.
    if (!constantTimeEqual(cookie.state, params.state)) {
      return { outcome: "error", code: "state_mismatch" };
    }
    const statePayload = this.oauth.verifyState(cookie.state);
    if (!statePayload) return { outcome: "error", code: "invalid_state" };

    let exchange: { tokens: TokenSet; idToken?: string };
    try {
      exchange = await this.oauth.exchangeCode(provider, params.code, cookie.verifier);
    } catch (error) {
      if (error instanceof ProviderError) {
        if (error.code === "admin_blocked") {
          await writeAudit(this.audit, {
            name: "integration.admin_blocked",
            workspaceId: statePayload.workspaceId,
            provider,
            payload: { stage: "token_exchange" },
          });
          return { outcome: "admin_required" };
        }
        if (error.code === "consent_required") return { outcome: "denied" };
        return { outcome: "error", code: error.code };
      }
      throw error;
    }

    const tokens = exchange.tokens;
    const workspaceId = statePayload.workspaceId;
    const accountEmail = emailFromIdToken(exchange.idToken) ?? "unknown";
    const now = new Date().toISOString();

    const account: StoredAccount = {
      id: `${workspaceId}:${provider}`,
      workspaceId,
      provider,
      accountEmail,
      encryptedTokens: this.vault.encrypt(JSON.stringify(tokens)),
      scopes: tokens.scopes,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    await this.store.upsertAccount(account);

    // Grant diff: what the user actually allowed vs what was requested.
    const granted = capabilitiesFromScopes(tokens.scopes, provider);
    const declined = statePayload.capabilities.filter((key) => !granted.includes(key));

    await writeAudit(this.audit, {
      name: "integration.connected",
      workspaceId,
      provider,
      payload: { accountId: account.id, accountEmail },
    });
    if (granted.length > 0) {
      await writeAudit(this.audit, {
        name: "integration.scopes_granted",
        workspaceId,
        provider,
        payload: { capabilities: granted, scopeCount: tokens.scopes.length },
      });
    }
    for (const key of declined) {
      await writeAudit(this.audit, {
        name: "integration.scope_declined",
        workspaceId,
        provider,
        payload: { capability: key },
      });
    }

    return { outcome: "connected", returnTo: statePayload.returnTo };
  }

  /* ---------- token lifecycle ---------- */

  /**
   * Returns a usable token set, refreshing when within 5 minutes of
   * expiry. Refreshes are single-flighted per account (see field doc).
   */
  async refreshIfNeeded(account: StoredAccount): Promise<TokenSet> {
    const tokens = this.decryptTokens(account);
    if (tokens.expiresAt - Date.now() > REFRESH_SKEW_MS) return tokens;

    const refreshToken = tokens.refreshToken;
    if (!refreshToken) {
      await this.markReconnectRequired(account);
      throw new ProviderError(
        "reconnect_required",
        "No refresh token on file — the account must be re-authorized."
      );
    }

    const inFlight = this.refreshing.get(account.id);
    if (inFlight) return inFlight;

    const task = this.doRefresh(account, refreshToken, tokens).finally(() => {
      this.refreshing.delete(account.id);
    });
    this.refreshing.set(account.id, task);
    return task;
  }

  /** ProviderAdapter wired to this service's refresh pipeline. */
  adapterFor(account: StoredAccount): ProviderAdapter {
    const accessToken: AccessTokenProvider = async () =>
      (await this.refreshIfNeeded(account)).accessToken;
    return account.provider === "google"
      ? new GoogleAdapter(accessToken)
      : new GraphAdapter(accessToken);
  }

  /** IngestionService bound to this service's store and audit ports. */
  ingestion(): IngestionService {
    return new IngestionService(this.store, this.audit);
  }

  /* ---------- disconnect ---------- */

  async disconnect(
    workspaceId: string,
    provider: IntegrationProvider,
    options: { purgeImports: boolean }
  ): Promise<DisconnectResult> {
    const account = await this.store.findAccount(workspaceId, provider);
    let revokedAtProvider = false;

    if (account) {
      try {
        const tokens = this.decryptTokens(account);
        await this.oauth.revokeTokens(provider, tokens);
        revokedAtProvider = true;
      } catch {
        // Best-effort: provider-side revocation failing (network, token
        // already dead) never blocks local deletion — the vault entry
        // is removed regardless.
      }
      await this.store.deleteAccount(account.id);
      await writeAudit(this.audit, {
        name: "integration.tokens_purged",
        workspaceId,
        provider,
        payload: { accountId: account.id, revokedAtProvider },
      });
    }

    let purgedRecords = 0;
    if (options.purgeImports) {
      purgedRecords = await this.store.purgeImportedContent(workspaceId, provider);
    }

    await writeAudit(this.audit, {
      name: "integration.disconnected",
      workspaceId,
      provider,
      payload: {
        hadAccount: account !== null,
        revokedAtProvider,
        purgeImports: options.purgeImports,
        purgedRecords,
      },
    });

    return { revokedAtProvider, purgedRecords };
  }

  /* ---------- internals ---------- */

  private decryptTokens(account: StoredAccount): TokenSet {
    return JSON.parse(this.vault.decrypt(account.encryptedTokens)) as TokenSet;
  }

  private async doRefresh(
    account: StoredAccount,
    refreshToken: string,
    previous: TokenSet
  ): Promise<TokenSet> {
    try {
      const next = await this.oauth.refreshTokens(account.provider, refreshToken);
      const merged: TokenSet = {
        ...next,
        refreshToken: next.refreshToken ?? refreshToken,
        scopes: next.scopes.length > 0 ? next.scopes : previous.scopes,
      };
      await this.store.upsertAccount({
        ...account,
        encryptedTokens: this.vault.encrypt(JSON.stringify(merged)),
        scopes: merged.scopes,
        status: "active",
        updatedAt: new Date().toISOString(),
      });
      return merged;
    } catch (error) {
      if (
        error instanceof ProviderError &&
        (error.code === "reconnect_required" || error.code === "consent_required")
      ) {
        await this.markReconnectRequired(account);
      }
      throw error;
    }
  }

  private async markReconnectRequired(account: StoredAccount): Promise<void> {
    await this.store.upsertAccount({
      ...account,
      status: "reconnect_required",
      updatedAt: new Date().toISOString(),
    });
    await writeAudit(this.audit, {
      name: "integration.reconnect_required",
      workspaceId: account.workspaceId,
      provider: account.provider,
      payload: { accountId: account.id },
    });
  }
}

/* ---------------- process-wide instance ---------------- */

let instance: IntegrationsService | null = null;

/**
 * Shared instance for the route handlers. Production keeps this
 * per-process too — durable state lives behind StorePort/AuditPort,
 * not in the class.
 */
export function getIntegrationsService(): IntegrationsService {
  if (!instance) instance = new IntegrationsService();
  return instance;
}
