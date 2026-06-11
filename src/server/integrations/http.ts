/* ================================================================
   HTTP layer for provider calls — fetchJson.

   Policy, applied uniformly to Gmail / Graph / OAuth endpoints:
   - AbortController timeout (default 15s) per attempt.
   - Retries with exponential backoff + full jitter, max 3, ONLY for
     429 / 5xx / network failures.
   - Retry-After honored (seconds or HTTP-date); waits longer than the
     cap are not slept on — the typed rate_limited error carries
     retryAfterMs so the caller can schedule instead.
   - 401 → reconnect_required. 403 → caller-supplied mapper (providers
     disambiguate admin policy vs rate limit vs revoked permission).
   - Non-idempotent sends are NEVER retried after an ambiguous failure
     (timeout, network drop, 5xx): the request may have been processed
     and a retry could double-send. A 429 is a definite rejection and
     stays retryable even for sends.

   Production swap points: none — this is the production client.
   ================================================================ */

import { ProviderError } from "./types";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 400;
const BACKOFF_CAP_MS = 8_000;
/** longest Retry-After we will actually sleep on inside a request */
const MAX_RETRY_WAIT_MS = 15_000;

/**
 * Exponential backoff with full jitter (pure: pass `random` to make it
 * deterministic in tests). attempt 0 → up to 400ms, 1 → 800ms, … capped
 * at 8s.
 */
export function backoffDelay(attempt: number, random: number = Math.random()): number {
  const ceiling = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt);
  return Math.round(random * ceiling);
}

/** Parses a Retry-After header — integer seconds or HTTP-date — into ms. */
export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds * 1000));
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}

export interface FetchJsonOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  /**
   * Default true. Set false for sends: after an ambiguous failure
   * (timeout / network / 5xx) the request may have reached the provider,
   * so it is never retried. 429 remains retryable — a definite rejection.
   */
  idempotent?: boolean;
  /**
   * Provider-specific status→error mapping, consulted before the
   * defaults. Primarily for 403 disambiguation (Gmail signals rate
   * limits and domain policy both as 403 with a reason).
   */
  mapError?: (status: number, bodyText: string) => ProviderError | undefined;
  maxRetries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

/** Short diagnostic slice of an error body — provider error JSON, capped. */
function detailOf(bodyText: string): string | undefined {
  const trimmed = bodyText.trim();
  return trimmed ? trimmed.slice(0, 280) : undefined;
}

function defaultErrorFor(
  status: number,
  bodyText: string,
  retryAfterMs?: number
): ProviderError {
  const providerDetail = detailOf(bodyText);
  if (status === 401) {
    return new ProviderError(
      "reconnect_required",
      "Authorization expired or was revoked — the account must be re-connected.",
      { providerDetail }
    );
  }
  if (status === 403) {
    return new ProviderError(
      "permission_revoked",
      "The provider refused this action with the current grants.",
      { providerDetail }
    );
  }
  if (status === 404) {
    return new ProviderError(
      "source_gone",
      "The requested item no longer exists at the provider.",
      { providerDetail }
    );
  }
  if (status === 429) {
    return new ProviderError("rate_limited", "Provider rate limit reached.", {
      providerDetail,
      retryAfterMs,
    });
  }
  if (status >= 500) {
    return new ProviderError(
      "provider_unavailable",
      `The provider is temporarily unavailable (HTTP ${status}).`,
      { providerDetail }
    );
  }
  return new ProviderError(
    "invalid_request",
    `The provider rejected the request (HTTP ${status}).`,
    { providerDetail }
  );
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const idempotent = options.idempotent ?? true;

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? "GET",
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });
    } catch (cause) {
      clearTimeout(timer);
      // Network failure or timeout — no response. Idempotent requests
      // retry with backoff; sends do not (the request may have landed:
      // a retry could double-send, which is worse than surfacing the
      // ambiguity to the caller).
      if (idempotent && attempt < maxRetries) {
        await sleep(backoffDelay(attempt));
        continue;
      }
      throw new ProviderError(
        "network",
        "The request failed before a response was received.",
        { providerDetail: cause instanceof Error ? cause.name : undefined }
      );
    }
    clearTimeout(timer);

    if (response.ok) {
      const text = await safeText(response);
      if (!text) return undefined as unknown as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new ProviderError(
          "provider_unavailable",
          "The provider returned a non-JSON response."
        );
      }
    }

    const bodyText = await safeText(response);
    const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
    const mapped = options.mapError?.(response.status, bodyText);

    const rateLimited = response.status === 429 || mapped?.code === "rate_limited";
    const retryableStatus = rateLimited || response.status >= 500;
    // 429 (and provider-flagged rate limits) mean the request was rejected
    // before processing — safe to retry even for non-idempotent sends.
    // A 5xx after a send is ambiguous and is never retried.
    const safeToRetry = idempotent ? retryableStatus : rateLimited;

    if (safeToRetry && attempt < maxRetries) {
      const wait = Math.max(
        backoffDelay(attempt),
        retryAfterMs ?? mapped?.retryAfterMs ?? 0
      );
      if (wait <= MAX_RETRY_WAIT_MS) {
        await sleep(wait);
        continue;
      }
      // Provider asked for a longer wait than we will hold a request
      // open — fall through and surface retryAfterMs to the caller.
    }

    if (mapped) {
      if (mapped.code === "rate_limited" && mapped.retryAfterMs === undefined) {
        throw new ProviderError("rate_limited", mapped.message, {
          retryAfterMs,
          providerDetail: mapped.providerDetail,
        });
      }
      throw mapped;
    }
    throw defaultErrorFor(response.status, bodyText, retryAfterMs);
  }
}
