/* ================================================================
   Integrations domain model + demo seed.
   The real provider plumbing lives in src/server/integrations/*;
   this module is the client-safe shape of connections, the
   capability→scope registry (display copy), and the sandbox data
   that drives the demo experience when no provider credentials
   are configured.
   ================================================================ */

import { daysFromNow } from "./format";

/* ---------------- providers & capabilities ---------------- */

export type IntegrationProvider = "google" | "microsoft";

export type ConnectionStatus =
  | "disconnected"
  | "connected"
  /** connected but at least one enabled capability lost its grant */
  | "partial"
  /** refresh failed — user must re-authorize */
  | "reconnect_required"
  /** workspace admin must approve the app before users can connect */
  | "admin_required"
  | "error";

export type CapabilityKey =
  | "email_import"
  | "send_followups"
  | "drive_files"
  | "calendar_read";

export interface CapabilityDef {
  key: CapabilityKey;
  label: string;
  /** plain-language promise shown before consent */
  what: string;
  /** plain-language boundary — what this explicitly does NOT allow */
  not: string;
  /** why the product needs it */
  why: string;
  /** OAuth scopes per provider; null = not yet offered for that provider */
  scopes: Record<IntegrationProvider, string[] | null>;
  /** Google verification tier — drives trust copy and rollout gating */
  sensitivity: "standard" | "sensitive" | "restricted";
  /** on-demand = only when you click; never background */
  access: "on-demand" | "send-only" | "per-file";
  phase: 1 | 2 | 3;
}

/**
 * The capability registry — every product feature maps to explicit,
 * minimal scopes. Nothing is requested until its capability is enabled.
 */
export const CAPABILITIES: CapabilityDef[] = [
  {
    key: "email_import",
    label: "Import selected email threads",
    what: "Read the specific threads you pick in the import dialog — on demand, when you click.",
    not: "No background mailbox sync. No reading anything you haven't selected. No contacts, no settings.",
    why: "Turns an inbound lead conversation into a structured brief without copy-paste.",
    scopes: {
      google: ["https://www.googleapis.com/auth/gmail.readonly"],
      microsoft: ["Mail.Read"],
    },
    sensitivity: "restricted",
    access: "on-demand",
    phase: 1,
  },
  {
    key: "send_followups",
    label: "Send follow-ups from your address",
    what: "Send the follow-up drafts you approve, from your own email address.",
    not: "Cannot read any email. Cannot send anything you haven't reviewed and clicked send on.",
    why: "Follow-ups land from you, not from a noreply@ — reply rates depend on it.",
    scopes: {
      google: ["https://www.googleapis.com/auth/gmail.send"],
      microsoft: ["Mail.Send"],
    },
    sensitivity: "sensitive",
    access: "send-only",
    phase: 1,
  },
  {
    key: "drive_files",
    label: "Attach selected documents",
    what: "Open the files you pick in the file picker — briefs, decks, transcripts — file by file.",
    not: "No access to your Drive at large. Only files you explicitly choose, nothing else is even listable.",
    why: "Client briefs usually arrive as documents; attach them to the lead without re-uploading.",
    scopes: {
      google: ["https://www.googleapis.com/auth/drive.file"],
      microsoft: ["Files.Read"],
    },
    sensitivity: "standard",
    access: "per-file",
    phase: 1,
  },
  {
    key: "calendar_read",
    label: "Read discovery-call events",
    what: "See titles and attendees of meetings you select, to link calls to leads.",
    not: "No event creation, no edits, no availability sharing.",
    why: "Connect discovery calls and their transcripts to the right lead automatically.",
    scopes: {
      google: ["https://www.googleapis.com/auth/calendar.events.readonly"],
      microsoft: ["Calendars.Read"],
    },
    sensitivity: "sensitive",
    access: "on-demand",
    phase: 2,
  },
];

export const CAPABILITY_BY_KEY = Object.fromEntries(
  CAPABILITIES.map((c) => [c.key, c])
) as Record<CapabilityKey, CapabilityDef>;

export const PROVIDER_META: Record<
  IntegrationProvider,
  {
    name: string;
    short: string;
    domainHint: string;
    consentHost: string;
    phase: 1 | 2;
  }
> = {
  google: {
    name: "Google Workspace",
    short: "Google",
    domainHint: "Gmail · Drive · Calendar",
    consentHost: "accounts.google.com",
    phase: 1,
  },
  microsoft: {
    name: "Microsoft 365",
    short: "Microsoft",
    domainHint: "Outlook · OneDrive · Teams",
    consentHost: "login.microsoftonline.com",
    phase: 2,
  },
};

/** Future connectors shown in the hub as a roadmap, never as fake buttons. */
export const PLANNED_CONNECTORS = [
  { name: "HubSpot", area: "CRM sync" },
  { name: "Pipedrive", area: "CRM sync" },
  { name: "Slack", area: "Lead alerts" },
  { name: "Notion", area: "Brief export" },
  { name: "ClickUp", area: "Delivery handoff" },
  { name: "Stripe", area: "Deposit invoicing" },
];

/* ---------------- connection state ---------------- */

export interface CapabilityState {
  key: CapabilityKey;
  /** user enabled the feature in SCOPEFORGE */
  enabled: boolean;
  /** provider actually granted the scopes (consent completed) */
  granted: boolean;
}

export interface IntegrationConnection {
  provider: IntegrationProvider;
  status: ConnectionStatus;
  /** plain-language explanation of the current status */
  statusDetail?: string;
  accountEmail?: string;
  connectedById?: string;
  connectedAt?: string;
  lastUsedAt?: string;
  capabilities: CapabilityState[];
  /** demo flag — sandbox connections never talk to a real provider */
  sandbox: boolean;
}

export type IntegrationEventKind =
  | "connected"
  | "consent_screen_opened"
  | "scope_granted"
  | "scope_declined"
  | "import_completed"
  | "import_partial"
  | "send_completed"
  | "refresh_failed"
  | "reconnected"
  | "admin_blocked"
  | "disconnected"
  | "data_purged";

export interface IntegrationEvent {
  id: string;
  at: string;
  provider: IntegrationProvider;
  kind: IntegrationEventKind;
  text: string;
  actorId: string;
}

/* ---------------- importable demo content ---------------- */

export interface InboxAttachment {
  id: string;
  name: string;
  mime: string;
  sizeKb: number;
}

export interface InboxMessage {
  id: string;
  fromName: string;
  fromEmail: string;
  at: string;
  bodyText: string;
  attachments: InboxAttachment[];
}

export interface InboxThread {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  receivedAt: string;
  snippet: string;
  messages: InboxMessage[];
  /** already linked to a lead workspace */
  importedLeadId?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mime: string;
  sizeKb: number;
  modifiedAt: string;
  owner: string;
}

/* ---------------- demo seed ---------------- */

export const seedConnections: IntegrationConnection[] = [
  {
    provider: "google",
    status: "partial",
    statusDetail:
      "Connected for thread import and document attach. Sending from your address isn't enabled — follow-ups currently export as drafts.",
    accountEmail: "maya@ateliernorth.dk",
    connectedById: "tm-maya",
    connectedAt: daysFromNow(-12),
    lastUsedAt: daysFromNow(0, 7),
    sandbox: true,
    capabilities: [
      { key: "email_import", enabled: true, granted: true },
      { key: "drive_files", enabled: true, granted: true },
      { key: "send_followups", enabled: false, granted: false },
      { key: "calendar_read", enabled: false, granted: false },
    ],
  },
  {
    provider: "microsoft",
    status: "disconnected",
    sandbox: true,
    capabilities: [
      { key: "email_import", enabled: false, granted: false },
      { key: "drive_files", enabled: false, granted: false },
      { key: "send_followups", enabled: false, granted: false },
      { key: "calendar_read", enabled: false, granted: false },
    ],
  },
];

export const seedIntegrationEvents: IntegrationEvent[] = [
  {
    id: "ie-1",
    at: daysFromNow(0, 7),
    provider: "google",
    kind: "import_completed",
    text: "Imported 1 thread (1 message) from Gmail → Harbor & Fern lead workspace",
    actorId: "tm-elise",
  },
  {
    id: "ie-2",
    at: daysFromNow(-2, 15),
    provider: "google",
    kind: "import_completed",
    text: "Attached 2 Drive files to Aurelia Hospitality brief (Aurelia_Casas_Concept.pdf, stakeholder-notes.docx)",
    actorId: "tm-tom",
  },
  {
    id: "ie-3",
    at: daysFromNow(-5, 11),
    provider: "google",
    kind: "scope_declined",
    text: "Send-from-your-address was declined at the consent screen — follow-ups stay manual",
    actorId: "tm-maya",
  },
  {
    id: "ie-4",
    at: daysFromNow(-12, 9),
    provider: "google",
    kind: "scope_granted",
    text: "Granted: read selected threads (gmail.readonly), per-file Drive access (drive.file)",
    actorId: "tm-maya",
  },
  {
    id: "ie-5",
    at: daysFromNow(-12, 9),
    provider: "google",
    kind: "connected",
    text: "Google Workspace connected as maya@ateliernorth.dk",
    actorId: "tm-maya",
  },
];

/** Sandbox inbox — what the Gmail import picker shows. */
export const seedInboxThreads: InboxThread[] = [
  {
    id: "th-bryggen",
    subject: "Website + booking system for our padel club",
    fromName: "Mikkel Østergaard",
    fromEmail: "mikkel@bryggenpadel.dk",
    receivedAt: daysFromNow(0, 6),
    snippet:
      "We're opening our second location in August and the current site can't handle court booking…",
    messages: [
      {
        id: "msg-bryggen-1",
        fromName: "Mikkel Østergaard",
        fromEmail: "mikkel@bryggenpadel.dk",
        at: daysFromNow(0, 6),
        bodyText: `Hi Atelier North,

Ida from Roastery Nord said you were the right people for this.

We run Bryggen Padel — two halls in Copenhagen, opening a third in Aarhus in August. Our website is a Squarespace page from 2023 and bookings run through a Facebook group, which is as bad as it sounds. Roughly 900 active members.

What we think we need:
- a proper site that doesn't embarrass us with sponsors
- court booking with membership tiers (we have 3)
- payments online (MobilePay is a must here)
- something the staff can update without calling anyone

We've set aside 150-200k DKK for this. The Aarhus opening is August 15 and pre-sales should start a month before.

Can we talk this week? Evenings work best, we're on court during the day.

Mikkel`,
        attachments: [
          { id: "att-bryggen-1", name: "bryggen-membership-tiers.pdf", mime: "application/pdf", sizeKb: 420 },
        ],
      },
    ],
  },
  {
    id: "th-harborfern",
    subject: "Paid ads help — running out of runway on Meta",
    fromName: "Sofie Brandt",
    fromEmail: "sofie@harborfern.com",
    receivedAt: daysFromNow(0, 7),
    snippet: "I got your name from Anna at Veldt Cycles. We're Harbor & Fern, we sell…",
    importedLeadId: "ld-harborfern",
    messages: [
      {
        id: "msg-hf-1",
        fromName: "Sofie Brandt",
        fromEmail: "sofie@harborfern.com",
        at: daysFromNow(0, 7),
        bodyText:
          "(Already imported to the Harbor & Fern lead workspace — open it from Leads.)",
        attachments: [],
      },
    ],
  },
  {
    id: "th-vey-copy",
    subject: "RE: RE: Copy planning for the new site",
    fromName: "Camille Aubert",
    fromEmail: "c.aubert@maisonvey.fr",
    receivedAt: daysFromNow(-1, 14),
    snippet: "Following up on the copy batches — Théo has the first 400 SKUs drafted and…",
    messages: [
      {
        id: "msg-vey-1",
        fromName: "Camille Aubert",
        fromEmail: "c.aubert@maisonvey.fr",
        at: daysFromNow(-1, 14),
        bodyText: `Jonas,

Following up on the copy batches — Théo has the first 400 SKUs drafted and Hélène wants to review tone on a sample of 20 before we proceed. Can your team flag which 20 templates would be most representative?

Also: the Studio Hervé assets are confirmed for the 19th.

Camille`,
        attachments: [
          { id: "att-vey-1", name: "copy-batch-01-sample.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeKb: 86 },
        ],
      },
    ],
  },
  {
    id: "th-aurelia-naming",
    subject: "Naming decision process — internal note",
    fromName: "Marco Teixeira",
    fromEmail: "m.teixeira@aureliagroup.pt",
    receivedAt: daysFromNow(-1, 10),
    snippet: "Tom — spoke with Beatriz. She's open to being the tie-break but wants Nuno to feel…",
    messages: [
      {
        id: "msg-aurelia-1",
        fromName: "Marco Teixeira",
        fromEmail: "m.teixeira@aureliagroup.pt",
        at: daysFromNow(-1, 10),
        bodyText: `Tom — spoke with Beatriz. She's open to being the tie-break but wants Nuno to feel heard on naming, so expect one structured naming review with all three of us. On "Aurelia Casas": treat it as a strong working title, not locked.

Does that unblock your scoping? Marco`,
        attachments: [],
      },
    ],
  },
  {
    id: "th-loom",
    subject: "Loom walkthrough of our quoting mess (14 min)",
    fromName: "Petra Lindholm",
    fromEmail: "petra@nordicgardenrooms.se",
    receivedAt: daysFromNow(-2, 9),
    snippet: "Recorded a walkthrough of how we currently quote garden rooms — it takes us 9 days…",
    messages: [
      {
        id: "msg-loom-1",
        fromName: "Petra Lindholm",
        fromEmail: "petra@nordicgardenrooms.se",
        at: daysFromNow(-2, 9),
        bodyText: `Hello,

Found you via the Stratus HVAC case. Recorded a Loom walkthrough of how we currently quote garden rooms — it takes us 9 days on average and we lose maybe a third of inquiries to faster competitors: loom.com/share/8f3a…(transcript attached)

We're 14 people, ~25 quotes/month, average order 380k SEK. If you can do for us what you did for Stratus, what does that cost?

Petra Lindholm
Nordic Garden Rooms AB`,
        attachments: [
          { id: "att-loom-1", name: "loom-transcript-quoting-walkthrough.txt", mime: "text/plain", sizeKb: 31 },
        ],
      },
    ],
  },
];

/** Sandbox Drive picker contents. */
export const seedDriveFiles: DriveFile[] = [
  { id: "df-1", name: "Aurelia_Casas_Concept.pdf", mime: "application/pdf", sizeKb: 4820, modifiedAt: daysFromNow(-3), owner: "m.teixeira@aureliagroup.pt" },
  { id: "df-2", name: "stakeholder-notes.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sizeKb: 64, modifiedAt: daysFromNow(-2), owner: "tom@ateliernorth.dk" },
  { id: "df-3", name: "bryggen-membership-tiers.pdf", mime: "application/pdf", sizeKb: 420, modifiedAt: daysFromNow(0, 6), owner: "mikkel@bryggenpadel.dk" },
  { id: "df-4", name: "vey-discovery-call-transcript.txt", mime: "text/plain", sizeKb: 22, modifiedAt: daysFromNow(-9), owner: "jonas@ateliernorth.dk" },
  { id: "df-5", name: "northgate-locations-audit.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeKb: 310, modifiedAt: daysFromNow(-8), owner: "lukas@ateliernorth.dk" },
];
