-- ============================================================================
-- SCOPEFORGE — integrations layer schema
-- Migration 0001 — runnable as-is on Supabase (Postgres 15+).
--
-- This schema is also documentation. Read the comments; they encode the
-- security posture, the retention policy, and the data-minimization rules
-- that docs/INTEGRATIONS.md describes in prose.
--
-- Layout
--   1.  Extensions, helper schema, enums
--   2.  Tenancy: organizations, workspaces, app_users, memberships
--   3.  Provider registry: integration_providers, provider_scopes
--   4.  Connections: integration_accounts, provider_tokens, capability_grants,
--       sync_preferences
--   5.  Imported content: imported_threads, imported_messages,
--       imported_documents, lead_workspaces
--   6.  Operations: ingestion_jobs, audit_logs, connection_events
--   7.  Helper functions (security definer — RLS building blocks)
--   8.  Triggers
--   9.  Row-level security: enable + policies on every table
--   10. Privilege hygiene: REVOKEs (tokens are service-role only)
--   11. Seeds: providers + scope registry (mirrors src/lib/integrations.ts)
--
-- Conventions
--   * Every FK is indexed. Log-shaped tables get (workspace_id, created_at desc).
--   * Client roles (anon/authenticated) get SELECT through workspace-scoped
--     RLS. All writes go through the Next.js server (service_role), with the
--     single deliberate exception of audit_logs INSERT (see §9).
--   * provider_tokens is invisible to client roles. No SELECT policy exists
--     for them, a RESTRICTIVE deny-all policy backstops that, and privileges
--     are revoked outright. Only service_role (BYPASSRLS) reads it.
-- ============================================================================


-- ============================================================================
-- 1. Extensions, helper schema, enums
-- ============================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- Helper functions live outside `public` so they are never exposed through
-- PostgREST. They are SECURITY DEFINER on purpose: RLS policies on
-- `memberships` must not recursively evaluate RLS on `memberships`.
create schema if not exists app_private;

create type membership_role   as enum ('owner', 'admin', 'member');
create type provider_status   as enum ('live', 'beta', 'planned');
create type account_status    as enum ('connected', 'partial', 'reconnect_required', 'admin_required', 'disconnected', 'error');
create type scope_sensitivity as enum ('standard', 'sensitive', 'restricted');
create type thread_source     as enum ('gmail', 'outlook', 'manual', 'upload');
create type document_source   as enum ('drive', 'onedrive', 'upload');
create type job_kind          as enum ('thread_import', 'document_attach', 'send_followup');
create type job_status        as enum ('queued', 'running', 'partial', 'succeeded', 'failed');
create type sync_mode         as enum ('manual', 'assist', 'sync');
create type lead_created_from as enum ('manual', 'import');

comment on type account_status is
  'Mirrors ConnectionStatus in src/lib/integrations.ts. partial = connected but at least one enabled capability lost its grant; reconnect_required = refresh failed, user must re-authorize; admin_required = org policy blocks the app until an admin approves it.';
comment on type scope_sensitivity is
  'Google''s verification taxonomy (standard / sensitive / restricted), applied per capability in src/lib/integrations.ts. For Microsoft scopes the same class is recorded as a consent-friction signal (restricted ≈ likely admin-gated in locked-down tenants); Microsoft has no formal equivalent taxonomy.';
comment on type sync_mode is
  'The permission ladder: manual (paste/upload, zero scopes), assist (on-demand, selection-first — the v1 default), sync (background label/folder watch — v2+, admin-gated, never shipped silently).';


-- ============================================================================
-- 2. Tenancy
-- ============================================================================

create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);
comment on table organizations is
  'Billing/tenant root. An agency. Workspaces hang off an organization.';

create table workspaces (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organizations (id) on delete cascade,
  name               text not null,
  slug               text not null,
  -- Retention knob read by the purge job (see imported_messages.purged_at).
  raw_retention_days integer not null default 90
    constraint workspaces_retention_range check (raw_retention_days between 1 and 365),
  created_at         timestamptz not null default now(),
  unique (org_id, slug)
);
comment on table workspaces is
  'A working unit inside an organization (demo: "Atelier North"). All integration data is scoped to a workspace; RLS enforces that scoping via memberships.';
comment on column workspaces.raw_retention_days is
  'Days to keep raw imported message bodies before the purge job nulls them (default 90). Extracted artifacts (briefs, scopes, analyses) are not affected — see imported_messages.purged_at.';

create table app_users (
  id           uuid primary key default gen_random_uuid(),
  -- Mirrors auth.users.id. Soft reference by design: the app identity model
  -- stays portable if the auth provider changes, and the migration does not
  -- depend on the auth schema's shape.
  auth_user_id uuid not null unique,
  email        text not null,
  display_name text not null,
  created_at   timestamptz not null default now()
);
comment on table app_users is
  'Application user profile. auth_user_id mirrors Supabase auth.users(id); RLS helpers resolve auth.uid() through this column.';

create unique index app_users_email_lower_key on app_users (lower(email));

create table memberships (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references app_users (id) on delete cascade,
  workspace_id uuid not null references workspaces (id) on delete cascade,
  role         membership_role not null default 'member',
  created_at   timestamptz not null default now(),
  unique (user_id, workspace_id)
);
comment on table memberships is
  'user ↔ workspace with a role. owner/admin gate destructive and high-trust actions: workspace-wide disconnect+purge, enabling sync mode, exporting the audit trail.';

create index memberships_user_id_idx      on memberships (user_id);
create index memberships_workspace_id_idx on memberships (workspace_id);


-- ============================================================================
-- 3. Provider registry
-- ============================================================================

create table integration_providers (
  key          text primary key,
  display_name text not null,
  phase        smallint not null default 1,
  status       provider_status not null default 'planned'
);
comment on table integration_providers is
  'Connector registry. live = connectable today; beta = connectable behind a flag; planned = shown in the hub as a roadmap entry, never as a fake button. Mirrors PROVIDER_META + PLANNED_CONNECTORS in src/lib/integrations.ts.';

create table provider_scopes (
  provider_key   text not null references integration_providers (key) on delete cascade,
  scope          text not null,
  sensitivity    scope_sensitivity not null,
  capability_key text not null,
  primary key (provider_key, scope)
);
comment on table provider_scopes is
  'Scope registry: every OAuth scope the app may ever request, classified, and bound to exactly one product capability. Seeded from the CAPABILITIES registry in src/lib/integrations.ts (the authoritative source for trust copy). The token-exchange code refuses to request any scope not present here — least privilege is enforced by allowlist, not by review discipline.';
comment on column provider_scopes.capability_key is
  'Capability key from src/lib/integrations.ts (email_import | send_followups | drive_files | calendar_read). Free text rather than an enum so adding a connector capability is a seed row, not a type change.';

create index provider_scopes_capability_key_idx on provider_scopes (capability_key);


-- ============================================================================
-- 4. Connections
-- ============================================================================

create table integration_accounts (
  id                     uuid primary key default gen_random_uuid(),
  workspace_id           uuid not null references workspaces (id) on delete cascade,
  provider_key           text not null references integration_providers (key) on delete restrict,
  -- Null only for pre-consent placeholder rows (e.g. admin_required: the org
  -- blocked the app before the provider told us which account was signing in).
  external_account_email text,
  connected_by           uuid not null references app_users (id) on delete restrict,
  status                 account_status not null default 'disconnected',
  status_detail          text,
  connected_at           timestamptz,
  last_used_at           timestamptz,
  created_at             timestamptz not null default now(),
  -- One row per external account per provider per workspace. NULLS NOT
  -- DISTINCT so at most one pre-consent placeholder exists per (ws, provider).
  constraint integration_accounts_ws_provider_email_key
    unique nulls not distinct (workspace_id, provider_key, external_account_email)
);
comment on table integration_accounts is
  'A connected external account (e.g. maya@ateliernorth.dk on Google). Disconnect flips status to ''disconnected'' and deletes the provider_tokens row; the account row itself is retained so connection history and provenance keep their anchor.';
comment on column integration_accounts.status_detail is
  'Plain-language explanation of the current status, rendered verbatim in the hub (e.g. why a connection is partial). Written by the server, never by the provider.';

create index integration_accounts_workspace_id_idx on integration_accounts (workspace_id);
create index integration_accounts_provider_key_idx on integration_accounts (provider_key);
create index integration_accounts_connected_by_idx on integration_accounts (connected_by);

create table provider_tokens (
  -- PK = FK: structurally 1:1 with integration_accounts.
  integration_account_id uuid primary key references integration_accounts (id) on delete cascade,
  -- AES-256-GCM envelope produced by the app-layer vault (src/server):
  --   ciphertext = nonce (12 bytes) || GCM ciphertext || auth tag (16 bytes)
  -- over the JSON token set {access_token, refresh_token, token_type, scope}.
  -- The data key is derived from a KMS/env master key identified by key_id.
  -- Plaintext tokens NEVER touch this table, logs, or the client. The
  -- database alone cannot decrypt: the master key lives outside Postgres.
  ciphertext             bytea not null,
  -- Master-key identifier for rotation: re-encrypt rows where key_id differs
  -- from the active key; old keys stay readable until rotation completes.
  key_id                 text not null,
  access_expires_at      timestamptz,
  -- Null for providers whose refresh tokens do not expire (Google, unless
  -- the app is in testing status). Microsoft rolling refresh ≈ 90 days idle.
  refresh_expires_at     timestamptz,
  -- The scopes the provider ACTUALLY granted (may be narrower than requested
  -- — the source of truth for partial-grant detection).
  scopes                 text[] not null default '{}',
  updated_at             timestamptz not null default now()
);
comment on table provider_tokens is
  'SERVICE-ROLE ONLY. Encrypted OAuth token sets. No RLS SELECT policy exists for client roles; a RESTRICTIVE deny-all policy and explicit REVOKEs (§10) make that posture survivable even if a permissive policy is added by mistake later. Decryption happens only in src/server, in memory, per request.';
comment on column provider_tokens.ciphertext is
  'AES-256-GCM envelope from the app-layer vault. NEVER stored plaintext. Layout: 12-byte nonce || ciphertext || 16-byte GCM tag.';

create table capability_grants (
  id                     uuid primary key default gen_random_uuid(),
  integration_account_id uuid not null references integration_accounts (id) on delete cascade,
  capability_key         text not null,
  -- enabled = the user switched the feature on in SCOPEFORGE.
  -- granted = the provider actually granted the scopes at consent.
  -- enabled && !granted  →  the account is `partial` and the feature stays off.
  enabled                bool not null default false,
  granted                bool not null default false,
  granted_at             timestamptz,
  declined_at            timestamptz,
  unique (integration_account_id, capability_key)
);
comment on table capability_grants is
  'Per-account capability state. Capabilities are OFF until enabled, and enabling one triggers incremental consent for exactly its scopes (see provider_scopes). The enabled/granted split is what lets the UI tell the truth about partial grants instead of silently degrading.';

create index capability_grants_account_idx on capability_grants (integration_account_id);

create table sync_preferences (
  integration_account_id uuid primary key references integration_accounts (id) on delete cascade,
  -- v1 ships manual + assist ONLY. 'sync' is the v2+ background mode and is
  -- double-gated: the application never writes it in v1, and the
  -- sync_preferences_admin_gate trigger (§8) rejects it unless the connecting
  -- user holds an owner/admin membership in the account''s workspace.
  mode                   sync_mode not null default 'assist',
  -- Gmail labels / Outlook folders to watch IF sync mode ever activates.
  labels                 text[] not null default '{}',
  folders                text[] not null default '{}',
  auto_import            bool not null default false,
  -- auto_import is meaningless outside sync mode; keep the invariant in the DB.
  constraint sync_preferences_auto_import_requires_sync
    check (mode = 'sync' or auto_import = false)
);
comment on table sync_preferences is
  'Per-account import mode on the permission ladder. Default ''assist'' = on-demand, selection-first, nothing in the background. ''sync'' requires an admin-role membership (enforced by trigger, documented in docs/INTEGRATIONS.md §2).';


-- ============================================================================
-- 5. Imported content
-- ============================================================================

create table imported_threads (
  id                     uuid primary key default gen_random_uuid(),
  workspace_id           uuid not null references workspaces (id) on delete cascade,
  -- Null for manual paste / file upload: the manual path is first-class and
  -- produces the same rows as a connected import, minus the account link.
  integration_account_id uuid references integration_accounts (id) on delete set null,
  provider_thread_ref    text,
  subject                text not null,
  source                 thread_source not null,
  -- App-layer lead identifier (see lead_workspaces.lead_ref). Text, not FK:
  -- leads live in the application domain, not in this migration.
  lead_id                text,
  imported_by            uuid not null references app_users (id) on delete restrict,
  imported_at            timestamptz not null default now(),
  -- Dedupe key: re-importing the same provider thread upserts onto this row
  -- instead of duplicating it. NULLs distinct → manual imports never collide.
  unique (integration_account_id, provider_thread_ref)
);
comment on table imported_threads is
  'An email thread (or manual equivalent) imported into a lead workspace. Provenance anchor: the UI renders source + ref + imported_by as a mono provenance chip wherever this content appears.';

create index imported_threads_workspace_id_idx on imported_threads (workspace_id);
create index imported_threads_account_idx      on imported_threads (integration_account_id);
create index imported_threads_imported_by_idx  on imported_threads (imported_by);
create index imported_threads_lead_id_idx      on imported_threads (lead_id);
create index imported_threads_ws_imported_at_idx on imported_threads (workspace_id, imported_at desc);

create table imported_messages (
  id                     uuid primary key default gen_random_uuid(),
  thread_id              uuid not null references imported_threads (id) on delete cascade,
  -- Denormalized from the parent thread (autofilled by trigger, §8) so the
  -- per-ACCOUNT dedupe key below can be a plain unique constraint.
  integration_account_id uuid references integration_accounts (id) on delete set null,
  provider_message_ref   text,
  -- RFC 5322 Message-ID: the cross-provider dedupe hint (the same message
  -- imported via Gmail and via .eml upload carries the same Message-ID).
  internet_message_id    text,
  from_name              text not null,
  from_email             text not null,
  sent_at                timestamptz,
  -- Raw body. Nullable BY DESIGN: the retention purge job nulls it after
  -- workspaces.raw_retention_days (default 90) and stamps purged_at.
  -- Extracted artifacts (briefs, scope drafts, intake analyses) are separate
  -- records and are retained — that asymmetry is the data-minimizing trade:
  -- keep the distilled work product, drop the raw correspondence.
  body_text              text
    constraint imported_messages_body_cap check (body_text is null or length(body_text) <= 262144),
  -- True when the server truncated the body at the 256 KB ingest cap.
  body_truncated         bool not null default false,
  purged_at              timestamptz,
  -- Per-account dedupe: a provider message id is unique within the account
  -- it came from. NULLs distinct → manual messages never collide.
  unique (integration_account_id, provider_message_ref)
);
comment on table imported_messages is
  'Individual messages inside an imported thread. Bodies are size-capped at ingest (256 KB, body_truncated flags the cut) and purged after the workspace retention window — purged_at records when. Headers and provenance survive the purge.';
comment on column imported_messages.purged_at is
  'Set by the retention job when body_text is nulled (after workspaces.raw_retention_days, default 90) or immediately on a user-triggered purge at disconnect. Never unset.';

create index imported_messages_thread_id_idx  on imported_messages (thread_id);
create index imported_messages_account_idx    on imported_messages (integration_account_id);
create index imported_messages_internet_id_idx on imported_messages (internet_message_id);
-- The retention purge job scans for un-purged bodies older than the window.
create index imported_messages_purge_scan_idx on imported_messages (sent_at) where purged_at is null and body_text is not null;

create table imported_documents (
  id                     uuid primary key default gen_random_uuid(),
  workspace_id           uuid not null references workspaces (id) on delete cascade,
  -- Null for direct uploads (the first-class manual path).
  integration_account_id uuid references integration_accounts (id) on delete set null,
  source                 document_source not null,
  provider_file_ref      text,
  name                   text not null,
  mime                   text not null,
  size_kb                integer not null check (size_kb >= 0),
  -- App-layer lead identifier (see lead_workspaces.lead_ref).
  lead_id                text,
  -- True when only the reference was stored and content is fetched from the
  -- provider on demand, at click time (drive.file / Files.Read model).
  -- False when the bytes were copied in (uploads, or user chose to snapshot).
  fetched_on_demand      bool not null default true,
  imported_by            uuid references app_users (id) on delete set null,
  imported_at            timestamptz not null default now()
);
comment on table imported_documents is
  'Documents attached to leads, via provider picker (per-file grants — the app can only ever see files explicitly picked) or direct upload. fetched_on_demand=true means we hold a reference, not a copy: revoking the file at the provider revokes it here too.';

create index imported_documents_workspace_id_idx on imported_documents (workspace_id);
create index imported_documents_account_idx      on imported_documents (integration_account_id);
create index imported_documents_lead_id_idx      on imported_documents (lead_id);
create index imported_documents_imported_by_idx  on imported_documents (imported_by);

create table lead_workspaces (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces (id) on delete cascade,
  -- App-layer lead identifier (e.g. "ld-harborfern"). The lead aggregate
  -- lives in the application domain; this table is the join surface that
  -- gives imported content a durable, workspace-scoped anchor.
  lead_ref         text not null,
  created_from     lead_created_from not null default 'manual',
  source_thread_id uuid references imported_threads (id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (workspace_id, lead_ref)
);
comment on table lead_workspaces is
  'Maps app-layer leads to workspaces and records whether a lead was born from an import (with the originating thread) or created manually. created_from + source_thread_id back the provenance chip on the lead.';

create index lead_workspaces_workspace_id_idx  on lead_workspaces (workspace_id);
create index lead_workspaces_source_thread_idx on lead_workspaces (source_thread_id);


-- ============================================================================
-- 6. Operations: jobs, audit, connection health
-- ============================================================================

create table ingestion_jobs (
  id                     uuid primary key default gen_random_uuid(),
  workspace_id           uuid not null references workspaces (id) on delete cascade,
  -- Null for jobs on the manual path (e.g. processing an uploaded .eml).
  integration_account_id uuid references integration_accounts (id) on delete set null,
  kind                   job_kind not null,
  status                 job_status not null default 'queued',
  attempts               integer not null default 0,
  -- Code from the typed error taxonomy in src/server (e.g. provider_rate_limited,
  -- token_refresh_failed, source_gone). Codes, never raw provider responses.
  last_error_code        text,
  -- REFS ONLY, NEVER CONTENT: provider ids, message refs, capability keys,
  -- counts. No bodies, no subjects, no attachment bytes, no email addresses
  -- beyond what the job structurally needs. The size cap backstops the rule.
  payload                jsonb not null default '{}'::jsonb
    constraint ingestion_jobs_payload_refs_only check (pg_column_size(payload) <= 8192),
  created_at             timestamptz not null default now(),
  finished_at            timestamptz
);
comment on table ingestion_jobs is
  'Work queue for imports and sends. status=partial is a first-class outcome: 9 of 10 messages imported is reported as exactly that, with the failed refs in payload for retry — never rounded up to success or down to failure.';

create index ingestion_jobs_workspace_id_idx  on ingestion_jobs (workspace_id);
create index ingestion_jobs_account_idx       on ingestion_jobs (integration_account_id);
create index ingestion_jobs_ws_created_at_idx on ingestion_jobs (workspace_id, created_at desc);
create index ingestion_jobs_dequeue_idx       on ingestion_jobs (status, created_at) where status in ('queued', 'running');

-- audit_logs vs connection_events — the split, in one place:
--   audit_logs        = the COMPLIANCE trail. Who did what, when, to which
--                       target, workspace-wide. Append-only, never edited,
--                       read by admins via a server-mediated export. Answers
--                       a security reviewer.
--   connection_events = the PRODUCT-FACING health timeline of one connected
--                       account (connected, scope granted/declined, import
--                       completed, refresh failed…). Rendered directly in the
--                       integrations hub. Answers a user asking "what has
--                       this connection been doing?".
-- Most actions write both; they serve different readers and different
-- retention/access rules, so they are different tables.

create table audit_logs (
  id            bigint generated always as identity primary key,
  workspace_id  uuid not null references workspaces (id) on delete cascade,
  -- Null for system actors (retention purge job, token refresher).
  actor_user_id uuid references app_users (id) on delete set null,
  event_name    text not null,
  target_kind   text not null,
  target_ref    text not null,
  -- REDACTED by the writer before insert: scope lists, counts, error codes,
  -- provider refs — yes. Tokens, message bodies, subjects, attachment
  -- content — never. Redaction is enforced in src/server, asserted here.
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
comment on table audit_logs is
  'Append-only compliance trail. Client roles may INSERT (workspace-scoped, self-attributed — see §9) and may not SELECT, UPDATE or DELETE; reads happen through a server endpoint that gates on owner/admin role. UPDATE/DELETE privileges are revoked outright (§10).';

create index audit_logs_workspace_id_idx   on audit_logs (workspace_id);
create index audit_logs_actor_idx          on audit_logs (actor_user_id);
create index audit_logs_ws_created_at_idx  on audit_logs (workspace_id, created_at desc);

create table connection_events (
  id                     bigint generated always as identity primary key,
  integration_account_id uuid not null references integration_accounts (id) on delete cascade,
  -- Matches IntegrationEventKind in src/lib/integrations.ts: connected,
  -- consent_screen_opened, scope_granted, scope_declined, import_completed,
  -- import_partial, send_completed, refresh_failed, reconnected,
  -- admin_blocked, disconnected, data_purged. Text (not enum) so new product
  -- event kinds don''t require a type migration; the client union is the
  -- authoritative list.
  kind                   text not null,
  detail                 text not null,
  created_at             timestamptz not null default now()
);
comment on table connection_events is
  'Product-facing health timeline per connected account — what the integrations hub renders. See the comment block above audit_logs for why this is not the same table as the compliance trail.';

create index connection_events_account_idx            on connection_events (integration_account_id);
create index connection_events_account_created_at_idx on connection_events (integration_account_id, created_at desc);


-- ============================================================================
-- 7. Helper functions (RLS building blocks)
-- ============================================================================
-- All SECURITY DEFINER with a pinned search_path: they bypass RLS on the
-- tables they consult (preventing policy recursion on memberships) and are
-- the single place membership logic lives.

create or replace function app_private.current_app_user_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select id from app_users where auth_user_id = auth.uid();
$$;

create or replace function app_private.is_workspace_member(ws uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from memberships m
    join app_users u on u.id = m.user_id
    where m.workspace_id = ws
      and u.auth_user_id = auth.uid()
  );
$$;

create or replace function app_private.is_workspace_admin(ws uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from memberships m
    join app_users u on u.id = m.user_id
    where m.workspace_id = ws
      and u.auth_user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

create or replace function app_private.is_org_member(org uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from workspaces w
    join memberships m on m.workspace_id = w.id
    join app_users u on u.id = m.user_id
    where w.org_id = org
      and u.auth_user_id = auth.uid()
  );
$$;

create or replace function app_private.is_account_member(acct uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from integration_accounts a
    where a.id = acct
      and app_private.is_workspace_member(a.workspace_id)
  );
$$;

create or replace function app_private.is_account_admin(acct uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from integration_accounts a
    where a.id = acct
      and app_private.is_workspace_admin(a.workspace_id)
  );
$$;

create or replace function app_private.shares_workspace_with_current_user(target uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from memberships mine
    join memberships theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = app_private.current_app_user_id()
      and theirs.user_id = target
  );
$$;


-- ============================================================================
-- 8. Triggers
-- ============================================================================

-- v1 ships manual + assist only. 'sync' (background watch) additionally
-- requires that the user who connected the account holds an owner/admin
-- membership in the account's workspace. The application enforces this in
-- the UI and the API; this trigger makes the database refuse it regardless.
create or replace function app_private.enforce_sync_mode_admin()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.mode = 'sync' then
    if not exists (
      select 1
      from integration_accounts a
      join memberships m on m.workspace_id = a.workspace_id
      where a.id = new.integration_account_id
        and m.user_id = a.connected_by
        and m.role in ('owner', 'admin')
    ) then
      raise exception
        'sync mode requires the connecting user to hold an owner or admin membership in this workspace'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger sync_preferences_admin_gate
  before insert or update on sync_preferences
  for each row execute function app_private.enforce_sync_mode_admin();

-- Keep provider_tokens.updated_at honest (refresh writes go through here).
create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger provider_tokens_touch
  before update on provider_tokens
  for each row execute function app_private.touch_updated_at();

-- Autofill the denormalized dedupe column on imported_messages from the
-- parent thread so writers cannot get it wrong.
create or replace function app_private.fill_message_account()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.integration_account_id is null then
    select t.integration_account_id
      into new.integration_account_id
      from imported_threads t
     where t.id = new.thread_id;
  end if;
  return new;
end;
$$;

create trigger imported_messages_fill_account
  before insert on imported_messages
  for each row execute function app_private.fill_message_account();


-- ============================================================================
-- 9. Row-level security
-- ============================================================================
-- Enabled on EVERY table. Client roles read through workspace membership;
-- writes are service-role only (the Next.js server) except audit_logs INSERT.
-- service_role carries BYPASSRLS on Supabase and is unaffected by policies.

alter table organizations         enable row level security;
alter table workspaces            enable row level security;
alter table app_users             enable row level security;
alter table memberships           enable row level security;
alter table integration_providers enable row level security;
alter table provider_scopes       enable row level security;
alter table integration_accounts  enable row level security;
alter table provider_tokens       enable row level security;
alter table capability_grants     enable row level security;
alter table sync_preferences      enable row level security;
alter table imported_threads      enable row level security;
alter table imported_messages     enable row level security;
alter table imported_documents    enable row level security;
alter table lead_workspaces       enable row level security;
alter table ingestion_jobs        enable row level security;
alter table audit_logs            enable row level security;
alter table connection_events     enable row level security;

-- Tenancy ---------------------------------------------------------------

create policy organizations_member_select on organizations
  for select to authenticated
  using (app_private.is_org_member(id));

create policy workspaces_member_select on workspaces
  for select to authenticated
  using (app_private.is_workspace_member(id));

create policy app_users_visible_select on app_users
  for select to authenticated
  using (
    auth_user_id = auth.uid()
    or app_private.shares_workspace_with_current_user(id)
  );

create policy app_users_self_update on app_users
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy memberships_member_select on memberships
  for select to authenticated
  using (app_private.is_workspace_member(workspace_id));

-- Registries (read-only reference data for any signed-in user) -----------

create policy integration_providers_read on integration_providers
  for select to authenticated
  using (true);

create policy provider_scopes_read on provider_scopes
  for select to authenticated
  using (true);

-- Connections -------------------------------------------------------------

create policy integration_accounts_member_select on integration_accounts
  for select to authenticated
  using (app_private.is_workspace_member(workspace_id));

-- provider_tokens: NO permissive policy exists for client roles — there is
-- nothing to satisfy, so every client read/write is denied. The RESTRICTIVE
-- policy below is defense in depth: even if someone later adds a permissive
-- policy by mistake, restrictive policies AND together and this still denies.
create policy provider_tokens_deny_clients on provider_tokens
  as restrictive
  for all to anon, authenticated
  using (false)
  with check (false);

create policy capability_grants_member_select on capability_grants
  for select to authenticated
  using (app_private.is_account_member(integration_account_id));

create policy sync_preferences_member_select on sync_preferences
  for select to authenticated
  using (app_private.is_account_member(integration_account_id));

-- Workspace admins may adjust labels/folders/mode from the client; the
-- sync_preferences_admin_gate trigger still refuses mode='sync' unless the
-- connecting user is owner/admin.
create policy sync_preferences_admin_update on sync_preferences
  for update to authenticated
  using (app_private.is_account_admin(integration_account_id))
  with check (app_private.is_account_admin(integration_account_id));

-- Imported content ----------------------------------------------------------

create policy imported_threads_member_select on imported_threads
  for select to authenticated
  using (app_private.is_workspace_member(workspace_id));

create policy imported_messages_member_select on imported_messages
  for select to authenticated
  using (
    exists (
      select 1 from imported_threads t
      where t.id = thread_id
        and app_private.is_workspace_member(t.workspace_id)
    )
  );

create policy imported_documents_member_select on imported_documents
  for select to authenticated
  using (app_private.is_workspace_member(workspace_id));

create policy lead_workspaces_member_select on lead_workspaces
  for select to authenticated
  using (app_private.is_workspace_member(workspace_id));

-- Operations -----------------------------------------------------------------

create policy ingestion_jobs_member_select on ingestion_jobs
  for select to authenticated
  using (app_private.is_workspace_member(workspace_id));

-- audit_logs: INSERT-only for the app role. Rows must land in a workspace
-- the caller belongs to and must be attributed to the caller — no writing
-- history as someone else. No SELECT policy: reads go through a server
-- endpoint (service_role) that gates on owner/admin and handles export.
create policy audit_logs_member_insert on audit_logs
  for insert to authenticated
  with check (
    app_private.is_workspace_member(workspace_id)
    and actor_user_id = app_private.current_app_user_id()
  );

create policy connection_events_member_select on connection_events
  for select to authenticated
  using (app_private.is_account_member(integration_account_id));


-- ============================================================================
-- 10. Privilege hygiene
-- ============================================================================
-- RLS is the row filter; GRANT/REVOKE is the verb filter. Supabase grants
-- broad table privileges to anon/authenticated by default — trim them so the
-- privilege surface matches the policy surface exactly.

-- Anonymous users have no business in any of these tables.
revoke all on organizations, workspaces, app_users, memberships,
  integration_providers, provider_scopes, integration_accounts,
  provider_tokens, capability_grants, sync_preferences,
  imported_threads, imported_messages, imported_documents, lead_workspaces,
  ingestion_jobs, audit_logs, connection_events
from anon;

-- provider_tokens: service-role only, full stop.
revoke all on provider_tokens from authenticated;

-- Read-only-for-clients tables: strip the write verbs entirely.
revoke insert, update, delete on organizations, workspaces, memberships,
  integration_providers, provider_scopes, integration_accounts,
  capability_grants, imported_threads, imported_messages, imported_documents,
  lead_workspaces, ingestion_jobs, connection_events
from authenticated;

-- app_users: select + self-update only (policy-gated above).
revoke insert, delete on app_users from authenticated;

-- sync_preferences: select + admin update; inserts come from the server.
revoke insert, delete on sync_preferences from authenticated;

-- audit_logs: append-only — clients may insert (policy-gated), nothing else.
revoke select, update, delete on audit_logs from authenticated;

-- Helper schema: policies executing as authenticated need to call into it.
grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;


-- ============================================================================
-- 11. Seeds — provider + scope registry
-- ============================================================================
-- Mirrors PROVIDER_META, PLANNED_CONNECTORS and CAPABILITIES in
-- src/lib/integrations.ts, which is the authoritative source for capability
-- copy (what we access / what we don't / why). If the registry there changes,
-- a follow-up migration updates these rows.

insert into integration_providers (key, display_name, phase, status) values
  ('google',    'Google Workspace', 1, 'live'),
  ('microsoft', 'Microsoft 365',    2, 'beta'),
  -- Roadmap connectors — rendered in the hub as planned, never as buttons.
  ('hubspot',   'HubSpot',          3, 'planned'),   -- CRM sync
  ('pipedrive', 'Pipedrive',        3, 'planned'),   -- CRM sync
  ('slack',     'Slack',            3, 'planned'),   -- Lead alerts
  ('notion',    'Notion',           3, 'planned'),   -- Brief export
  ('clickup',   'ClickUp',          3, 'planned'),   -- Delivery handoff
  ('stripe',    'Stripe',           3, 'planned');   -- Deposit invoicing

insert into provider_scopes (provider_key, scope, sensitivity, capability_key) values
  -- email_import — "Import selected email threads". On-demand, selection-first.
  -- gmail.readonly is RESTRICTED: app verification + annual CASA assessment
  -- before public rollout. See docs/INTEGRATIONS.md §3 for the rollout order
  -- and the Gmail Add-on least-privilege companion path.
  ('google',    'https://www.googleapis.com/auth/gmail.readonly',           'restricted', 'email_import'),
  ('microsoft', 'Mail.Read',                                                'restricted', 'email_import'),

  -- send_followups — "Send follow-ups from your address". Send-only; cannot read.
  ('google',    'https://www.googleapis.com/auth/gmail.send',               'sensitive',  'send_followups'),
  ('microsoft', 'Mail.Send',                                                'sensitive',  'send_followups'),

  -- drive_files — "Attach selected documents". Per-file via picker; the app
  -- can only ever see files the user explicitly picked (drive.file is
  -- non-sensitive for exactly this reason).
  ('google',    'https://www.googleapis.com/auth/drive.file',               'standard',   'drive_files'),
  ('microsoft', 'Files.Read',                                               'standard',   'drive_files'),

  -- calendar_read — "Read discovery-call events". Phase 2; read-only.
  ('google',    'https://www.googleapis.com/auth/calendar.events.readonly', 'sensitive',  'calendar_read'),
  ('microsoft', 'Calendars.Read',                                           'sensitive',  'calendar_read');

-- ============================================================================
-- End of migration 0001
-- ============================================================================
