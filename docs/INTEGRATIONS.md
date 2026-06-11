# SCOPEFORGE Integrations — Architecture

Audience: agency CTOs evaluating the product, and security reviewers auditing it.
Scope: the Google Workspace / Microsoft 365 integration layer — OAuth, token
handling, ingestion, retention, failure behavior, and the database schema in
[`supabase/migrations/0001_integrations.sql`](../supabase/migrations/0001_integrations.sql).

Authoritative sources this document tracks:

- `src/lib/integrations.ts` — the capability→scope registry (`CAPABILITIES`),
  provider metadata, and all user-facing trust copy. If this document and that
  file disagree, the registry wins.
- `src/server/integrations/*` + `src/app/api/integrations/*` — the
  production-shaped server implementation (OAuth handshake, token vault,
  provider adapters over raw `fetch`, typed error taxonomy). When provider
  credentials are absent from the environment it reports `mode: "sandbox"`
  instead of failing; the client then drives the same state machine from
  `src/lib/integrations-store.ts`.

---

## 1. Goals & non-goals

### Goals

1. **Turn inbound email into structured pipeline.** Import a selected thread
   from Gmail/Outlook into a lead workspace, with provenance, and feed it to
   intake analysis. No copy-paste, no forwarding address.
2. **Send follow-ups from the user's own address.** Reply rates depend on
   mail arriving from `maya@ateliernorth.dk`, not `noreply@scopeforge.app`.
3. **Attach client documents without re-uploading.** Per-file picker access
   to Drive/OneDrive.
4. **Be auditable.** Every connection, grant, decline, import, send,
   failure, and purge is recorded — once for compliance (`audit_logs`), once
   for the user-facing health timeline (`connection_events`).
5. **Be honest under failure.** Partial grants, expired tokens, admin blocks,
   and half-finished imports are first-class states with exact UI copy, not
   generic error toasts.

### Non-goals (deliberate)

- **No background mailbox sync in v1.** Everything is on-demand: the provider
  is contacted when the user clicks, never on a timer. (See §2 for the ladder
  and §3 for the verification reasons.)
- **No CRM-of-record ambitions.** We import what scoping needs; we do not
  mirror mailboxes or drives.
- **No write access beyond send.** No labels created, no mail moved, no files
  modified, no calendar events created.
- **No password collection, ever.** OAuth only. There is no input in this
  product where a Google or Microsoft password could be typed.

---

## 2. The permission ladder

Three modes, strictly ordered by how much standing access the user grants.
Stored per account in `sync_preferences.mode`.

| Mode | What it is | Scopes held | When the provider is contacted |
|---|---|---|---|
| **Manual** | Paste an email, upload a `.pdf`/`.eml`/transcript. First-class, always available, presented next to — never beneath — the connected path. | None | Never |
| **Connected assist** *(v1 default)* | User clicks "Import from Gmail", picks threads in a selection dialog, confirms. Same for files via picker. | Minimal, per enabled capability | Only at click time ("on-demand") |
| **Advanced sync** *(v2+, admin-gated)* | Watch chosen labels/folders; new matching mail is proposed for import automatically. | Same scopes, plus standing use | In the background, within the watched labels only |

**Why v1 ships only the first two:**

1. **Verification economics.** Background Gmail access doesn't require more
   scopes than on-demand access — `gmail.readonly` is already restricted — but
   it changes the *story* told at consent and in the CASA assessment. Shipping
   assist-only keeps the verified surface small and the audit narrative simple:
   "we read messages the user selected, when they selected them."
2. **Trust is sequenced.** An agency owner will grant "read the threads I
   pick" on day one. "Watch my inbox" is a month-three grant, after the
   product has earned it. Forcing that choice at first connect loses both.
3. **The workflow doesn't need it yet.** Inbound leads at a 14-person agency
   are episodic (a few per week), not streaming. Selection-first covers the
   job; sync is a convenience layer, not a capability gap.

Sync mode is double-gated in the schema: the application never writes
`mode = 'sync'` in v1, and the `sync_preferences_admin_gate` trigger rejects
it at the database unless the connecting user holds an owner/admin membership
in the workspace. `auto_import` is `CHECK`-constrained to sync mode only.

---

## 3. Scope strategy

Nothing is requested at first connect except identity. Each capability is off
until the user enables it; enabling it shows the exact scopes, then runs
incremental consent for those scopes only. The server's token-exchange code
refuses any scope absent from the `provider_scopes` allowlist table.

The registry (keys, scopes, sensitivity, trust copy) lives in
`src/lib/integrations.ts` (`CAPABILITIES`) and is seeded into
`provider_scopes` by the migration.

### 3.1 Google

| Capability | Scope(s) | Google class | What it can NEVER do | Verification implication |
|---|---|---|---|---|
| Attach selected documents (`drive_files`) | `drive.file` | Non-sensitive | List or read anything not explicitly picked. The Picker grants file-by-file; the rest of Drive is not even enumerable. | Standard brand verification only. No demo video, no CASA. |
| Send follow-ups (`send_followups`) | `gmail.send` | **Sensitive** | Read any mail. Send anything the user hasn't reviewed and clicked send on (enforced by product design: drafts require explicit per-send confirmation). | Sensitive-scope review: scope justification + demo video of the consent moment and the feature. Weeks, not months. |
| Import selected threads (`email_import`) | `gmail.readonly` | **Restricted** | Modify, delete, label, or send mail. Read contacts or settings. Run in the background (assist mode contacts Gmail only on user click). | Restricted-scope review **plus an annual CASA Tier 2 security assessment** by an authorized lab. Budget real time (typically 4–12 weeks) and real money, annually. |
| Read discovery-call events (`calendar_read`, phase 2) | `calendar.events.readonly` | Sensitive | Create or edit events; share availability. | Sensitive-scope review, same mechanics as `gmail.send`. |

**Rollout order falls out of the table:** ship `drive.file` + `gmail.send`
first (low verification cost, immediate product value), hold thread-import
behind completed restricted-scope verification rather than blocking the whole
integration on it. During Google's "testing" publishing status, thread-import
works for up to 100 test users — enough for design partners.

**The genuinely least-privilege alternative — Gmail Add-on companion path.**
A Gmail Add-on using `gmail.addons.current.message.readonly` reads *only the
message the user has open at the moment they click the add-on button* — there
is no mailbox grant at all, and the scope class is far below `gmail.readonly`.
The add-on POSTs the current message (plus a user confirmation) to the same
ingestion endpoint the web import uses. Trade-offs: it lives in Gmail's UI
rather than ours, imports one message at a time, and requires a Workspace
Marketplace listing. We treat it as a *companion* path, not a replacement:
it serves users (and Workspace admins) who will never grant mailbox-level
read, and it can ship before CASA completes.

### 3.2 Microsoft

| Capability | Scope(s) | Class (registry) | What it can NEVER do | Verification implication |
|---|---|---|---|---|
| Attach selected documents (`drive_files`) | `Files.Read` (delegated) | standard | Write or share files. Reach files outside the signed-in user's access. | Publisher verification only. |
| Send follow-ups (`send_followups`) | `Mail.Send` (delegated) | sensitive | Read any mail. | Publisher verification; commonly admin-consented in managed tenants. |
| Import selected threads (`email_import`) | `Mail.Read` (delegated) | restricted* | Send, move, delete, or label mail. | Publisher verification + expect the admin-consent workflow (§6, "org-wide approval required") to be the normal path in real tenants. |
| Read discovery-call events (`calendar_read`, phase 2) | `Calendars.Read` (delegated) | sensitive | Create/edit events. | Publisher verification. |

\* Microsoft has no formal standard/sensitive/restricted taxonomy; the class
recorded in `provider_scopes` carries over from the capability registry as a
consent-friction signal.

**`Mail.Read` vs `Mail.ReadBasic` — the trade-off.** `Mail.ReadBasic` exposes
headers, sender, date, and subject — but **no body and no attachments**, which
makes actual import impossible. The attractive design — browse the picker
under `Mail.ReadBasic`, escalate to `Mail.Read` only at confirm — costs a
second consent interruption mid-flow and still ends with `Mail.Read` held.
Decision: request `Mail.Read` once, when the user enables thread import (not
at first connect), and compensate with architecture — selection-first UX,
metadata-then-body fetch (§5), refs-only job payloads, and the 90-day raw
purge. Graph has no per-message grant; minimization has to live in our
pipeline, and it does.

**Admin consent.** Many Microsoft tenants disable user consent for third-party
apps. The flow handles `AADSTS65001` as a first-class outcome: status
`admin_required`, a pre-written approval request the user can forward, and
automatic completion once the admin approves (§6). We also register for the
Entra *admin consent workflow* so the request can land in the admin's portal
queue directly.

**Files.Read + picker.** The OneDrive file picker performs selection UX-side;
`Files.Read` (the user's own files, read-only) backs the fetch of exactly the
picked items. Microsoft has no `drive.file`-style per-file grant for arbitrary
personal files, so the picker + refs-only storage carries the minimization.
**`Sites.Selected` later:** when agencies want org-level SharePoint libraries
attached (templates, contract repositories), `Sites.Selected` lets an admin
grant specific sites to the app — per-site least privilege, admin-controlled,
the right shape for org content. Planned, not in v1.

---

## 4. OAuth flow

Authorization Code + **PKCE (S256)**, server-side exchange, even though a
client secret also exists (confidential client). No token, code, or secret
ever reaches the browser; the browser carries only an `HttpOnly` cookie and
the provider's redirect.

```
 Browser                        SCOPEFORGE server                         Provider
    |                                  |                                      |
    |  GET /api/integrations/google/start?capabilities=email_import           |
    |--------------------------------->|                                      |
    |                                  | verifier  = random 64 bytes (base64url)
    |                                  | challenge = base64url(SHA-256(verifier))   [PKCE S256]
    |                                  | nonce     = random 32 bytes
    |                                  | state     = nonce . HMAC-SHA256(nonce|provider|ts, STATE_SECRET)
    |                                  | scopes    = registry lookup, allowlist-checked
    |  Set-Cookie: sf_oauth (verifier+nonce, HttpOnly, Secure, SameSite=Lax, Max-Age=600, Path=/api/integrations)
    |  302 -> https://accounts.google.com/o/oauth2/v2/auth                    |
    |        ?client_id&redirect_uri&scope&state&code_challenge               |
    |        &code_challenge_method=S256&access_type=offline                  |
    |        &include_granted_scopes=true&prompt=consent                      |
    |<---------------------------------|                                      |
    |                                                                         |
    |  user authenticates & consents ON THE PROVIDER'S OWN DOMAIN             |
    |------------------------------------------------------------------------>|
    |  302 -> {APP_ORIGIN}/api/integrations/google/callback?code&state        |
    |<------------------------------------------------------------------------|
    |                                  |                                      |
    |  GET /callback?code&state        |                                      |
    |--------------------------------->|                                      |
    |                                  | 1. redirect target ∈ static allowlist (no open redirects)
    |                                  | 2. state HMAC verified (constant-time compare)
    |                                  | 3. state nonce == cookie nonce; cookie fresh (<10 min)
    |                                  | 4. POST /token  { code, code_verifier,    |
    |                                  |      client_id, client_secret }  ------->| server-to-server
    |                                  |   { access_token, refresh_token,         |
    |                                  |     granted scope, expires_in }  <-------|
    |                                  | 5. granted scopes vs requested -> full / partial
    |                                  | 6. encrypt token set (AES-256-GCM envelope)
    |                                  |    -> provider_tokens (service-role write)
    |                                  | 7. upsert integration_accounts + capability_grants
    |                                  | 8. write connection_events + audit_logs
    |                                  | 9. clear sf_oauth cookie
    |  302 -> /settings/integrations?connected=google                         |
    |<---------------------------------|                                      |
```

Properties a reviewer should check off:

- **PKCE S256** binds the authorization code to this flow; a stolen code is
  useless without the verifier, which lives only in the `HttpOnly` cookie.
- **HMAC state** (keyed with a server secret, verified with a constant-time
  compare) plus the **nonce-vs-cookie check** kills CSRF and login-CSRF: a
  callback can only complete in the browser session that started it.
- **Redirect-URI allowlist** on both ends: registered exactly at the provider,
  and the post-connect redirect target is matched against a static in-app
  allowlist — the callback never redirects to a caller-supplied URL.
- **Cookies**: `HttpOnly`, `Secure`, `SameSite=Lax`, 10-minute lifetime,
  path-scoped to the callback route, deleted on completion.
- **The browser never sees** `code_verifier` content (opaque cookie),
  `client_secret`, or any token.
- **Sandbox honesty**: with no provider credentials configured, `/start`
  responds `{ mode: "sandbox" }` and the client runs the simulated state
  machine. The simulated consent moment is a neutral frame explicitly labeled
  "Sandbox — in production this opens accounts.google.com". We never render
  anything resembling Google's or Microsoft's real consent UI.

### Token lifecycle

| Stage | Behavior |
|---|---|
| **At rest** | The token set is sealed in an AES-256-GCM envelope (12-byte nonce ‖ ciphertext ‖ 16-byte tag) in `provider_tokens.ciphertext`. The master key lives in the environment/KMS, identified by `key_id` — the database alone cannot decrypt. Rotation = re-encrypt rows whose `key_id` is stale. |
| **In use** | Decrypted in server memory per request, used, dropped. Tokens never enter logs, job payloads, audit metadata, or any client payload. |
| **Refresh** | Proactive: refreshed when within **5 minutes** of `access_expires_at`, so user-facing calls don't pay the refresh round-trip. **Single-flight** per account: concurrent requests share one in-flight refresh promise — no thundering herd, and no refresh-token race for providers that rotate refresh tokens on use (Microsoft does). |
| **Refresh failure** | `invalid_grant` (revoked at provider: password change, admin action, lifetime expiry) → account status `reconnect_required`, imports pause, nothing is deleted. Reconnect re-runs consent for the already-granted scopes only — no new scopes are requested. |
| **Disconnect** | Best-effort revocation at the provider (`oauth2.revoke` / Graph token invalidation) — then **local purge always**: the `provider_tokens` row is deleted whether or not revocation succeeded. The account row survives as the anchor for history and provenance, status `disconnected`. Optionally the user also purges imported raw content (§5). |

---

## 5. Ingestion pipeline

**Selection-first.** The provider is never crawled. The user opens the import
dialog, the app fetches a *listing* of candidates, the user picks, the app
fetches *only the picked items*. The same shape applies to threads (Gmail
`threads.list` → picker → `threads.get` for selected ids) and files (picker →
fetch picked refs).

**Two-step minimal fetch.** Step one retrieves metadata only — subject,
sender, date, snippet (`format=metadata` / `Mail.Read` with `$select`) — to
render the picker. Full bodies and attachments are fetched in step two, only
after the user confirms, only for the confirmed ids. A cancelled picker
session reads zero message bodies.

**Dedupe keys** (enforced as unique constraints in the schema):

| Level | Key | Behavior on collision |
|---|---|---|
| Thread | `(integration_account_id, provider_thread_ref)` | Upsert — re-import refreshes, never duplicates |
| Message | `(integration_account_id, provider_message_ref)` | Skip; counted as "already imported" in the result |
| Cross-provider hint | `internet_message_id` (RFC 5322) | Surfaced as a "possible duplicate" warning when the same Message-ID arrives via a different source (e.g. Gmail import vs `.eml` upload) |

**Partial success is a result, not an error.** An import of 10 messages where
one `threads.get` 404s completes as `ingestion_jobs.status = 'partial'`:
9 imported, 1 failed with its ref retained in the payload for one-click retry.
The UI reports exactly that. Nothing is rounded up to success or collapsed
into failure.

**Provenance.** Every imported artifact records source, provider ref,
importer, timestamp, and a human-readable parts list ("2 messages,
brief.pdf"). The client renders this as a mono provenance chip wherever
imported content appears (`Lead.provenance` in `src/lib/types.ts`;
`imported_threads` + `lead_workspaces.source_thread_id` in the schema).
Imported text is never silently mixed into hand-written text.

**Body-size caps.** Message bodies are capped at 256 KB at ingest
(`body_truncated` flags the cut; the schema `CHECK`s the cap). Attachments are
stored as references with name/mime/size; bytes are fetched on demand
(`imported_documents.fetched_on_demand`) unless the user explicitly uploads.

**Retention — the data-minimizing trade.**

- Raw message bodies are purged after a configurable window
  (`workspaces.raw_retention_days`, default **90 days**): `body_text` is
  nulled, `purged_at` stamped. Headers, subject, and provenance survive.
- On disconnect the user chooses **"also purge imported raw content"** —
  immediate purge of raw bodies from that account, recorded as a
  `data_purged` connection event and an audit row.
- **Extracted artifacts are retained**: the brief, the scope draft, the
  intake analysis built *from* an email are the agency's work product and
  keep their provenance chip. This asymmetry is deliberate and is the
  minimizing trade: the distilled artifact contains what the project needs;
  the raw correspondence (pleasantries, signatures, threading noise,
  third-party content) is the liability, so it is what expires. The
  alternative — retaining raw mail indefinitely because an artifact
  references it — would maximize, not minimize, held personal data.

---

## 6. Edge-case matrix

Status values map to `account_status`; event kinds to `connection_events.kind`
(client union `IntegrationEventKind`); error codes to the typed taxonomy in
`src/server`. "User sees" is copy *direction* — calm, concrete, no blame.

| Case | User sees | System does | Logged as |
|---|---|---|---|
| User cancels OAuth at consent | "Authorization was cancelled. Nothing was connected and no data was accessed." Connect button unchanged; manual path still offered alongside. | `error=access_denied` at callback → no account/token rows written; cookie cleared. | `connection_events: scope_declined`; `audit_logs: oauth.cancelled` |
| Invalid redirect / state mismatch | "That authorization link wasn't valid — it may have expired or been tampered with. Start again from this page." | HMAC or nonce check fails → callback aborts before token exchange; nothing persisted; code never redeemed. | `audit_logs: oauth.state_invalid` (security-relevant — kept in compliance trail, not the product timeline) |
| Token expired (normal) | Nothing — by design. | Proactive refresh 5 min before expiry; single-flight; request proceeds on fresh token. | `provider_tokens.updated_at` touch only; no event noise |
| Refresh failed (revoked) | Status pill "Reconnect required" + "The connection to Google was revoked — usually a password change or an admin action. Imports are paused until you reconnect. Nothing was deleted." One-click reconnect. | `invalid_grant` → status `reconnect_required`; pending jobs pause with `token_refresh_failed`; reconnect re-consents existing scopes only. | `connection_events: refresh_failed`, then `reconnected`; `audit_logs: token.refresh_failed` |
| Admin blocks app (mid-life) | Status "Admin approval required" + "Your Microsoft 365 admin restricts third-party apps. We've prepared an approval request you can forward — connection resumes automatically once approved." | Provider error mapped to `admin_required`; approval-request text generated; periodic silent recheck on next user action. | `connection_events: admin_blocked`; `audit_logs: oauth.admin_blocked` |
| Scope rejected at consent (partial grant) | Connection completes with status "Partial": "Connected, but 'Send follow-ups from your address' was declined at the consent screen. That feature stays off; everything else keeps working." Capability toggle shows re-request option. | Granted scopes (from token response) diffed against requested; `capability_grants.granted=false`, `declined_at` set; feature gated off; no retry without explicit user action. | `connection_events: scope_declined`; `audit_logs: consent.partial` |
| Message deleted at source mid-import | In the import result: "1 message couldn't be imported — it was deleted in Gmail after you selected it." | Provider 404 on `messages.get` → that item marked failed (`source_gone`), siblings proceed; job → `partial`. | `connection_events: import_partial`; `ingestion_jobs.last_error_code = source_gone` |
| File permission revoked at provider | On open: "This file is no longer shared with your account. Ask the owner to re-share it, or upload a copy instead." | Reference kept (`fetched_on_demand=true` means we never had the bytes); fetch returns 403/404 → mapped to `file_access_revoked`; upload path offered inline. | `audit_logs: document.fetch_denied` |
| Network timeout | "Google didn't respond in time. Your selection is saved — retry when you're ready." Retry button on the job row. | Timeout (AbortController) → job `failed` with `provider_timeout`; idempotent retry honors dedupe keys, so re-runs never duplicate. | `ingestion_jobs: failed / provider_timeout` |
| Provider rate limit (429) | Only if retries exhaust: "Gmail is rate-limiting requests right now. We'll retry automatically — the import will finish on its own." | Honor `Retry-After`; exponential backoff with jitter, bounded attempts (`attempts` column); job stays `running`/`queued` between tries. | `ingestion_jobs.last_error_code = provider_rate_limited` (event emitted only on final failure) |
| Duplicate import | "Already imported — opening the existing lead." Navigates to it; provenance chip identifies the prior import. | Unique-key hit on `(account, provider_thread_ref)` → upsert path; existing `lead_id` returned; no second lead created. | `audit_logs: import.duplicate_skipped` |
| Partial import success | "9 of 10 messages imported. 1 failed — retry just that one?" Result panel lists the failure with its reason. | Job → `partial`; failed refs retained in payload; retry re-runs only failures. | `connection_events: import_partial`; `audit_logs: import.partial` |
| Sync disabled (capability/mode off) | The feature's surface shows its enable path: "Thread import is off for this connection. Enabling it requests read access to threads you select — here's exactly what that means." (registry copy). Manual paste sits right next to it. | Server checks `capability_grants` before any provider call; missing grant → `capability_not_granted`, no provider contact at all. | `audit_logs: capability.blocked_call` |
| Org-wide approval required (first connect in managed tenant) | Neutral frame: "Your organization requires admin approval for new apps. Send this pre-filled request to your admin — we'll finish the connection automatically once it's approved." | `AADSTS65001`/policy error at consent → placeholder account row, status `admin_required`; on next attempt after approval, flow completes without re-selection. | `connection_events: admin_blocked`, then `connected`; `audit_logs: oauth.admin_consent_requested` |

---

## 7. Verification readiness

### 7.1 Google (OAuth app verification)

- [ ] OAuth consent screen complete: app name, logo, support email, developer
      contact — matching the production brand exactly.
- [ ] Domain ownership verified in Search Console for the app domain and every
      redirect-URI domain.
- [ ] Homepage, privacy policy, and terms live on the verified domain; privacy
      policy explicitly covers Google user data handling.
- [ ] **Limited Use** disclosure published and accurate: use of Google user
      data complies with the Google API Services User Data Policy, including
      Limited Use (no ads, no human reads except with consent/for security,
      no resale, no broad model training on user data).
- [ ] Per-scope written justification: why `drive.file`, `gmail.send`,
      `gmail.readonly` — each tied to a visible user feature (use the
      registry's what/not/why copy; it was written to be this answer).
- [ ] Demo video per sensitive/restricted scope: the real consent screen, then
      the feature exercising the scope end-to-end.
- [ ] **CASA Tier 2 assessment** scheduled with an authorized lab for
      `gmail.readonly` (restricted): scoped, budgeted, and calendared
      **annually**. Lead time 4–12 weeks — sequence it before the marketing
      date, not after.
- [ ] Incremental authorization implemented; no scope requested at first
      connect beyond identity; unused scopes removed from the registry.
- [ ] Redirect URIs locked to production origins; no localhost/wildcards in
      the production client.
- [ ] Testing-status plan: design partners under the 100-user cap until
      restricted verification completes; in-app copy reflects the unverified
      state honestly.
- [ ] Annual recertification + CASA renewal on the compliance calendar with
      an owner.

### 7.2 Microsoft (publisher verification)

- [ ] Microsoft AI Cloud Partner Program (MPN) account created and the MPN ID
      linked to the Entra tenant that owns the app registration.
- [ ] Publisher domain verified on the app registration; **publisher
      verification badge** obtained — without it, users in
      default-configured tenants cannot consent to the app at all.
- [ ] App registration: multi-tenant, production redirect URIs only,
      certificates/secrets on a rotation schedule with an owner.
- [ ] All permissions delegated (no application permissions in v1), each
      mapped to a capability with written justification — `Mail.Read`
      especially (cite §3.2's `Mail.ReadBasic` analysis).
- [ ] Admin-consent workflow tested end-to-end in a locked-down test tenant:
      request → admin approval → automatic completion (§6).
- [ ] Terms, privacy, and support URLs set on the registration (shown on the
      Microsoft consent screen).
- [ ] Optional but valuable for enterprise sales: Microsoft 365 App Compliance
      Program — Publisher Attestation first, Microsoft 365 Certification when
      a customer requires it.

---

## 8. Extensibility — adding a connector

The DESIGN_SPEC addendum binds `src/server` to: provider adapters over raw
`fetch` (no provider SDKs), a typed error taxonomy, and sandbox mode when
credentials are absent. A connector is one adapter + registry rows; nothing
in the pipeline, vault, or UI is provider-specific.

The adapter contract (implementation home: `src/server/integrations/`):

```ts
interface ProviderAdapter {
  key: string;                                  // "google" | "microsoft" | "hubspot" | …
  // OAuth handshake
  authUrl(p: { scopes: string[]; state: string; codeChallenge: string }): string;
  exchangeCode(p: { code: string; codeVerifier: string }): Promise<TokenSet>;
  refresh(refreshToken: string): Promise<TokenSet>;
  revoke(tokens: TokenSet): Promise<void>;      // best-effort; local purge happens regardless
  // Capability surface — implement only what the connector's capabilities need
  listThreads?(q: ListQuery): Promise<ThreadMeta[]>;     // metadata only (§5 step one)
  getThread?(ref: string): Promise<ThreadFull>;          // full fetch (§5 step two)
  sendMail?(draft: OutboundDraft): Promise<SendReceipt>;
  getFile?(ref: string): Promise<FileContent>;
}
```

All adapter failures map into the shared error taxonomy
(`token_refresh_failed`, `provider_rate_limited`, `source_gone`,
`capability_not_granted`, `provider_timeout`, …) so the job runner, the edge-case
matrix (§6), and the UI handle every provider identically.

**Worked example — HubSpot (CRM sync):**

1. **Implement the adapter**: `src/server/integrations/hubspot.ts` —
   HubSpot OAuth endpoints, raw `fetch`, errors mapped to the taxonomy.
2. **Register capabilities** in `CAPABILITIES`
   (`src/lib/integrations.ts`) — e.g. `crm_contact_sync` with its scopes
   (`crm.objects.contacts.read`), sensitivity, access mode, and the
   what/not/why trust copy. The registry is the single source for everything
   the consent UI and this document say.
3. **Migrate the registry tables**: flip the seeded `integration_providers`
   row `hubspot` from `planned` to `beta`, insert its `provider_scopes` rows
   (scope → capability, classified). The scope allowlist now admits it.
4. **Done at the data layer.** `integration_accounts`, `provider_tokens`,
   `capability_grants`, `ingestion_jobs`, `connection_events` are
   provider-agnostic — keyed by `provider_key`, no schema change. The hub UI
   reads the registry and renders the new connector with the same consent
   ritual, status machine, and health timeline.

Slack (lead alerts), Notion (brief export), and the other planned connectors
follow the identical recipe; until then they render as roadmap entries, never
as fake buttons.

---

## 9. Security model summary

| Principle | Mechanism |
|---|---|
| No secrets client-side | Client IDs are public by design; client secret, state secret, and vault master key live server-side only. The browser handles an `HttpOnly` cookie and redirects — nothing else. |
| Server-only exchange | Authorization-code redemption, refresh, and revocation happen exclusively in `src/server` route handlers. No token, code, or verifier appears in client bundles, URLs the client can read, or API responses. |
| CSRF-safe state | HMAC-SHA256-signed state, constant-time verified, bound to a nonce in a short-lived `HttpOnly` `SameSite=Lax` cookie; redirect targets matched against a static allowlist. |
| Least privilege | Capability→scope registry with a database allowlist (`provider_scopes`); incremental consent per capability; nothing requested until enabled; `drive.file`/picker for per-file access; Gmail Add-on path for zero-mailbox-grant import. |
| Data minimization | Selection-first, metadata-before-body fetch, 256 KB body caps, refs-only job payloads (size-`CHECK`ed), redacted audit metadata, 90-day raw purge, purge-on-disconnect, references-not-copies for documents. |
| Encryption at rest | AES-256-GCM envelope per token set; master key outside the database; `key_id` for rotation; tokens decrypted in memory per request only. |
| Tenant isolation | RLS on every table; workspace scoping via memberships; `provider_tokens` carries **no client SELECT policy at all**, plus a restrictive deny-all policy and revoked privileges — service-role only. |
| Auditability | Append-only `audit_logs` (client INSERT only, self-attributed, no client reads; UPDATE/DELETE revoked) + per-account `connection_events` health timeline. Every consent, grant, decline, import, send, failure, and purge lands in both views. |
| No password collection | OAuth only. No UI element in this product accepts a provider password, and the sandbox consent frames are neutral, explicitly labeled simulations — never imitations of provider login screens. |

### What we never build

- **No scraping** — no headless browsers, no session-cookie reuse, no
  reverse-engineered private endpoints. Official APIs or nothing.
- **No IMAP/SMTP password auth** — no app passwords, no "connect via IMAP"
  fallback. OAuth is the only door.
- **No auto-forward rules** — we never create forwarding rules, filters, or
  labels in a user's mailbox, and we don't ask users to forward mail to a
  collector address as a primary path.
- **No full-mailbox sync in v1** — no background crawl, no "import everything"
  button. The v2+ sync mode, if shipped, is label/folder-scoped, admin-gated
  (enforced in the schema), and opt-in per account.
- **No provider-styled consent UI** — sandbox consent moments are neutral
  frames labeled as simulations. We do not render Google's or Microsoft's
  branding, layouts, or login fields, ever.
- **No raw content in queues or logs** — job payloads and audit metadata carry
  references and counts; bodies, subjects, attachments, and tokens are
  structurally excluded (and size-`CHECK`ed at the schema).
