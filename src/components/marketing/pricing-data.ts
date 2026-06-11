/* ================================================================
   Marketing pricing data — shared by the landing preview and the
   /pricing page (tier cards + full comparison table).
   ================================================================ */

export type Billing = "monthly" | "annual";

export const ANNUAL_DISCOUNT = 0.2;

export interface MarketingTier {
  key: "studio" | "agency" | "scale";
  name: string;
  monthly: number | null; // null = custom pricing
  audience: string;
  blurb: string;
  features: string[];
  highlighted?: boolean;
  cta: { label: string; kind: "signup" | "demo" };
}

export function tierPrice(tier: MarketingTier, billing: Billing): number | null {
  if (tier.monthly === null) return null;
  return billing === "annual"
    ? Math.round(tier.monthly * (1 - ANNUAL_DISCOUNT))
    : tier.monthly;
}

export const MARKETING_TIERS: MarketingTier[] = [
  {
    key: "studio",
    name: "Studio",
    monthly: 49,
    audience: "For 2–6 person studios",
    blurb:
      "The full intake-to-proposal chain with sensible limits. Enough to stop quoting from memory.",
    features: [
      "1 workspace, up to 6 seats",
      "25 intake analyses / month",
      "15 proposal sends / month",
      "Scope builder with exclusions & assumptions",
      "3-tier pricing on every quote",
      "Standard template library",
      "Email support",
    ],
    cta: { label: "Create workspace", kind: "signup" },
  },
  {
    key: "agency",
    name: "Agency",
    monthly: 79,
    audience: "For 6–25 person agencies",
    blurb:
      "Margin rules, change-order engine, armed follow-ups. The plan Atelier North runs on.",
    features: [
      "3 workspaces, up to 25 seats",
      "100 intake analyses / month",
      "Unlimited proposal sends",
      "Margin rules + floor alerts",
      "Change-order engine, pre-priced replies",
      "Automated follow-up sequences",
      "Onboarding flows + 14-day plans",
      "Priority support, same business day",
    ],
    highlighted: true,
    cta: { label: "Book a demo", kind: "demo" },
  },
  {
    key: "scale",
    name: "Scale",
    monthly: null,
    audience: "For groups & 25+ teams",
    blurb:
      "Governance for multi-team operations: SSO, audit, API, and margin policy per service line.",
    features: [
      "Unlimited workspaces & seats",
      "Custom analysis volume",
      "SSO / SAML + SCIM provisioning",
      "Audit log with export",
      "Full API + webhooks",
      "Margin policies per service line",
      "Concierge migration + dedicated CSM",
      "99.9% uptime SLA",
    ],
    cta: { label: "Talk to us", kind: "demo" },
  },
];

/* ---------- comparison table ---------- */

export interface CompareRow {
  label: string;
  studio: string | boolean;
  agency: string | boolean;
  scale: string | boolean;
}

export interface CompareGroup {
  group: string;
  rows: CompareRow[];
}

export const COMPARE_GROUPS: CompareGroup[] = [
  {
    group: "Workspace",
    rows: [
      { label: "Workspaces", studio: "1", agency: "3", scale: "Unlimited" },
      { label: "Team seats", studio: "Up to 6", agency: "Up to 25", scale: "Custom" },
      { label: "Client-visible onboarding pages", studio: true, agency: true, scale: true },
    ],
  },
  {
    group: "Intake & briefs",
    rows: [
      { label: "Intake analyses / month", studio: "25", agency: "100", scale: "Custom" },
      { label: "Sources (email, transcript, Loom, PDF)", studio: true, agency: true, scale: true },
      { label: "Open-question tracking on briefs", studio: true, agency: true, scale: true },
    ],
  },
  {
    group: "Scope & pricing",
    rows: [
      { label: "Scope guardrails (exclusions, assumptions, revision rounds)", studio: true, agency: true, scale: true },
      { label: "3-tier pricing with payment schedules", studio: true, agency: true, scale: true },
      { label: "Margin rules & floor alerts", studio: false, agency: true, scale: true },
      { label: "Margin policy per service line", studio: false, agency: false, scale: true },
      { label: "Change-order engine with pre-priced replies", studio: false, agency: true, scale: true },
    ],
  },
  {
    group: "Proposals & follow-up",
    rows: [
      { label: "Proposal sends / month", studio: "15", agency: "Unlimited", scale: "Unlimited" },
      { label: "View tracking & expiry dates", studio: true, agency: true, scale: true },
      { label: "E-signature on proposals", studio: true, agency: true, scale: true },
      { label: "Follow-up sequences", studio: "Manual drafts", agency: "Armed at send", scale: "Armed at send" },
    ],
  },
  {
    group: "Library",
    rows: [
      { label: "Service blueprints", studio: "3", agency: "Unlimited", scale: "Unlimited" },
      { label: "Onboarding templates", studio: "1", agency: "Unlimited", scale: "Unlimited" },
      { label: "Custom proposal templates", studio: false, agency: true, scale: "+ locked fields" },
    ],
  },
  {
    group: "Admin & security",
    rows: [
      { label: "SSO / SAML + SCIM", studio: false, agency: false, scale: true },
      { label: "Audit log", studio: false, agency: "30 days", scale: "Unlimited + export" },
      { label: "API & webhooks", studio: false, agency: "Read-only", scale: "Full" },
      { label: "Support", studio: "Email", agency: "Priority, same-day", scale: "Dedicated CSM + SLA" },
    ],
  },
];
