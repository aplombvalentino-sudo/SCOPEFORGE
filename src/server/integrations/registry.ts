/* ================================================================
   Server scope registry.

   The single source of truth for capability→scope mapping is the
   client module @/lib/integrations (CAPABILITIES) — pure data, safe
   to import server-side. This module derives the server-facing view
   and owns the one rule the client never applies: identity scopes are
   always part of an authorization request, capabilities only add to
   them.

   Production swap points: none — consumed as-is by oauth.ts and
   service.ts when building consent URLs and diffing granted scopes.
   ================================================================ */

import {
  CAPABILITIES,
  type CapabilityKey,
  type IntegrationProvider,
} from "@/lib/integrations";

const PROVIDERS: IntegrationProvider[] = ["google", "microsoft"];

/**
 * Identity scopes requested on every connect, regardless of enabled
 * capabilities. Microsoft additionally needs offline_access for a
 * refresh token (Google issues one via access_type=offline instead)
 * and User.Read for the signed-in profile.
 */
export const IDENTITY_SCOPES: Record<IntegrationProvider, string[]> = {
  google: ["openid", "email"],
  microsoft: ["openid", "email", "offline_access", "User.Read"],
};

function buildRegistry(): Record<
  IntegrationProvider,
  Record<CapabilityKey, string[] | null>
> {
  const out = {} as Record<IntegrationProvider, Record<CapabilityKey, string[] | null>>;
  for (const provider of PROVIDERS) {
    const entry = {} as Record<CapabilityKey, string[] | null>;
    for (const capability of CAPABILITIES) {
      const scopes = capability.scopes[provider];
      entry[capability.key] = scopes ? [...scopes] : null;
    }
    out[provider] = entry;
  }
  return out;
}

/**
 * capability → scopes per provider, mirrored 1:1 from the client
 * CAPABILITIES registry. null = capability not offered for that
 * provider yet.
 */
export const SCOPE_REGISTRY: Record<
  IntegrationProvider,
  Record<CapabilityKey, string[] | null>
> = buildRegistry();

/**
 * Builds the deduped scope set for an authorization request:
 * identity scopes always included, then each enabled capability's
 * scopes. Capabilities not offered for the provider are skipped.
 */
export function buildScopeSet(
  capabilities: CapabilityKey[],
  provider: IntegrationProvider
): string[] {
  const scopes: string[] = [];
  for (const scope of IDENTITY_SCOPES[provider]) {
    if (!scopes.includes(scope)) scopes.push(scope);
  }
  for (const key of capabilities) {
    const capabilityScopes = SCOPE_REGISTRY[provider][key];
    if (!capabilityScopes) continue;
    for (const scope of capabilityScopes) {
      if (!scopes.includes(scope)) scopes.push(scope);
    }
  }
  return scopes;
}

const GRAPH_SCOPE_PREFIX = "https://graph.microsoft.com/";

/** Microsoft echoes scopes back with the Graph resource prefix — strip it. */
export function normalizeScope(scope: string): string {
  return scope.startsWith(GRAPH_SCOPE_PREFIX)
    ? scope.slice(GRAPH_SCOPE_PREFIX.length)
    : scope;
}

/**
 * Reverse mapping: which capabilities are fully covered by a granted
 * scope set. Used after the OAuth callback to detect partial grants
 * (user unticked a scope on the consent screen).
 */
export function capabilitiesFromScopes(
  scopes: string[],
  provider: IntegrationProvider
): CapabilityKey[] {
  const granted = new Set(scopes.map(normalizeScope));
  return CAPABILITIES.filter((capability) => {
    const required = SCOPE_REGISTRY[provider][capability.key];
    return (
      !!required &&
      required.length > 0 &&
      required.every((scope) => granted.has(normalizeScope(scope)))
    );
  }).map((capability) => capability.key);
}
