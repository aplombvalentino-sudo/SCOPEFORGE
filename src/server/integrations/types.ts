/* ================================================================
   Server-side integration contracts.

   Everything that talks to a provider, persists imported content, or
   audits an action does it through these types. The provider adapters
   (providers/google.ts, providers/microsoft.ts) normalize wire formats
   into Normalized* shapes; the ingestion service persists them through
   StorePort; every security-relevant action lands in AuditPort.

   Production swap points:
   - InMemoryStorePort / InMemoryAuditPort are process-local stand-ins.
     The Supabase implementations (tables: integration_accounts,
     imported_threads, imported_messages, imported_documents,
     integration_audit) implement the same two interfaces and replace
     them in service.ts — nothing else changes.
   ================================================================ */

import type { IntegrationProvider } from "@/lib/integrations";

/* ---------------- tokens ---------------- */

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  /** epoch milliseconds when the access token stops working */
  expiresAt: number;
  /** scopes the provider actually granted (may be fewer than requested) */
  scopes: string[];
}

/** Async access-token source — service.refreshIfNeeded sits behind this. */
export type AccessTokenProvider = () => Promise<string>;

/* ---------------- error taxonomy ---------------- */

export type ProviderErrorCode =
  | "consent_required"
  | "admin_blocked"
  | "reconnect_required"
  | "rate_limited"
  | "source_gone"
  | "permission_revoked"
  | "network"
  | "provider_unavailable"
  | "invalid_request";

/**
 * The only error type that crosses the provider boundary. Carries a
 * machine-readable code (drives UX states) and a short provider detail
 * (an error reason string — never tokens, never message content).
 */
export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  /** present for rate_limited when the provider told us how long to wait */
  readonly retryAfterMs?: number;
  /** short provider-supplied reason/code for diagnostics */
  readonly providerDetail?: string;

  constructor(
    code: ProviderErrorCode,
    message: string,
    options?: { retryAfterMs?: number; providerDetail?: string }
  ) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.retryAfterMs = options?.retryAfterMs;
    this.providerDetail = options?.providerDetail;
  }
}

/* ---------------- normalized content shapes ---------------- */

export interface NormalizedAttachmentRef {
  providerAttachmentId: string;
  providerMessageId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface NormalizedMessage {
  providerMessageId: string;
  providerThreadId?: string;
  /** RFC 5322 Message-ID header — stable across mailboxes and providers */
  internetMessageId?: string;
  from: { name?: string; email: string };
  /** ISO timestamp */
  at: string;
  subject?: string;
  /** plain text body; empty for header-only (metadata) fetches */
  bodyText: string;
  /** true when the body was cut at the size cap */
  truncated: boolean;
  attachments: NormalizedAttachmentRef[];
}

export interface NormalizedThread {
  providerThreadId: string;
  subject?: string;
  snippet?: string;
  lastMessageAt?: string;
  messageCount?: number;
  /**
   * Header-level messages (From / Subject / Date). Bodies arrive one
   * message at a time via ProviderAdapter.getMessage — the two-step
   * minimal-fetch keeps unselected mail out of memory entirely.
   */
  messages: NormalizedMessage[];
}

export interface NormalizedDocument {
  providerFileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  modifiedAt?: string;
  ownerEmail?: string;
  webUrl?: string;
}

/* ---------------- provider adapter contract ---------------- */

export interface ThreadListPage {
  threads: NormalizedThread[];
  /** opaque continuation token (Gmail nextPageToken / Graph @odata.nextLink) */
  nextPageToken?: string;
}

export interface OutboundDraft {
  to: { name?: string; email: string }[];
  subject: string;
  bodyText: string;
  /** Message-ID being replied to — keeps the reply threaded at the recipient */
  inReplyTo?: string;
  references?: string[];
  /** provider thread/conversation to append to, when replying */
  providerThreadId?: string;
}

export interface SendReceipt {
  /** absent for Microsoft sendMail, which returns 202 with no body */
  providerMessageId?: string;
  providerThreadId?: string;
  at: string;
}

export interface AttachmentContent {
  data: Uint8Array;
  sizeBytes: number;
  name?: string;
  mimeType?: string;
}

/**
 * One adapter per provider account. Adapters are stateless apart from
 * their AccessTokenProvider; every method throws ProviderError on
 * failure — no raw HTTP errors escape this boundary.
 */
export interface ProviderAdapter {
  readonly provider: IntegrationProvider;
  listThreads(query: string, pageToken?: string): Promise<ThreadListPage>;
  getThread(id: string): Promise<NormalizedThread>;
  getMessage(id: string): Promise<NormalizedMessage>;
  getAttachment(messageId: string, attachmentId: string): Promise<AttachmentContent>;
  sendMessage(draft: OutboundDraft): Promise<SendReceipt>;
  /** best-effort provider-side revocation; disconnect proceeds either way */
  revoke(): Promise<void>;
}

/* ---------------- persistence ports ---------------- */

export interface StoredAccount {
  /** stable id, e.g. "ws-…:google" */
  id: string;
  workspaceId: string;
  provider: IntegrationProvider;
  accountEmail: string;
  /** vault ciphertext ("v1:…") — plaintext tokens never touch the store */
  encryptedTokens: string;
  scopes: string[];
  status: "active" | "reconnect_required" | "revoked";
  createdAt: string;
  updatedAt: string;
}

/** Provenance attached to every imported record — who/where/when. */
export interface ImportProvenance {
  source: IntegrationProvider;
  /** provider thread id the content came from */
  ref: string;
  importedAt: string;
  importedByAccountId: string;
}

export interface ImportedThreadRecord {
  id: string;
  workspaceId: string;
  accountId: string;
  leadWorkspaceId: string;
  providerThreadId: string;
  subject?: string;
  lastMessageAt?: string;
  messageCount: number;
  provenance: ImportProvenance;
}

export interface ImportedMessageRecord {
  id: string;
  workspaceId: string;
  accountId: string;
  leadWorkspaceId: string;
  providerThreadId: string;
  providerMessageId: string;
  internetMessageId?: string;
  fromEmail: string;
  fromName?: string;
  at: string;
  subject?: string;
  /** capped at the ingestion body limit; truncated flags the cut */
  bodyText: string;
  truncated: boolean;
  provenance: ImportProvenance;
}

export interface ImportedDocumentRecord {
  id: string;
  workspaceId: string;
  accountId: string;
  leadWorkspaceId: string;
  providerMessageId: string;
  providerAttachmentId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** attachment bytes are never persisted inline — fetched on demand */
  storage: "reference";
  provenance: ImportProvenance;
}

/**
 * Persistence boundary. The Supabase implementation slots in behind
 * this interface; until then InMemoryStorePort (below) backs the
 * service in-process.
 */
export interface StorePort {
  getAccount(accountId: string): Promise<StoredAccount | null>;
  findAccount(
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<StoredAccount | null>;
  listAccounts(workspaceId: string): Promise<StoredAccount[]>;
  upsertAccount(account: StoredAccount): Promise<void>;
  deleteAccount(accountId: string): Promise<void>;

  /** dedupe lookup on (accountId, providerMessageId) */
  findMessageByProviderId(
    accountId: string,
    providerMessageId: string
  ): Promise<ImportedMessageRecord | null>;
  insertThread(record: ImportedThreadRecord): Promise<void>;
  insertMessage(record: ImportedMessageRecord): Promise<void>;
  insertDocument(record: ImportedDocumentRecord): Promise<void>;

  /** deletes imported raw content for a provider; returns rows removed */
  purgeImportedContent(
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<number>;
}

/** A single audit row. Payloads arrive pre-redacted via audit.writeAudit. */
export interface AuditEntry {
  at: string;
  workspaceId: string;
  event: string;
  payload: Record<string, unknown>;
}

/** Append-only audit sink. Supabase table integration_audit slots in here. */
export interface AuditPort {
  append(entry: AuditEntry): Promise<void>;
}

/* ---------------- ingestion result ---------------- */

export interface IngestionResult {
  imported: number;
  skippedDuplicates: number;
  /** per-message failures — partial success, the batch never aborts */
  failed: { ref: string; code: ProviderErrorCode }[];
}

/* ---------------- in-memory ports (pre-Supabase) ---------------- */

/**
 * Process-local StorePort. Correct semantics (keys, dedupe, purge
 * counting) but no durability — replaced by the Supabase adapter in
 * production. Useful as-is for tests and local live-mode trials.
 */
export class InMemoryStorePort implements StorePort {
  private readonly accounts = new Map<string, StoredAccount>();
  private readonly threads = new Map<string, ImportedThreadRecord>();
  private readonly messages = new Map<string, ImportedMessageRecord>();
  private readonly documents = new Map<string, ImportedDocumentRecord>();

  async getAccount(accountId: string): Promise<StoredAccount | null> {
    return this.accounts.get(accountId) ?? null;
  }

  async findAccount(
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<StoredAccount | null> {
    for (const account of this.accounts.values()) {
      if (account.workspaceId === workspaceId && account.provider === provider) {
        return account;
      }
    }
    return null;
  }

  async listAccounts(workspaceId: string): Promise<StoredAccount[]> {
    return [...this.accounts.values()].filter((a) => a.workspaceId === workspaceId);
  }

  async upsertAccount(account: StoredAccount): Promise<void> {
    this.accounts.set(account.id, account);
  }

  async deleteAccount(accountId: string): Promise<void> {
    this.accounts.delete(accountId);
  }

  async findMessageByProviderId(
    accountId: string,
    providerMessageId: string
  ): Promise<ImportedMessageRecord | null> {
    return this.messages.get(`${accountId}:${providerMessageId}`) ?? null;
  }

  async insertThread(record: ImportedThreadRecord): Promise<void> {
    // Upsert by (accountId, providerThreadId): re-importing a thread that
    // grew new replies refreshes the thread row instead of duplicating it.
    this.threads.set(`${record.accountId}:${record.providerThreadId}`, record);
  }

  async insertMessage(record: ImportedMessageRecord): Promise<void> {
    this.messages.set(`${record.accountId}:${record.providerMessageId}`, record);
  }

  async insertDocument(record: ImportedDocumentRecord): Promise<void> {
    this.documents.set(
      `${record.accountId}:${record.providerMessageId}:${record.providerAttachmentId}`,
      record
    );
  }

  async purgeImportedContent(
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<number> {
    let removed = 0;
    for (const [key, record] of this.threads) {
      if (record.workspaceId === workspaceId && record.provenance.source === provider) {
        this.threads.delete(key);
        removed++;
      }
    }
    for (const [key, record] of this.messages) {
      if (record.workspaceId === workspaceId && record.provenance.source === provider) {
        this.messages.delete(key);
        removed++;
      }
    }
    for (const [key, record] of this.documents) {
      if (record.workspaceId === workspaceId && record.provenance.source === provider) {
        this.documents.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

/** Process-local AuditPort — replaced by the Supabase audit table. */
export class InMemoryAuditPort implements AuditPort {
  private readonly log: AuditEntry[] = [];

  async append(entry: AuditEntry): Promise<void> {
    this.log.push(entry);
  }

  entries(): readonly AuditEntry[] {
    return [...this.log];
  }
}
