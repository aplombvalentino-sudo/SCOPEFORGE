/* ================================================================
   SCOPEFORGE domain model
   All demo entities are typed here. The zustand store (store.ts)
   holds collections of these and exposes mutation actions.
   ================================================================ */

export type Stage =
  | "intake"
  | "brief"
  | "scoping"
  | "proposal_draft"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost";

export const STAGE_LABELS: Record<Stage, string> = {
  intake: "Intake",
  brief: "Brief",
  scoping: "Scoping",
  proposal_draft: "Proposal draft",
  proposal_sent: "Proposal sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const STAGE_ORDER: Stage[] = [
  "intake",
  "brief",
  "scoping",
  "proposal_draft",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
];

export type RiskLevel = "low" | "medium" | "high";

export type LeadSource =
  | "email"
  | "website_form"
  | "referral"
  | "call_notes"
  | "loom"
  | "meeting_transcript"
  | "pdf_brief";

export interface Contact {
  name: string;
  role: string;
  email: string;
}

export interface IntakeAnalysis {
  summary: string;
  goals: string[];
  missingInfo: string[];
  risks: string[];
  timelineClues: string[];
  budgetClues: string[];
  suggestedQuestions: string[];
  /** 0–100, how complete the intake information is */
  confidence: number;
}

/** Where imported intake material came from — kept for traceability. */
export interface Provenance {
  source: "manual" | "gmail" | "outlook" | "upload";
  /** provider-side reference, e.g. Gmail thread id */
  ref?: string;
  importedAt?: string;
  importedBy?: string;
  /** human-readable parts, e.g. "3 messages", "brief.pdf" */
  parts?: string[];
}

export interface Lead {
  id: string;
  company: string;
  contact: Contact;
  source: LeadSource;
  provenance?: Provenance;
  projectType: string;
  /** one-line working summary shown in lists */
  summary: string;
  /** estimated deal value in EUR */
  value: number;
  stage: Stage;
  risk: RiskLevel;
  riskNote?: string;
  tags: string[];
  ownerId: string;
  createdAt: string; // ISO
  lastActivityAt: string; // ISO
  /** raw pasted/imported intake content */
  rawIntake?: string;
  intakeAnalysis?: IntakeAnalysis;
  briefId?: string;
  scopeId?: string;
  proposalId?: string;
  onboardingId?: string;
  notes?: string;
}

/* ---------- Brief ---------- */

export type BriefStatus = "draft" | "needs_clarification" | "confirmed";

export interface Brief {
  id: string;
  leadId: string;
  status: BriefStatus;
  clientContext: string;
  projectGoal: string;
  successMetrics: string[];
  deliverablesSummary: string;
  constraints: string[];
  stakeholders: { name: string; role: string; influence: "decision" | "input" | "informed" }[];
  dependencies: string[];
  budgetNote: string;
  timelineNote: string;
  openQuestions: { id: string; question: string; answered: boolean; answer?: string }[];
  updatedAt: string;
}

/* ---------- Scope ---------- */

export type ScopeStatus = "draft" | "in_review" | "approved";

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  effortDays: number;
  /** which pricing tiers include it */
  tiers: TierKey[];
}

export interface Milestone {
  id: string;
  title: string;
  week: number;
  durationWeeks: number;
  description: string;
}

export interface RiskFlag {
  id: string;
  label: string;
  level: RiskLevel;
  detail: string;
}

export interface ScopeDoc {
  id: string;
  leadId: string;
  status: ScopeStatus;
  deliverables: Deliverable[];
  exclusions: string[];
  assumptions: string[];
  revisionRounds: number;
  milestones: Milestone[];
  dependencies: string[];
  acceptanceCriteria: string[];
  riskFlags: RiskFlag[];
  timelineWeeks: number;
  updatedAt: string;
}

/* ---------- Pricing ---------- */

export type TierKey = "lean" | "standard" | "premium";

export const TIER_LABELS: Record<TierKey, string> = {
  lean: "Lean",
  standard: "Standard",
  premium: "Premium",
};

export interface PricingTier {
  key: TierKey;
  name: string;
  price: number;
  /** estimated internal cost */
  cost: number;
  summary: string;
  inclusions: string[];
  recommended?: boolean;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface PaymentTerm {
  label: string;
  pct: number;
  trigger: string;
}

export interface PricingModel {
  id: string;
  leadId: string;
  mode: "project" | "retainer";
  tiers: PricingTier[];
  addOns: AddOn[];
  depositPct: number;
  schedule: PaymentTerm[];
  /** internal guidance copy from the margin engine */
  marginGuidance: string;
  updatedAt: string;
}

/* ---------- Proposal ---------- */

export type ProposalStatus =
  | "draft"
  | "internal_review"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "expired";

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Draft",
  internal_review: "Internal review",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
};

export type ProposalSectionKind =
  | "executive_summary"
  | "scope_of_work"
  | "deliverables"
  | "exclusions"
  | "timeline"
  | "pricing"
  | "terms"
  | "revision_policy"
  | "next_steps";

export interface ProposalSection {
  id: string;
  kind: ProposalSectionKind;
  title: string;
  /** markdown-ish body paragraphs */
  body: string[];
  enabled: boolean;
}

export interface Proposal {
  id: string;
  leadId: string;
  title: string;
  status: ProposalStatus;
  amount: number;
  tierSelected: TierKey;
  style: "concise" | "detailed";
  sections: ProposalSection[];
  validUntil: string;
  sentAt?: string;
  viewedAt?: string;
  decidedAt?: string;
  /** view count from client-side tracking simulation */
  views: number;
  updatedAt: string;
}

/* ---------- Follow-up ---------- */

export type FollowUpStatus = "due" | "scheduled" | "done" | "skipped";

export interface FollowUp {
  id: string;
  leadId: string;
  proposalId?: string;
  dueAt: string;
  sequenceStep: number; // 1st nudge, 2nd nudge...
  channel: "email" | "call" | "linkedin";
  status: FollowUpStatus;
  draftMessage: string;
  reason: string;
}

/* ---------- Onboarding ---------- */

export interface OnboardingTask {
  id: string;
  title: string;
  group: "kickoff" | "assets" | "access" | "internal" | "client";
  ownerId?: string;
  dueInDays: number;
  done: boolean;
}

export interface OnboardingFlow {
  id: string;
  leadId: string;
  clientName: string;
  projectName: string;
  kickoffDate: string;
  tasks: OnboardingTask[];
  assetRequests: string[];
  stakeholders: { name: string; role: string; side: "client" | "agency" }[];
  planFirst14Days: { day: number; action: string }[];
  welcomeNote: string;
}

/* ---------- Change orders ---------- */

export type ChangeClassification = "in_scope" | "borderline" | "out_of_scope";

export interface ChangeOrder {
  id: string;
  leadId: string;
  projectName: string;
  requestText: string;
  requestedBy: string;
  receivedAt: string;
  classification: ChangeClassification;
  rationale: string;
  scopeReference: string;
  suggestedWording: string;
  price: number;
  effortDays: number;
  status: "open" | "sent" | "approved" | "declined";
}

/* ---------- Library ---------- */

export type TemplateKind = "proposal" | "scope_module" | "onboarding" | "email";

export interface Template {
  id: string;
  kind: TemplateKind;
  name: string;
  description: string;
  tags: string[];
  usedCount: number;
  updatedAt: string;
  sections?: string[];
}

export interface ServiceBlueprint {
  id: string;
  name: string;
  category: string;
  description: string;
  pricingMode: "project" | "retainer";
  basePrice: number;
  targetMarginPct: number;
  typicalTimelineWeeks: number;
  deliverables: string[];
  standardExclusions: string[];
  revisionRounds: number;
  usedCount: number;
}

/* ---------- Activity / notifications ---------- */

export type ActivityKind =
  | "lead_created"
  | "intake_analyzed"
  | "brief_updated"
  | "scope_updated"
  | "proposal_sent"
  | "proposal_viewed"
  | "proposal_accepted"
  | "follow_up_sent"
  | "onboarding_started"
  | "change_order"
  | "comment"
  | "stage_change";

export interface ActivityEvent {
  id: string;
  at: string;
  actorId: string;
  kind: ActivityKind;
  text: string;
  leadId?: string;
}

export interface AppNotification {
  id: string;
  at: string;
  kind: "alert" | "info" | "success";
  title: string;
  body: string;
  read: boolean;
  href?: string;
}

/* ---------- Workspace ---------- */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
  seatStatus: "active" | "invited";
}

export interface Workspace {
  name: string;
  plan: "Studio" | "Agency" | "Scale";
  seats: number;
  brandColor: string;
  domain: string;
}
