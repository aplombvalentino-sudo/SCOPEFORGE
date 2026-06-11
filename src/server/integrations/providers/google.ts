/* ================================================================
   Google adapter — Gmail REST v1 over raw fetch (no SDK).

   Base: https://gmail.googleapis.com/gmail/v1/users/me

   Two-step minimal fetch (the core privacy mechanic):
     1. listThreads — threads.list with a q= filter, maxResults<=25 and
        a fields= projection of ids + snippets only.
     2. getThread — threads.get with format=metadata, returning ONLY the
        From / Subject / Date / Message-ID headers. No bodies leave
        Google at this step; this is what the import picker renders.
     3. getMessage — format=full, one message at a time, ONLY for the
        messages the user has explicitly ticked in the import dialog.
   Unselected mail is never fetched beyond its headers.

   sendMessage requires the gmail.send scope (capability
   "send_followups"); gmail.readonly alone cannot send.

   Error mapping: 401 → reconnect_required (http layer), 403 reason
   domainPolicy|accessNotConfigured → admin_blocked, 403 reason
   rateLimitExceeded|userRateLimitExceeded and 429 → rate_limited
   (Retry-After honored), 404 → source_gone.

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

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const PAGE_SIZE = 25;

/* ---------------- wire shapes ---------------- */

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailBody {
  attachmentId?: string;
  size?: number;
  data?: string;
}

interface GmailPart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailBody;
  parts?: GmailPart[];
}

interface GmailMessage {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: GmailPart;
}

interface GmailThreadListResponse {
  threads?: { id: string; snippet?: string }[];
  nextPageToken?: string;
}

interface GmailThreadResponse {
  id: string;
  messages?: GmailMessage[];
}

interface GmailAttachmentResponse {
  size?: number;
  data?: string;
}

interface GmailSendResponse {
  id: string;
  threadId?: string;
}

interface GoogleErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    errors?: { reason?: string; domain?: string }[];
  };
}

/* ---------------- error mapping ---------------- */

function mapGoogleError(status: number, bodyText: string): ProviderError | undefined {
  let reasons: string[] = [];
  let message: string | undefined;
  try {
    const parsed = JSON.parse(bodyText) as GoogleErrorBody;
    reasons = (parsed.error?.errors ?? [])
      .map((e) => e.reason ?? "")
      .filter(Boolean);
    message = parsed.error?.message;
  } catch {
    // non-JSON error body — defaults apply
  }
  const providerDetail = reasons.join(",") || message?.slice(0, 200);
  if (status === 403) {
    if (reasons.some((r) => r === "domainPolicy" || r === "accessNotConfigured")) {
      return new ProviderError(
        "admin_blocked",
        "A Google Workspace policy blocks this app for the organization.",
        { providerDetail }
      );
    }
    if (reasons.some((r) => r === "rateLimitExceeded" || r === "userRateLimitExceeded")) {
      // Gmail signals per-user rate limits as 403; the http layer treats
      // this mapped rate_limited like a 429 and retries with backoff.
      return new ProviderError("rate_limited", "Gmail rate limit reached.", {
        providerDetail,
      });
    }
    return new ProviderError(
      "permission_revoked",
      "Gmail refused this action with the current grants.",
      { providerDetail }
    );
  }
  if (status === 404) {
    return new ProviderError(
      "source_gone",
      "This thread or message no longer exists in the mailbox.",
      { providerDetail }
    );
  }
  return undefined; // 401 / 429 / 5xx handled by the http layer defaults
}

/* ---------------- parsing helpers ---------------- */

function headerOf(part: GmailPart | undefined, name: string): string | undefined {
  return part?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
}

function parseAddress(value: string | undefined): { name?: string; email: string } {
  if (!value) return { email: "unknown" };
  const match = value.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].trim();
    return { name: name || undefined, email: match[2].trim().toLowerCase() };
  }
  return { email: value.trim().toLowerCase() };
}

function messageAt(message: GmailMessage): string {
  if (message.internalDate) {
    const ms = Number(message.internalDate);
    if (Number.isFinite(ms) && ms > 0) return new Date(ms).toISOString();
  }
  const dateHeader = headerOf(message.payload, "Date");
  if (dateHeader) {
    const parsed = Date.parse(dateHeader);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  return new Date(0).toISOString();
}

function decodeBody(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

/**
 * Minimal fallback when a message has no text/plain part. Production
 * swaps in a proper HTML→text converter; this strips tags and
 * collapses whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractContent(
  payload: GmailPart | undefined,
  messageId: string
): { text: string; attachments: NormalizedAttachmentRef[] } {
  const attachments: NormalizedAttachmentRef[] = [];
  let plain = "";
  let html = "";
  const walk = (part: GmailPart | undefined): void => {
    if (!part) return;
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        providerAttachmentId: part.body.attachmentId,
        providerMessageId: messageId,
        name: part.filename,
        mimeType: part.mimeType ?? "application/octet-stream",
        sizeBytes: part.body.size ?? 0,
      });
    } else if (part.mimeType === "text/plain" && part.body?.data && !plain) {
      plain = decodeBody(part.body.data);
    } else if (part.mimeType === "text/html" && part.body?.data && !html) {
      html = decodeBody(part.body.data);
    }
    part.parts?.forEach(walk);
  };
  walk(payload);
  return { text: plain || stripHtml(html), attachments };
}

/** RFC 2047 B-encoding for header values with non-ASCII characters. */
function encodeHeaderValue(value: string): string {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function formatAddress(recipient: { name?: string; email: string }): string {
  return recipient.name
    ? `${encodeHeaderValue(recipient.name)} <${recipient.email}>`
    : recipient.email;
}

/* ---------------- adapter ---------------- */

export class GoogleAdapter implements ProviderAdapter {
  readonly provider = "google" as const;

  constructor(private readonly accessToken: AccessTokenProvider) {}

  async listThreads(query: string, pageToken?: string): Promise<ThreadListPage> {
    const url = new URL(`${GMAIL_BASE}/threads`);
    // Caller-shaped query, e.g. "in:inbox newer_than:30d" — the default
    // keeps the picker to recent inbox mail, never the whole mailbox.
    url.searchParams.set("q", query || "in:inbox newer_than:30d");
    url.searchParams.set("maxResults", String(PAGE_SIZE));
    // fields= keeps the projection minimal: ids and snippets only.
    url.searchParams.set("fields", "nextPageToken,threads(id,snippet)");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const page = await this.get<GmailThreadListResponse>(url.toString());
    return {
      threads: (page.threads ?? []).map((t) => ({
        providerThreadId: t.id,
        snippet: t.snippet,
        messages: [],
      })),
      nextPageToken: page.nextPageToken,
    };
  }

  /**
   * Step 2 of the two-step minimal fetch: format=metadata returns ONLY
   * the From/Subject/Date/Message-ID headers for each message — no
   * bodies, no parts. getMessage (format=full) is called later, one
   * message at a time, exclusively for user-confirmed selections.
   */
  async getThread(id: string): Promise<NormalizedThread> {
    const url = new URL(`${GMAIL_BASE}/threads/${encodeURIComponent(id)}`);
    url.searchParams.set("format", "metadata");
    for (const header of ["From", "Subject", "Date", "Message-ID"]) {
      url.searchParams.append("metadataHeaders", header);
    }
    url.searchParams.set(
      "fields",
      "id,messages(id,threadId,internalDate,payload/headers)"
    );
    const thread = await this.get<GmailThreadResponse>(url.toString());
    const messages = (thread.messages ?? []).map((m) => this.headerMessage(m));
    return {
      providerThreadId: thread.id,
      subject: messages[0]?.subject,
      lastMessageAt: messages.length ? messages[messages.length - 1].at : undefined,
      messageCount: messages.length,
      messages,
    };
  }

  /** format=full — body and attachment refs, for confirmed messages only. */
  async getMessage(id: string): Promise<NormalizedMessage> {
    const url = new URL(`${GMAIL_BASE}/messages/${encodeURIComponent(id)}`);
    url.searchParams.set("format", "full");
    const message = await this.get<GmailMessage>(url.toString());
    const { text, attachments } = extractContent(message.payload, message.id);
    return {
      providerMessageId: message.id,
      providerThreadId: message.threadId,
      internetMessageId: headerOf(message.payload, "Message-ID"),
      from: parseAddress(headerOf(message.payload, "From")),
      at: messageAt(message),
      subject: headerOf(message.payload, "Subject"),
      bodyText: text,
      truncated: false,
      attachments,
    };
  }

  async getAttachment(
    messageId: string,
    attachmentId: string
  ): Promise<AttachmentContent> {
    const url =
      `${GMAIL_BASE}/messages/${encodeURIComponent(messageId)}` +
      `/attachments/${encodeURIComponent(attachmentId)}`;
    const attachment = await this.get<GmailAttachmentResponse>(url);
    if (!attachment.data) {
      throw new ProviderError("source_gone", "The attachment content is unavailable.");
    }
    const data = new Uint8Array(Buffer.from(attachment.data, "base64url"));
    return { data, sizeBytes: data.byteLength };
  }

  /**
   * Builds an RFC 2822 message, base64url-encodes it, and posts to
   * users.messages.send. Requires gmail.send (capability
   * "send_followups") — gmail.readonly alone cannot send.
   */
  async sendMessage(draft: OutboundDraft): Promise<SendReceipt> {
    const lines = [
      `To: ${draft.to.map(formatAddress).join(", ")}`,
      `Subject: ${encodeHeaderValue(draft.subject)}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
    ];
    if (draft.inReplyTo) {
      lines.push(`In-Reply-To: ${draft.inReplyTo}`);
      lines.push(`References: ${(draft.references ?? [draft.inReplyTo]).join(" ")}`);
    }
    lines.push("", draft.bodyText);
    const raw = Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");

    const response = await fetchJson<GmailSendResponse>(`${GMAIL_BASE}/messages/send`, {
      method: "POST",
      headers: { ...(await this.authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ raw, threadId: draft.providerThreadId }),
      // Never retried after an ambiguous failure — a duplicate follow-up
      // is worse than asking the user to confirm the send went out.
      idempotent: false,
      mapError: mapGoogleError,
    });
    return {
      providerMessageId: response.id,
      providerThreadId: response.threadId,
      at: new Date().toISOString(),
    };
  }

  /**
   * Best-effort revocation of the current token at Google's revocation
   * endpoint (revokes the whole grant family). Disconnect proceeds even
   * when this fails — the vault entry is deleted regardless.
   */
  async revoke(): Promise<void> {
    const token = await this.accessToken();
    await fetchJson<void>("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }).toString(),
    });
  }

  /* ---------------- internals ---------------- */

  private headerMessage(message: GmailMessage): NormalizedMessage {
    return {
      providerMessageId: message.id,
      providerThreadId: message.threadId,
      internetMessageId: headerOf(message.payload, "Message-ID"),
      from: parseAddress(headerOf(message.payload, "From")),
      at: messageAt(message),
      subject: headerOf(message.payload, "Subject"),
      bodyText: "",
      truncated: false,
      attachments: [],
    };
  }

  private async authHeaders(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.accessToken()}` };
  }

  private async get<T>(url: string): Promise<T> {
    return fetchJson<T>(url, {
      headers: await this.authHeaders(),
      mapError: mapGoogleError,
    });
  }
}
