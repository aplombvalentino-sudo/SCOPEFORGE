/* ================================================================
   Microsoft adapter — Graph v1.0 over raw fetch (no SDK).

   Base: https://graph.microsoft.com/v1.0

   Graph models mail as messages with a conversationId, not threads —
   listThreads groups a $select-projected /me/messages page by
   conversation. Bodies are only fetched in getMessage (with
   Prefer: outlook.body-content-type="text"), one message at a time,
   for user-confirmed selections — the same two-step minimal fetch as
   the Gmail adapter.

   Error mapping: 401 / InvalidAuthenticationToken → reconnect_required,
   403 with AADSTS65001 or ErrorAccessDenied + admin hint →
   admin_blocked, 429 → rate_limited honoring Retry-After,
   404 → source_gone, 503 → provider_unavailable.

   Production swap points: none — this is the production adapter.
   ================================================================ */

import { Buffer } from "node:buffer";
import { fetchJson } from "../http";
import {
  ProviderError,
  type AccessTokenProvider,
  type AttachmentContent,
  type NormalizedAttachmentRef,
  type NormalizedMessage,
  type NormalizedThread,
  type OutboundDraft,
  type ProviderAdapter,
  type SendReceipt,
  type ThreadListPage,
} from "../types";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const PAGE_SIZE = 25;
const LIST_SELECT =
  "id,conversationId,subject,from,receivedDateTime,bodyPreview,hasAttachments";

/* ---------------- wire shapes ---------------- */

interface GraphRecipient {
  emailAddress?: { name?: string; address?: string };
}

interface GraphMessage {
  id: string;
  conversationId?: string;
  subject?: string;
  from?: GraphRecipient;
  receivedDateTime?: string;
  bodyPreview?: string;
  hasAttachments?: boolean;
  internetMessageId?: string;
  body?: { contentType?: string; content?: string };
}

interface GraphPage<T> {
  value: T[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
}

interface GraphAttachment {
  id: string;
  name?: string;
  size?: number;
  contentType?: string;
  contentBytes?: string;
}

interface GraphErrorBody {
  error?: { code?: string; message?: string };
}

/* ---------------- error mapping ---------------- */

function mapGraphError(status: number, bodyText: string): ProviderError | undefined {
  let code = "";
  let message = "";
  try {
    const parsed = JSON.parse(bodyText) as GraphErrorBody;
    code = parsed.error?.code ?? "";
    message = parsed.error?.message ?? "";
  } catch {
    // non-JSON error body — defaults apply
  }
  const providerDetail = code || undefined;
  if (status === 401 || code === "InvalidAuthenticationToken") {
    return new ProviderError(
      "reconnect_required",
      "The Microsoft session is no longer valid — the account must be re-connected.",
      { providerDetail }
    );
  }
  if (status === 403) {
    if (
      message.includes("AADSTS65001") ||
      (code === "ErrorAccessDenied" && /admin|consent|polic/i.test(message))
    ) {
      return new ProviderError(
        "admin_blocked",
        "A Microsoft 365 policy requires admin consent before this app can be used.",
        { providerDetail }
      );
    }
    return new ProviderError(
      "permission_revoked",
      "Microsoft Graph refused this action with the current grants.",
      { providerDetail }
    );
  }
  if (status === 404 || code === "ErrorItemNotFound") {
    return new ProviderError(
      "source_gone",
      "This message no longer exists in the mailbox.",
      { providerDetail }
    );
  }
  if (status === 503) {
    return new ProviderError(
      "provider_unavailable",
      "Microsoft Graph is temporarily unavailable.",
      { providerDetail }
    );
  }
  return undefined; // 429 / other 5xx handled by the http layer defaults
}

/* ---------------- parsing helpers ---------------- */

function fromOf(message: GraphMessage): { name?: string; email: string } {
  const address = message.from?.emailAddress;
  return {
    name: address?.name || undefined,
    email: (address?.address ?? "unknown").toLowerCase(),
  };
}

function atOf(message: GraphMessage): string {
  if (message.receivedDateTime) {
    const parsed = Date.parse(message.receivedDateTime);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  return new Date(0).toISOString();
}

/* ---------------- adapter ---------------- */

export class GraphAdapter implements ProviderAdapter {
  readonly provider = "microsoft" as const;

  constructor(private readonly accessToken: AccessTokenProvider) {}

  /**
   * Lists recent mail via /me/messages with a minimal $select and
   * groups the page by conversationId. pageToken is the full
   * @odata.nextLink URL from the previous page.
   */
  async listThreads(query: string, pageToken?: string): Promise<ThreadListPage> {
    let url: string;
    if (pageToken) {
      url = pageToken;
    } else {
      const u = new URL(`${GRAPH_BASE}/me/messages`);
      u.searchParams.set("$select", LIST_SELECT);
      u.searchParams.set("$top", String(PAGE_SIZE));
      if (query) {
        // Graph rejects $orderby combined with $search; search results
        // come back relevance-ranked instead of date-sorted.
        u.searchParams.set("$search", `"${query.replace(/"/g, '\\"')}"`);
      } else {
        u.searchParams.set("$orderby", "receivedDateTime desc");
      }
      url = u.toString();
    }
    const page = await this.get<GraphPage<GraphMessage>>(url);

    const byConversation = new Map<string, NormalizedThread>();
    for (const message of page.value) {
      const headerMessage = this.headerMessage(message);
      const key = message.conversationId ?? message.id;
      const existing = byConversation.get(key);
      if (existing) {
        existing.messages.push(headerMessage);
        existing.messageCount = existing.messages.length;
        if (!existing.lastMessageAt || headerMessage.at > existing.lastMessageAt) {
          existing.lastMessageAt = headerMessage.at;
        }
      } else {
        byConversation.set(key, {
          providerThreadId: key,
          subject: message.subject,
          snippet: message.bodyPreview,
          lastMessageAt: headerMessage.at,
          messageCount: 1,
          messages: [headerMessage],
        });
      }
    }
    return {
      threads: [...byConversation.values()],
      nextPageToken: page["@odata.nextLink"],
    };
  }

  /** Header-level conversation fetch — bodies stay at the provider. */
  async getThread(id: string): Promise<NormalizedThread> {
    const u = new URL(`${GRAPH_BASE}/me/messages`);
    u.searchParams.set("$select", LIST_SELECT);
    u.searchParams.set("$filter", `conversationId eq '${id.replace(/'/g, "''")}'`);
    u.searchParams.set("$top", "50");
    const page = await this.get<GraphPage<GraphMessage>>(u.toString());
    if (page.value.length === 0) {
      throw new ProviderError(
        "source_gone",
        "This conversation no longer exists in the mailbox."
      );
    }
    // Graph disallows $orderby alongside this $filter — sort locally.
    const messages = page.value
      .map((m) => this.headerMessage(m))
      .sort((a, b) => a.at.localeCompare(b.at));
    return {
      providerThreadId: id,
      subject: page.value[0].subject,
      lastMessageAt: messages[messages.length - 1].at,
      messageCount: messages.length,
      messages,
    };
  }

  /**
   * Full message fetch — only for user-confirmed selections. The
   * Prefer header asks Graph to convert the body to plain text
   * server-side, so HTML never needs client-side stripping.
   */
  async getMessage(id: string): Promise<NormalizedMessage> {
    const u = new URL(`${GRAPH_BASE}/me/messages/${encodeURIComponent(id)}`);
    u.searchParams.set("$select", `${LIST_SELECT},internetMessageId,body`);
    const message = await this.get<GraphMessage>(u.toString(), {
      Prefer: 'outlook.body-content-type="text"',
    });

    let attachments: NormalizedAttachmentRef[] = [];
    if (message.hasAttachments) {
      const au = new URL(
        `${GRAPH_BASE}/me/messages/${encodeURIComponent(id)}/attachments`
      );
      au.searchParams.set("$select", "id,name,size,contentType");
      const page = await this.get<GraphPage<GraphAttachment>>(au.toString());
      attachments = page.value.map((a) => ({
        providerAttachmentId: a.id,
        providerMessageId: id,
        name: a.name ?? "attachment",
        mimeType: a.contentType ?? "application/octet-stream",
        sizeBytes: a.size ?? 0,
      }));
    }

    return {
      providerMessageId: message.id,
      providerThreadId: message.conversationId,
      internetMessageId: message.internetMessageId,
      from: fromOf(message),
      at: atOf(message),
      subject: message.subject,
      bodyText: message.body?.content ?? message.bodyPreview ?? "",
      truncated: false,
      attachments,
    };
  }

  async getAttachment(
    messageId: string,
    attachmentId: string
  ): Promise<AttachmentContent> {
    const url =
      `${GRAPH_BASE}/me/messages/${encodeURIComponent(messageId)}` +
      `/attachments/${encodeURIComponent(attachmentId)}`;
    const attachment = await this.get<GraphAttachment>(url);
    if (!attachment.contentBytes) {
      // Item/reference attachments carry no inline bytes — v1 imports
      // file attachments only.
      throw new ProviderError(
        "invalid_request",
        "This attachment type has no downloadable content (v1 supports file attachments only)."
      );
    }
    const data = new Uint8Array(Buffer.from(attachment.contentBytes, "base64"));
    return {
      data,
      sizeBytes: data.byteLength,
      name: attachment.name,
      mimeType: attachment.contentType,
    };
  }

  /**
   * Sends via /me/sendMail (requires Mail.Send). Graph returns 202
   * with an empty body and no message id, so the receipt carries no
   * providerMessageId; flows that need the sent item switch to the
   * create-draft → send → read pattern.
   */
  async sendMessage(draft: OutboundDraft): Promise<SendReceipt> {
    const payload = {
      message: {
        subject: draft.subject,
        body: { contentType: "Text", content: draft.bodyText },
        toRecipients: draft.to.map((recipient) => ({
          emailAddress: { address: recipient.email, name: recipient.name },
        })),
      },
      saveToSentItems: true,
    };
    await fetchJson<void>(`${GRAPH_BASE}/me/sendMail`, {
      method: "POST",
      headers: { ...(await this.authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Never retried after an ambiguous failure — a duplicate follow-up
      // is worse than asking the user to confirm the send went out.
      idempotent: false,
      mapError: mapGraphError,
    });
    return { providerThreadId: draft.providerThreadId, at: new Date().toISOString() };
  }

  /**
   * Delta sync — NOT used in v1. This powers the future "Advanced
   * sync" mode: a Graph change-notification webhook wakes a worker,
   * which drains this delta query to pick up new mail in the watched
   * folder without re-listing it. v1 is strictly on-demand (the user
   * clicks import); no background sync runs.
   *
   * Returns the page items plus the link to pass back next time:
   * @odata.nextLink while draining, @odata.deltaLink once caught up.
   */
  async getDeltaPage(
    conversationFolder: string,
    deltaLink?: string
  ): Promise<{ items: NormalizedMessage[]; deltaLink?: string }> {
    let url: string;
    if (deltaLink) {
      url = deltaLink;
    } else {
      const u = new URL(
        `${GRAPH_BASE}/me/mailFolders/${encodeURIComponent(conversationFolder)}/messages/delta`
      );
      u.searchParams.set("$select", LIST_SELECT);
      url = u.toString();
    }
    const page = await this.get<GraphPage<GraphMessage>>(url);
    return {
      items: page.value.map((m) => this.headerMessage(m)),
      deltaLink: page["@odata.deltaLink"] ?? page["@odata.nextLink"],
    };
  }

  /**
   * Microsoft identity platform exposes no self-serve revocation
   * endpoint for delegated refresh tokens. Deleting the vault entry is
   * the effective local revocation; org admins can revoke sessions
   * centrally. Kept as an explicit no-op so disconnect flows read the
   * same for both providers.
   */
  async revoke(): Promise<void> {
    return;
  }

  /* ---------------- internals ---------------- */

  private headerMessage(message: GraphMessage): NormalizedMessage {
    return {
      providerMessageId: message.id,
      providerThreadId: message.conversationId,
      internetMessageId: message.internetMessageId,
      from: fromOf(message),
      at: atOf(message),
      subject: message.subject,
      bodyText: "",
      truncated: false,
      attachments: [],
    };
  }

  private async authHeaders(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.accessToken()}` };
  }

  private async get<T>(url: string, extraHeaders?: Record<string, string>): Promise<T> {
    return fetchJson<T>(url, {
      headers: { ...(await this.authHeaders()), ...extraHeaders },
      mapError: mapGraphError,
    });
  }
}
