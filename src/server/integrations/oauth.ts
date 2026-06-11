/* ================================================================
   OAuth 2.0 client — authorization-code + PKCE for Google and
   Microsoft identity platform.

   Endpoints:
     google     https://accounts.google.com/o/oauth2/v2/auth
                https://oauth2.googleapis.com/token
                https://oauth2.googleapis.com/revoke
     microsoft  https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
                https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
                (tenant from MS_TENANT, default "common"; no public
                revocation endpoint for this flow)

   Configuration — env only, secrets never live in code:
     GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
     MS_CLIENT_ID / MS_CLIENT_SECRET / MS_TENANT
     APP_ORIGIN                  origin the redirect URI is built from
     SCOPEFORGE_ALLOWED_ORIGINS  comma-separated redirect-origin allowlist;
                                 without it only localhost is accepted
     SCOPEFORGE_STATE_SECRET     HMAC key for signed state (falls back to a
                                 domain-separated derivation of the vault key)

   When any of these are absent, isConfigured() is false and the
   service reports sandbox mode instead of failing.

   Production swap points: none — this is the production client.
   ================================================================ */

import { Buffer } from "node:buffer";
import { createHash, createHmac, randomBytes } from "node:crypto";
import {
  CAPABILITIES,
  type CapabilityKey,
  type IntegrationProvider,
} from "@/lib/integrations";
import { constantTimeEqual } from "../crypto/token-vault";
import { fetchJson } from "./http";
import { ProviderError, type TokenSet } from "./types";

/* ---------------- endpoints ---------------- */

interface ProviderEndpoints {
  authorize: string;
  token: string;
  revoke?: string;
}

function endpointsFor(provider: IntegrationProvider, tenant: string): ProviderEndpoints {
  if (provider === "google") {
    return {
      authorize: "https://accounts.google.com/o/oauth2/v2/auth",
      token: "https://oauth2.googleapis.com/token",
      revoke: "https://oauth2.googleapis.com/revoke",
    };
  }
  const base = `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0`;
  return { authorize: `${base}/authorize`, token: `${base}/token` };
}

/* ---------------- PKCE (RFC 7636, S256) ---------------- */

/** 32 random bytes, base64url — a 43-char verifier. */
export function generateVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function challengeFromVerifier(verifier: string): string {
  return createHash("sha256").update(verifier, "utf8").digest("base64url");
}

/* ---------------- signed state ---------------- */

export interface OAuthStatePayload {
  nonce: string;
  workspaceId: string;
  /** in-app path to land on after the callback */
  returnTo: string;
  /** capabilities the user enabled before consent — drives grant diffing */
  capabilities: CapabilityKey[];
  /** epoch ms expiry */
  exp: number;
}

const CAPABILITY_KEYS = new Set<string>(CAPABILITIES.map((c) => c.key));

function isStatePayload(value: unknown): value is OAuthStatePayload {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.nonce === "string" &&
    typeof o.workspaceId === "string" &&
    typeof o.returnTo === "string" &&
    typeof o.exp === "number" &&
    Array.isArray(o.capabilities) &&
    o.capabilities.every((c) => typeof c === "string" && CAPABILITY_KEYS.has(c))
  );
}

/** base64url(JSON payload) + "." + base64url(HMAC-SHA256). */
export function signState(payload: OAuthStatePayload, secret: Buffer): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

/** Timing-safe signature check, then shape + expiry validation. */
export function verifyState(token: string, secret: Buffer): OAuthStatePayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!constantTimeEqual(mac, expected)) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isStatePayload(payload)) return null;
  if (payload.exp < Date.now()) return null;
  return payload;
}

/* ---------------- token endpoint plumbing ---------------- */

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
  token_type?: string;
}

function toTokenSet(response: TokenResponse, previousRefreshToken?: string): TokenSet {
  if (!response.access_token) {
    throw new ProviderError(
      "invalid_request",
      "The token endpoint responded without an access token."
    );
  }
  return {
    accessToken: response.access_token,
    // Google omits refresh_token on refresh (keep the old one);
    // Microsoft rotates it (take the new one).
    refreshToken: response.refresh_token ?? previousRefreshToken,
    expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
    scopes: response.scope ? response.scope.split(" ").filter(Boolean) : [],
  };
}

/** Maps OAuth error bodies ({error, error_description}) to the taxonomy. */
function mapOAuthError(status: number, bodyText: string): ProviderError | undefined {
  let error = "";
  let description = "";
  try {
    const parsed = JSON.parse(bodyText) as { error?: string; error_description?: string };
    error = parsed.error ?? "";
    description = parsed.error_description ?? "";
  } catch {
    return undefined; // non-JSON body — defaults apply
  }
  const providerDetail = error || undefined;
  if (error === "invalid_grant") {
    return new ProviderError(
      "reconnect_required",
      "The refresh grant is no longer valid — the user must re-authorize.",
      { providerDetail }
    );
  }
  if (
    error === "interaction_required" ||
    error === "consent_required" ||
    error === "login_required"
  ) {
    return new ProviderError(
      "consent_required",
      "The provider requires the user to complete consent again.",
      { providerDetail }
    );
  }
  if (description.includes("AADSTS65001")) {
    return new ProviderError(
      "admin_blocked",
      "The organization requires admin consent before this app can be used.",
      { providerDetail: "AADSTS65001" }
    );
  }
  if (
    error === "admin_policy_enforced" ||
    error === "org_internal" ||
    (error === "access_denied" && /admin|polic/i.test(description))
  ) {
    return new ProviderError(
      "admin_blocked",
      "An organization policy blocks this connection until an admin approves the app.",
      { providerDetail }
    );
  }
  return undefined;
}

function formBody(fields: Record<string, string>): string {
  return new URLSearchParams(fields).toString();
}

const FORM_HEADERS = { "Content-Type": "application/x-www-form-urlencoded" };

/* ---------------- client ---------------- */

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

export interface OAuthClientOptions {
  google?: ClientCredentials;
  microsoft?: ClientCredentials;
  tenant?: string;
  appOrigin?: string;
  allowedOrigins?: string[];
  stateSecret?: Buffer;
}

export interface AuthorizationUrlRequest {
  provider: IntegrationProvider;
  scopes: string[];
  state: string;
  codeChallenge: string;
}

function readCredentials(
  id: string | undefined,
  secret: string | undefined
): ClientCredentials | undefined {
  return id && secret ? { clientId: id, clientSecret: secret } : undefined;
}

function deriveStateSecret(env: NodeJS.ProcessEnv): Buffer | undefined {
  const source = env.SCOPEFORGE_STATE_SECRET ?? env.SCOPEFORGE_VAULT_KEY;
  if (!source) return undefined;
  // Domain-separated derivation — the raw vault key is never used
  // directly as an HMAC key.
  return createHash("sha256").update(`scopeforge:oauth-state:${source}`).digest();
}

function parseOriginList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export class OAuthClient {
  private readonly google?: ClientCredentials;
  private readonly microsoft?: ClientCredentials;
  private readonly tenant: string;
  private readonly appOrigin?: string;
  private readonly allowedOrigins: string[];
  private readonly stateSecret?: Buffer;

  constructor(options?: OAuthClientOptions) {
    const env = process.env;
    this.google =
      options?.google ?? readCredentials(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
    this.microsoft =
      options?.microsoft ?? readCredentials(env.MS_CLIENT_ID, env.MS_CLIENT_SECRET);
    this.tenant = options?.tenant ?? env.MS_TENANT ?? "common";
    this.appOrigin = options?.appOrigin ?? env.APP_ORIGIN;
    this.allowedOrigins =
      options?.allowedOrigins ?? parseOriginList(env.SCOPEFORGE_ALLOWED_ORIGINS);
    this.stateSecret = options?.stateSecret ?? deriveStateSecret(env);
  }

  isConfigured(provider: IntegrationProvider): boolean {
    if (!this.credentialsOrNull(provider) || !this.stateSecret) return false;
    try {
      this.validatedOrigin();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Redirect URI is always derived from APP_ORIGIN — never from the
   * incoming request — and the origin must pass the allowlist. This
   * closes the open-redirect / host-header class of OAuth bugs.
   */
  redirectUri(provider: IntegrationProvider): string {
    return `${this.validatedOrigin()}/api/integrations/${provider}/callback`;
  }

  buildAuthorizationUrl(request: AuthorizationUrlRequest): string {
    const { authorize } = endpointsFor(request.provider, this.tenant);
    const credentials = this.credentials(request.provider);
    const url = new URL(authorize);
    url.searchParams.set("client_id", credentials.clientId);
    url.searchParams.set("redirect_uri", this.redirectUri(request.provider));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", request.scopes.join(" "));
    url.searchParams.set("state", request.state);
    url.searchParams.set("code_challenge", request.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    if (request.provider === "google") {
      // offline → refresh token; prompt=consent re-issues it and shows
      // the scope diff; include_granted_scopes enables incremental auth
      // so a later capability request doesn't re-ask for everything.
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      url.searchParams.set("include_granted_scopes", "true");
    } else {
      url.searchParams.set("response_mode", "query");
    }
    return url.toString();
  }

  signState(payload: OAuthStatePayload): string {
    return signState(payload, this.requireStateSecret());
  }

  verifyState(token: string): OAuthStatePayload | null {
    if (!this.stateSecret) return null;
    return verifyState(token, this.stateSecret);
  }

  async exchangeCode(
    provider: IntegrationProvider,
    code: string,
    codeVerifier: string
  ): Promise<{ tokens: TokenSet; idToken?: string }> {
    const { token } = endpointsFor(provider, this.tenant);
    const credentials = this.credentials(provider);
    const response = await fetchJson<TokenResponse>(token, {
      method: "POST",
      headers: FORM_HEADERS,
      body: formBody({
        grant_type: "authorization_code",
        code,
        code_verifier: codeVerifier,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: this.redirectUri(provider),
      }),
      // Authorization codes are single-use: a retry after an ambiguous
      // failure would burn the code anyway, so never retry the exchange.
      idempotent: false,
      mapError: mapOAuthError,
    });
    return { tokens: toTokenSet(response), idToken: response.id_token };
  }

  async refreshTokens(
    provider: IntegrationProvider,
    refreshToken: string
  ): Promise<TokenSet> {
    const { token } = endpointsFor(provider, this.tenant);
    const credentials = this.credentials(provider);
    const response = await fetchJson<TokenResponse>(token, {
      method: "POST",
      headers: FORM_HEADERS,
      body: formBody({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
      mapError: mapOAuthError,
    });
    return toTokenSet(response, refreshToken);
  }

  /**
   * Best-effort provider-side revocation. Google: revoke the refresh
   * token (revokes the whole grant family). Microsoft: the identity
   * platform has no self-serve revocation endpoint for this flow —
   * deleting the vault entry is the effective local revocation, and
   * org admins can revoke sessions centrally. Callers treat failures
   * as non-fatal and always purge locally.
   */
  async revokeTokens(provider: IntegrationProvider, tokens: TokenSet): Promise<void> {
    if (provider !== "google") return;
    const { revoke } = endpointsFor(provider, this.tenant);
    if (!revoke) return;
    await fetchJson<void>(revoke, {
      method: "POST",
      headers: FORM_HEADERS,
      body: formBody({ token: tokens.refreshToken ?? tokens.accessToken }),
    });
  }

  /* ---------------- internals ---------------- */

  private credentialsOrNull(provider: IntegrationProvider): ClientCredentials | null {
    return (provider === "google" ? this.google : this.microsoft) ?? null;
  }

  private credentials(provider: IntegrationProvider): ClientCredentials {
    const credentials = this.credentialsOrNull(provider);
    if (!credentials) {
      // Message names the env vars, never their values.
      throw new ProviderError(
        "invalid_request",
        `OAuth client for "${provider}" is not configured — set the provider client id and secret env vars.`
      );
    }
    return credentials;
  }

  private requireStateSecret(): Buffer {
    if (!this.stateSecret) {
      throw new ProviderError(
        "invalid_request",
        "State signing is not configured — set SCOPEFORGE_STATE_SECRET."
      );
    }
    return this.stateSecret;
  }

  private validatedOrigin(): string {
    if (!this.appOrigin) {
      throw new ProviderError("invalid_request", "APP_ORIGIN is not configured.");
    }
    let parsed: URL;
    try {
      parsed = new URL(this.appOrigin);
    } catch {
      throw new ProviderError("invalid_request", "APP_ORIGIN is not a valid origin.");
    }
    const origin = parsed.origin;
    const isLocalhost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const listed =
      this.allowedOrigins.length > 0
        ? this.allowedOrigins.includes(origin)
        : isLocalhost; // safe default: without an explicit allowlist, only localhost
    if (!listed || (!isLocalhost && parsed.protocol !== "https:")) {
      throw new ProviderError(
        "invalid_request",
        "APP_ORIGIN is not in the redirect-origin allowlist."
      );
    }
    return origin;
  }
}
