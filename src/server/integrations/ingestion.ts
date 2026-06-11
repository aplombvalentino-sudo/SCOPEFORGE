/* ================================================================
   Ingestion service — turns a user-confirmed thread selection into
   persisted imported_threads / imported_messages / imported_documents
   rows with provenance.

   Guarantees:
   - Dedupe on (accountId, providerMessageId): re-importing a thread
     that grew new replies imports only the new messages.
   - Partial success: one failed message never aborts the batch — it
     lands in IngestionResult.failed with its error code.
   - Body cap (256KB): oversized bodies are cut at the cap and flagged
     truncated; the full original stays at the provider.
   - Attachments are never persisted inline: we store the reference
     (provider ids, name, size) and fetch bytes on demand through
     ProviderAdapter.getAttachment when the user opens the file.

   Production swap points: StorePort/AuditPort — the Supabase
   implementations replace the in-memory ports; this class is final.
   ================================================================ */

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { writeAudit } from "./audit";
import {
  ProviderError,
  type AuditPort,
  type ImportProvenance,
  type IngestionResult,
  type NormalizedThread,
  type ProviderAdapter,
  type ProviderErrorCode,
  type StorePort,
} from "./types";

export const BODY_CAP_BYTES = 256 * 1024;

export interface ImportSelection {
  messageIds: string[];
  attachmentIds: string[];
}

function codeOf(error: unknown): ProviderErrorCode {
  return error instanceof ProviderError ? error.code : "network";
}

/** Cuts a body at the byte cap on a character boundary. */
function capBody(text: string): { text: string; truncated: boolean } {
  if (Buffer.byteLength(text, "utf8") <= BODY_CAP_BYTES) {
    return { text, truncated: false };
  }
  let end = BODY_CAP_BYTES;
  let out = text.slice(0, end);
  while (Buffer.byteLength(out, "utf8") > BODY_CAP_BYTES && end > 0) {
    end = Math.floor(end * 0.9);
    out = text.slice(0, end);
  }
  return { text: out, truncated: true };
}

export class IngestionService {
  constructor(
    private readonly store: StorePort,
    private readonly audit: AuditPort
  ) {}

  /**
   * Imports the user's selection from one thread into a lead workspace.
   * threadRef is the provider thread id; selection holds the message
   * and attachment ids the user ticked in the import dialog — nothing
   * outside the selection is fetched beyond headers.
   */
  async importThread(
    workspaceId: string,
    accountId: string,
    adapter: ProviderAdapter,
    threadRef: string,
    selection: ImportSelection,
    leadWorkspaceId: string
  ): Promise<IngestionResult> {
    await writeAudit(this.audit, {
      name: "import.started",
      workspaceId,
      provider: adapter.provider,
      payload: {
        threadRef,
        selectedMessages: selection.messageIds.length,
        selectedAttachments: selection.attachmentIds.length,
        leadWorkspaceId,
      },
    });

    const result: IngestionResult = { imported: 0, skippedDuplicates: 0, failed: [] };

    // Thread metadata (headers only). A thread-level failure means there
    // is nothing to iterate — audit and rethrow with its typed code.
    let thread: NormalizedThread;
    try {
      thread = await adapter.getThread(threadRef);
    } catch (error) {
      await writeAudit(this.audit, {
        name: "import.failed",
        workspaceId,
        provider: adapter.provider,
        payload: { threadRef, code: codeOf(error) },
      });
      throw error;
    }

    const provenance: ImportProvenance = {
      source: adapter.provider,
      ref: threadRef,
      importedAt: new Date().toISOString(),
      importedByAccountId: accountId,
    };

    await this.store.insertThread({
      id: randomUUID(),
      workspaceId,
      accountId,
      leadWorkspaceId,
      providerThreadId: threadRef,
      subject: thread.subject,
      lastMessageAt: thread.lastMessageAt,
      messageCount: selection.messageIds.length,
      provenance,
    });

    const wantedAttachments = new Set(selection.attachmentIds);

    for (const messageId of selection.messageIds) {
      try {
        const duplicate = await this.store.findMessageByProviderId(
          accountId,
          messageId
        );
        if (duplicate) {
          result.skippedDuplicates++;
          continue;
        }

        // Full fetch happens here and only here — for confirmed ids.
        const message = await adapter.getMessage(messageId);
        const body = capBody(message.bodyText);

        await this.store.insertMessage({
          id: randomUUID(),
          workspaceId,
          accountId,
          leadWorkspaceId,
          providerThreadId: threadRef,
          providerMessageId: message.providerMessageId,
          internetMessageId: message.internetMessageId,
          fromEmail: message.from.email,
          fromName: message.from.name,
          at: message.at,
          subject: message.subject,
          bodyText: body.text,
          truncated: body.truncated || message.truncated,
          provenance,
        });

        for (const attachment of message.attachments) {
          if (!wantedAttachments.has(attachment.providerAttachmentId)) continue;
          // Reference only — bytes are fetched on demand via
          // adapter.getAttachment when the user opens the document.
          await this.store.insertDocument({
            id: randomUUID(),
            workspaceId,
            accountId,
            leadWorkspaceId,
            providerMessageId: message.providerMessageId,
            providerAttachmentId: attachment.providerAttachmentId,
            name: attachment.name,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            storage: "reference",
            provenance,
          });
        }

        result.imported++;
      } catch (error) {
        // Partial success: record the failure, keep going.
        result.failed.push({ ref: messageId, code: codeOf(error) });
      }
    }

    const outcome =
      result.failed.length === 0
        ? "import.completed"
        : result.imported > 0
          ? "import.partial"
          : "import.failed";

    await writeAudit(this.audit, {
      name: outcome,
      workspaceId,
      provider: adapter.provider,
      payload: {
        threadRef,
        imported: result.imported,
        skippedDuplicates: result.skippedDuplicates,
        failedCount: result.failed.length,
        failedCodes: result.failed.map((f) => f.code),
      },
    });

    return result;
  }
}
