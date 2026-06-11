/* ================================================================
   Audit writer for the integrations layer.

   Every security-relevant action — connect, grant, decline, refresh
   failure, admin block, import, send, disconnect, purge — lands as an
   AuditEntry through an AuditPort. Payloads pass through redact()
   first: token material, message bodies, and attachment bytes never
   reach the log. We log refs and counts, never content.

   Production swap points: the AuditPort behind writeAudit — the
   Supabase integration_audit table replaces InMemoryAuditPort.
   ================================================================ */

import type { IntegrationProvider } from "@/lib/integrations";
import type { AuditEntry, AuditPort } from "./types";

export type AuditEventName =
  | "integration.connected"
  | "integration.scopes_granted"
  | "integration.scope_declined"
  | "integration.reconnect_required"
  | "integration.admin_blocked"
  | "integration.disconnected"
  | "integration.tokens_purged"
  | "import.started"
  | "import.completed"
  | "import.partial"
  | "import.failed"
  | "send.completed"
  | "send.failed";

export interface AuditEvent {
  name: AuditEventName;
  workspaceId: string;
  provider?: IntegrationProvider;
  payload?: Record<string, unknown>;
}

/** Keys whose values are secrets — always replaced wholesale. */
const SECRET_KEY_PATTERN =
  /token|secret|password|authorization|cookie|verifier|assertion|signature|credential/i;

/** Keys whose values are user content — replaced by a length marker. */
const CONTENT_KEY_PATTERN = /body|content|raw|html|snippet|data|bytes|attachment/i;

/** Strings longer than this are treated as content even under a benign key. */
const MAX_BENIGN_STRING = 256;

const MAX_DEPTH = 3;

function redactValue(key: string, value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Uint8Array) return `[bytes:${value.byteLength}]`;
  if (SECRET_KEY_PATTERN.test(key)) return "[redacted]";
  if (typeof value === "string") {
    if (CONTENT_KEY_PATTERN.test(key)) return `[content:${value.length} chars]`;
    return value.length > MAX_BENIGN_STRING
      ? `[content:${value.length} chars]`
      : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) return `[array:${value.length}]`;
    return value.map((item) => redactValue(key, item, depth + 1));
  }
  if (typeof value === "object") {
    if (depth >= MAX_DEPTH) return "[object]";
    return redactObject(value as Record<string, unknown>, depth + 1);
  }
  return String(value);
}

function redactObject(
  payload: Record<string, unknown>,
  depth: number
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    out[key] = redactValue(key, value, depth);
  }
  return out;
}

/**
 * Strips token material, message bodies, and attachment bytes from a
 * payload before it is persisted. Refs, ids, and counts survive;
 * content never does.
 */
export function redact(payload: Record<string, unknown>): Record<string, unknown> {
  return redactObject(payload, 0);
}

export async function writeAudit(port: AuditPort, event: AuditEvent): Promise<void> {
  const entry: AuditEntry = {
    at: new Date().toISOString(),
    workspaceId: event.workspaceId,
    event: event.name,
    payload: redact({
      ...(event.provider ? { provider: event.provider } : {}),
      ...(event.payload ?? {}),
    }),
  };
  await port.append(entry);
}
