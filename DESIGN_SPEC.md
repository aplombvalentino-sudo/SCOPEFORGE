# SCOPEFORGE — Build Contract

This document is the binding contract for every page built in this codebase.
Read the referenced foundation files before writing any code.

## Product

SCOPEFORGE is a quote-to-scope, proposal, onboarding, and scope-control web app for
agencies (3–25 people, €2k–50k projects). Demo workspace: **Atelier North**, a
14-person Copenhagen digital agency. The demo user is Maya Lindqvist (founder).
Tone of all copy: calm confidence, operational clarity, commercially intelligent.
NEVER write: "empower", "unlock", "revolutionize", "supercharge", "AI-powered" without
a concrete mechanism. AI features are named plainly: "intake analysis", "scope engine",
"margin guidance", "draft follow-up".

## Visual language

Dark "petrol control room" is the default theme; light is supported automatically via
semantic tokens. RULES:

- ONLY use semantic token classes, never raw colors, never Tailwind palette colors
  (no `bg-zinc-900`, no `text-emerald-400`).
- Surfaces: `bg-bg` (app), `bg-surface` (panel), `bg-raised` (elevated), `bg-overlay`
  (popover), `bg-inset` (wells/inputs).
- Lines: `border-line`, `border-line-strong`. Hairline borders everywhere; depth comes
  from layering + `shadow-e1/e2/e3`, not heavy drop shadows.
- Ink: `text-ink`, `text-ink-mute`, `text-ink-faint`.
- ONE accent: `bg-accent`, `text-accent`, `bg-accent-soft`, `border-accent-line`,
  `text-on-accent`, hover `bg-accent-hover`. Status: `ok`, `warn`, `danger`, `info`
  (+ `-soft` backgrounds). Status colors are for status ONLY, never decoration.
- Radii are small and technical: `rounded-sm/md/lg/xl` (3/5/7/10/14px). No pills except
  badges/avatars/progress.
- Fonts: `font-display` (Space Grotesk — headlines, KPIs), `font-body` (Manrope — default),
  `font-mono` (JetBrains Mono — numbers, IDs, timestamps, micro-labels).
- Utility classes defined in globals.css: `microlabel` (mono uppercase label),
  `tnum` (tabular numbers — use on EVERY numeric), `panel`, `panel-raised`, `well`,
  `blueprint` + `blueprint-fade` (grid texture — sparingly: heroes, empty states),
  `skeleton`, `pulse-dot`.
- App base font size is 14px; tables run 13px. Dense, serious, not overpadded:
  cards `px-4 py-3.5`-ish, never `p-8` walls.
- NO gradients except the existing chart fills; NO floating blobs; NO icon-in-colored-
  circle hero rows; NO purple anywhere.

## Foundation APIs (import, never re-implement)

- `@/lib/types` — all domain types + STAGE_LABELS, STAGE_ORDER, TIER_LABELS,
  PROPOSAL_STATUS_LABELS.
- `@/lib/demo-data` — seed data + `teamById`, `workspace`, `analytics`.
- `@/lib/store` — `useApp()` zustand hook. State + actions (setLeadStage, updateLead,
  addLead, runIntakeAnalysis, updateBrief, answerBriefQuestion, updateScope,
  updateProposal, setProposalStatus, moveProposalSection, toggleProposalSection,
  setFollowUpStatus, toggleOnboardingTask, setChangeOrderStatus, markNotificationRead,
  markAllNotificationsRead, logActivity). `analyzingLeadId` is the simulated-AI busy flag.
  Pages that read the store MUST be client components (`"use client"`).
- `@/lib/format` — money, moneyCompact, pct, shortDate, fullDate, timeAgo, dueIn,
  daysFromNow, marginPct, initials, cx. Use `cx` for class joining.
- `@/lib/motion` — EASE, DUR, pageVariants, listVariants, itemVariants, drawerVariants,
  modalVariants, overlayVariants, collapseVariants. Use these, don't invent curves.
- `@/components/ui/icons` — `<Icon name="..." size={16}/>`. The ONLY icon source.
  Names: dashboard, leads, brief, scope, proposal, onboarding, change-order, template,
  service, follow-up, analytics, settings, help, bell, search, command, plus, x, check,
  chevron-down/up/right/left, arrow-right, arrow-up-right, alert-triangle, sparkle,
  upload, send, pen, trash, copy, eye, calendar, mail, phone, link, filter, kanban,
  list, more, grip, download, external, logout, building, clock, shield, target, zap,
  activity, archive, inbox, euro, doc.
- `@/components/ui/primitives` — Button (variant: primary/secondary/ghost/danger,
  size: sm/md, loading), Badge (tone), StagePill, RiskBadge, Avatar, Progress, Kbd, Dot.
- `@/components/ui/fields` — Field, Input, Textarea, Select, Toggle, CheckItem.
- `@/components/ui/overlays` — Modal, Drawer (right sheet, use for record detail),
  Menu (dropdown items).
- `@/components/ui/tabs` — Tabs (underline, animated), Segmented (list/board switches).
- `@/components/ui/table` — Table, THead, TH (numeric), TBody, TR (onClick → row nav),
  TD (numeric).
- `@/components/ui/kpi` — KpiCard (animated count-up; pass render={v => money(v)} for
  currency), CountUp.
- `@/components/ui/feedback` — Skeleton, SkeletonRows, EmptyState (icon/title/body/action),
  useToast() → toast.success/error/info, ErrorPanel. Toaster is already mounted in AppShell.
- `@/components/ui/charts` — Sparkline, BarRow, MiniBars, FunnelSteps, RingGauge.
- `@/components/ui/page` — PageTransition (wrap EVERY app page root), PageHeader
  (overline = mono breadcrumb like "PIPELINE / LEADS"), Section.
- `@/components/ui/timeline` — Timeline (events from store.activity).
- `@/components/shell/marketing-shell` — DemoCta (opens demo modal), useDemoModal.
- `@/components/shell/app-shell` — already mounted via (app)/layout. NAV_SECTIONS,
  Wordmark exported.
- `@/components/theme` — useTheme, ThemeToggle (already in shells).

## Route map & layouts

`src/app/(marketing)/…` → marketing shell (nav+footer). Routes: `/` (landing),
`/product`, `/pricing`, `/login`, `/signup`.
`src/app/(app)/…` → app shell (sidebar+topbar). Routes: `/dashboard`, `/leads`,
`/leads/[id]`, `/briefs`, `/briefs/[id]`, `/scopes`, `/scopes/[id]`, `/proposals`,
`/proposals/[id]`, `/proposals/[id]/preview`, `/onboarding`, `/onboarding/[id]`,
`/change-orders`, `/templates`, `/services`, `/follow-ups`, `/analytics`, `/activity`,
`/notifications`, `/settings`, `/help`.

Dynamic routes: client components reading `useParams()`, looking up the store, and
rendering EmptyState/ErrorPanel for unknown ids (no dead ends — always link back).
Detail pages must add `loading.tsx` with skeletons where data lookup is non-trivial.
Every list page must handle its empty/filtered-empty state with EmptyState + action.

## Interaction conventions

- Page roots: `<PageTransition>` + `<PageHeader overline="…" title="…" actions={…}/>`.
- Lists stagger in with listVariants/itemVariants. Tables: TR onClick navigates.
- Drawers for quick inspect, full routes for deep work.
- Mutations go through store actions and fire a toast (useToast) with concrete copy
  ("Proposal marked sent — follow-up armed for Friday", not "Success!").
- Simulated AI: check `analyzingLeadId`; while busy show a working state (shimmer +
  "Reading intake… extracting goals… pricing signals…" stepped copy), NEVER instant.
- Keyboard: Escape closes overlays (built-in). Focus states come free via globals.
- Respect reduced motion (framer picks up the CSS; avoid infinite animations except
  `pulse-dot`).

## Integrations layer (addendum)

The integrations feature has TWO halves; never blur them:

1. **Production-shaped server code** in `src/server/**` and `src/app/api/integrations/**` —
   real OAuth 2.0 + PKCE architecture, encrypted token vault, provider adapters over raw
   fetch (no SDKs), typed error taxonomy. It must compile and be honestly implementable;
   when provider env vars are absent it reports `mode: "sandbox"` instead of failing.
2. **Sandbox client experience** driven by `@/lib/integrations` (domain + seed) and
   `@/lib/integrations-store` (`useIntegrations()` zustand slice). Every UX state —
   consent, partial grant, reconnect, admin-blocked, import, disconnect — is exercisable
   in the prototype with realistic latency.

Client APIs:
- `@/lib/integrations` — CAPABILITIES (capability→scope registry with what/not/why copy),
  CAPABILITY_BY_KEY, PROVIDER_META, PLANNED_CONNECTORS, types (IntegrationProvider,
  ConnectionStatus, CapabilityKey, IntegrationConnection, IntegrationEvent, InboxThread,
  DriveFile), seeds.
- `@/lib/integrations-store` — useIntegrations(): connections, events, inboxThreads,
  driveFiles, authorizing; actions: beginAuthorization, completeAuthorization(provider,
  outcome, capabilities), requestCapability, simulateExpiry, reconnect, disconnect
  (purgeImports flag), importThread (creates/updates leads with provenance, can trigger
  runIntakeAnalysis), attachDriveFiles.
- `Lead.provenance` ({source, ref, importedAt, importedBy, parts}) — render as a mono
  provenance chip wherever imported content appears.

NON-NEGOTIABLE rules for integration surfaces:
- NEVER imitate Google's or Microsoft's real consent/login UI. The sandbox consent moment
  is an abstract, neutral "external authorization" frame labeled as a simulation
  ("Sandbox — in production this opens accounts.google.com"). No Google logo recreations,
  no password fields for providers, ever.
- Sandbox honesty: connected state shows a subtle "Sandbox" Badge; demo state controls
  (expire token, simulate admin block) live behind a clearly-labeled "Demo controls" menu.
- Trust copy pattern everywhere: WHAT we access / what we do NOT access / WHY / WHEN
  (on-demand vs background) / HOW to disconnect. Use the registry copy, don't invent.
- Capabilities are off until enabled; enabling one shows its exact scopes before consent.
- Manual mode is never degraded: every integration surface offers the paste/upload path
  as a first-class alternative, not a fallback apology.
- New icons available: plug, lock, key, refresh, globe.

## Copy rules

Every heading concrete, every metric explained. Money in EUR via `money()` (Northgate
is £ in copy — keep £ inside its prose strings, € for its numeric props is acceptable
as the data already encodes it). Buttons say what happens: "Generate change order",
"Send & arm follow-ups", "Approve scope". Empty states teach: what this module does +
the primary action. Never lorem ipsum.
