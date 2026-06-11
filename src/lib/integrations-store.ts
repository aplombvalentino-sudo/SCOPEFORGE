"use client";

/* ================================================================
   Integrations client store (sandbox driver).
   In production these actions call /api/integrations/*; here they
   simulate the same state machine with realistic latency so every
   UX surface — consent, partial grants, expiry, admin blocks,
   imports, disconnect — is fully exercisable.
   Cross-store: imports create leads through the main app store.
   ================================================================ */

import { create } from "zustand";
import {
  CAPABILITY_BY_KEY,
  PROVIDER_META,
  seedConnections,
  seedDriveFiles,
  seedInboxThreads,
  seedIntegrationEvents,
  type CapabilityKey,
  type ConnectionStatus,
  type IntegrationConnection,
  type IntegrationEvent,
  type IntegrationEventKind,
  type IntegrationProvider,
} from "./integrations";
import { useApp } from "./store";
import { daysFromNow } from "./format";
import type { Lead } from "./types";

export type ConnectOutcome = "success" | "denied" | "admin_blocked";

interface ImportThreadInput {
  threadId: string;
  messageIds: string[];
  attachmentIds: string[];
  /** link into an existing lead, or create a new one */
  target:
    | { kind: "existing"; leadId: string }
    | {
        kind: "new";
        company: string;
        contactName: string;
        contactEmail: string;
        projectType: string;
      };
  runAnalysis: boolean;
}

interface IntegrationsState {
  connections: IntegrationConnection[];
  events: IntegrationEvent[];
  inboxThreads: typeof seedInboxThreads;
  driveFiles: typeof seedDriveFiles;
  /** provider currently mid-consent (drives the ritual's working state) */
  authorizing: IntegrationProvider | null;

  connection: (p: IntegrationProvider) => IntegrationConnection;
  capabilityGranted: (p: IntegrationProvider, key: CapabilityKey) => boolean;

  beginAuthorization: (p: IntegrationProvider) => void;
  completeAuthorization: (
    p: IntegrationProvider,
    outcome: ConnectOutcome,
    grantedCapabilities: CapabilityKey[]
  ) => void;
  requestCapability: (
    p: IntegrationProvider,
    key: CapabilityKey,
    outcome: "granted" | "declined"
  ) => void;
  simulateExpiry: (p: IntegrationProvider) => void;
  reconnect: (p: IntegrationProvider) => void;
  disconnect: (p: IntegrationProvider, purgeImports: boolean) => void;

  importThread: (input: ImportThreadInput) => string | null;
  attachDriveFiles: (leadId: string, fileIds: string[]) => void;
}

let evId = 100;

function event(
  provider: IntegrationProvider,
  kind: IntegrationEventKind,
  text: string
): IntegrationEvent {
  return {
    id: `ie-live-${evId++}`,
    at: daysFromNow(0, 10),
    provider,
    kind,
    text,
    actorId: "tm-maya",
  };
}

function patchConnection(
  connections: IntegrationConnection[],
  p: IntegrationProvider,
  patch: Partial<IntegrationConnection>
): IntegrationConnection[] {
  return connections.map((c) => (c.provider === p ? { ...c, ...patch } : c));
}

/** Derive status from capability grants: all granted → connected, some → partial. */
function statusFromCapabilities(c: IntegrationConnection): ConnectionStatus {
  const enabled = c.capabilities.filter((x) => x.enabled);
  if (enabled.length === 0) return "connected";
  const granted = enabled.filter((x) => x.granted);
  if (granted.length === enabled.length) return "connected";
  return "partial";
}

export const useIntegrations = create<IntegrationsState>((set, get) => ({
  connections: seedConnections,
  events: seedIntegrationEvents,
  inboxThreads: seedInboxThreads,
  driveFiles: seedDriveFiles,
  authorizing: null,

  connection: (p) => {
    const found = get().connections.find((c) => c.provider === p);
    if (found) return found;
    // never happens with the seed, but keep the accessor total
    return {
      provider: p,
      status: "disconnected",
      sandbox: true,
      capabilities: [],
    };
  },

  capabilityGranted: (p, key) => {
    const c = get().connections.find((x) => x.provider === p);
    if (!c || (c.status !== "connected" && c.status !== "partial")) return false;
    return c.capabilities.some((x) => x.key === key && x.granted);
  },

  beginAuthorization: (p) => {
    set((s) => ({
      authorizing: p,
      events: [
        event(
          p,
          "consent_screen_opened",
          `Authorization started — consent screen at ${PROVIDER_META[p].consentHost} (sandbox simulation)`
        ),
        ...s.events,
      ],
    }));
  },

  completeAuthorization: (p, outcome, grantedCapabilities) => {
    set((s) => {
      if (outcome === "denied") {
        return {
          authorizing: null,
          connections: patchConnection(s.connections, p, {
            status: "disconnected",
            statusDetail:
              "Authorization was cancelled at the consent screen. Nothing was connected and no data was accessed.",
          }),
          events: [
            event(p, "scope_declined", `${PROVIDER_META[p].name} authorization cancelled by user — no access granted`),
            ...s.events,
          ],
        };
      }
      if (outcome === "admin_blocked") {
        return {
          authorizing: null,
          connections: patchConnection(s.connections, p, {
            status: "admin_required",
            statusDetail:
              "Your workspace admin restricts third-party apps. We've prepared an approval request you can forward — connection completes automatically once approved.",
          }),
          events: [
            event(p, "admin_blocked", `${PROVIDER_META[p].name} blocked by organization policy — admin approval requested`),
            ...s.events,
          ],
        };
      }
      const base = s.connections.find((c) => c.provider === p);
      const capabilities = (base?.capabilities ?? []).map((c) => ({
        ...c,
        enabled: grantedCapabilities.includes(c.key) ? true : c.enabled,
        granted: grantedCapabilities.includes(c.key) ? true : c.granted,
      }));
      const next: IntegrationConnection = {
        ...(base as IntegrationConnection),
        status: "connected",
        statusDetail: undefined,
        accountEmail:
          p === "google" ? "maya@ateliernorth.dk" : "maya@ateliernorth.onmicrosoft.com",
        connectedById: "tm-maya",
        connectedAt: daysFromNow(0, 10),
        capabilities,
      };
      next.status = statusFromCapabilities(next);
      const grantedDefs = grantedCapabilities.map((k) => CAPABILITY_BY_KEY[k].label).join(", ");
      return {
        authorizing: null,
        connections: patchConnection(s.connections, p, next),
        events: [
          event(p, "scope_granted", `Granted: ${grantedDefs || "identity only"}`),
          event(p, "connected", `${PROVIDER_META[p].name} connected as ${next.accountEmail}`),
          ...s.events,
        ],
      };
    });
  },

  requestCapability: (p, key, outcome) => {
    set((s) => {
      const connections = s.connections.map((c) => {
        if (c.provider !== p) return c;
        const capabilities = c.capabilities.map((x) =>
          x.key === key
            ? { ...x, enabled: true, granted: outcome === "granted" }
            : x
        );
        const next = { ...c, capabilities };
        next.status = statusFromCapabilities(next);
        next.statusDetail =
          next.status === "partial"
            ? `Connected, but "${CAPABILITY_BY_KEY[key].label}" was declined at the consent screen. The feature stays off; everything else keeps working.`
            : undefined;
        return next;
      });
      return {
        connections,
        events: [
          event(
            p,
            outcome === "granted" ? "scope_granted" : "scope_declined",
            outcome === "granted"
              ? `Granted: ${CAPABILITY_BY_KEY[key].label} (${(CAPABILITY_BY_KEY[key].scopes[p] ?? []).join(", ")})`
              : `Declined at consent: ${CAPABILITY_BY_KEY[key].label} — feature disabled, no scope added`
          ),
          ...s.events,
        ],
      };
    });
  },

  simulateExpiry: (p) => {
    set((s) => ({
      connections: patchConnection(s.connections, p, {
        status: "reconnect_required",
        statusDetail:
          "The refresh token was revoked at the provider (password change or admin action). Imports are paused until you re-authorize — nothing was deleted.",
      }),
      events: [
        event(p, "refresh_failed", `${PROVIDER_META[p].name} token refresh failed — re-authorization required`),
        ...s.events,
      ],
    }));
  },

  reconnect: (p) => {
    set((s) => {
      const c = s.connections.find((x) => x.provider === p);
      const next = { ...(c as IntegrationConnection), statusDetail: undefined };
      next.status = statusFromCapabilities(next);
      return {
        connections: patchConnection(s.connections, p, next),
        events: [
          event(p, "reconnected", `${PROVIDER_META[p].name} re-authorized — existing grants restored, no new scopes requested`),
          ...s.events,
        ],
      };
    });
  },

  disconnect: (p, purgeImports) => {
    set((s) => ({
      connections: patchConnection(s.connections, p, {
        status: "disconnected",
        statusDetail: undefined,
        accountEmail: undefined,
        connectedAt: undefined,
        connectedById: undefined,
        capabilities: s.connections
          .find((c) => c.provider === p)!
          .capabilities.map((c) => ({ ...c, enabled: false, granted: false })),
      }),
      events: [
        ...(purgeImports
          ? [event(p, "data_purged", "Imported raw source content purged — extracted briefs and scopes retained")]
          : []),
        event(
          p,
          "disconnected",
          `${PROVIDER_META[p].name} disconnected — tokens revoked at provider and deleted from the vault`
        ),
        ...s.events,
      ],
    }));
  },

  importThread: (input) => {
    const s = get();
    const thread = s.inboxThreads.find((t) => t.id === input.threadId);
    if (!thread) return null;

    const chosen = thread.messages.filter((m) => input.messageIds.includes(m.id));
    const atts = chosen
      .flatMap((m) => m.attachments)
      .filter((a) => input.attachmentIds.includes(a.id));

    const rawIntake = chosen
      .map(
        (m) =>
          `From: ${m.fromName} <${m.fromEmail}>\nSubject: ${thread.subject}\n\n${m.bodyText}`
      )
      .join("\n\n— — —\n\n");

    const parts = [
      `${chosen.length} message${chosen.length === 1 ? "" : "s"}`,
      ...atts.map((a) => a.name),
    ];

    const app = useApp.getState();
    let leadId: string;

    if (input.target.kind === "existing") {
      leadId = input.target.leadId;
      const existing = app.leads.find((l) => l.id === leadId);
      app.updateLead(leadId, {
        rawIntake: existing?.rawIntake
          ? `${existing.rawIntake}\n\n— — — imported from Gmail — — —\n\n${rawIntake}`
          : rawIntake,
        provenance: {
          source: "gmail",
          ref: thread.id,
          importedAt: daysFromNow(0, 10),
          importedBy: "tm-maya",
          parts,
        },
      });
    } else {
      leadId = `ld-${input.target.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`;
      const lead: Lead = {
        id: leadId,
        company: input.target.company,
        contact: {
          name: input.target.contactName,
          role: "Primary contact",
          email: input.target.contactEmail,
        },
        source: "email",
        projectType: input.target.projectType,
        summary: thread.snippet,
        value: 0,
        stage: "intake",
        risk: "medium",
        tags: ["imported"],
        ownerId: "tm-maya",
        createdAt: daysFromNow(0, 10),
        lastActivityAt: daysFromNow(0, 10),
        rawIntake,
        provenance: {
          source: "gmail",
          ref: thread.id,
          importedAt: daysFromNow(0, 10),
          importedBy: "tm-maya",
          parts,
        },
      };
      app.addLead(lead);
    }

    if (input.runAnalysis) {
      app.runIntakeAnalysis(leadId);
    }

    set((st) => ({
      inboxThreads: st.inboxThreads.map((t) =>
        t.id === thread.id ? { ...t, importedLeadId: leadId } : t
      ),
      connections: patchConnection(st.connections, "google", {
        lastUsedAt: daysFromNow(0, 10),
      }),
      events: [
        event(
          "google",
          "import_completed",
          `Imported "${thread.subject}" (${parts.join(", ")}) → lead workspace`
        ),
        ...st.events,
      ],
    }));

    app.logActivity(
      "lead_created",
      `Thread imported from Gmail: "${thread.subject}" — provenance retained`,
      leadId
    );

    return leadId;
  },

  attachDriveFiles: (leadId, fileIds) => {
    const s = get();
    const files = s.driveFiles.filter((f) => fileIds.includes(f.id));
    if (!files.length) return;
    const app = useApp.getState();
    const lead = app.leads.find((l) => l.id === leadId);
    if (!lead) return;
    const block = files
      .map((f) => `[Attached document: ${f.name} — ${Math.round(f.sizeKb)} KB, via Google Drive]`)
      .join("\n");
    app.updateLead(leadId, {
      rawIntake: lead.rawIntake ? `${lead.rawIntake}\n\n${block}` : block,
      provenance: {
        source: lead.provenance?.source ?? "gmail",
        ref: lead.provenance?.ref,
        importedAt: daysFromNow(0, 10),
        importedBy: "tm-maya",
        parts: [...(lead.provenance?.parts ?? []), ...files.map((f) => f.name)],
      },
    });
    set((st) => ({
      events: [
        event(
          "google",
          "import_completed",
          `Attached ${files.length} Drive file${files.length === 1 ? "" : "s"} to ${lead.company} (${files.map((f) => f.name).join(", ")})`
        ),
        ...st.events,
      ],
    }));
  },
}));
