"use client";

/* ================================================================
   SCOPEFORGE client store — zustand over the demo dataset.
   All mutations flow through actions here so every screen stays
   in sync (pipeline, dashboard, follow-ups, notifications...).
   AI runs are simulated with realistic latency.
   ================================================================ */

import { create } from "zustand";
import {
  activity as seedActivity,
  briefs as seedBriefs,
  changeOrders as seedChangeOrders,
  followUps as seedFollowUps,
  leads as seedLeads,
  notifications as seedNotifications,
  onboardingFlows as seedOnboarding,
  pricingModels as seedPricing,
  proposals as seedProposals,
  scopes as seedScopes,
  services as seedServices,
  team as seedTeam,
  templates as seedTemplates,
  workspace as seedWorkspace,
} from "./demo-data";
import { daysFromNow } from "./format";
import type {
  ActivityEvent,
  AppNotification,
  Brief,
  ChangeOrder,
  FollowUp,
  FollowUpStatus,
  IntakeAnalysis,
  Lead,
  OnboardingFlow,
  PricingModel,
  Proposal,
  ProposalStatus,
  ScopeDoc,
  ServiceBlueprint,
  Stage,
  TeamMember,
  Template,
  Workspace,
} from "./types";

interface AppState {
  workspace: Workspace;
  team: TeamMember[];
  leads: Lead[];
  briefs: Brief[];
  scopes: ScopeDoc[];
  pricingModels: PricingModel[];
  proposals: Proposal[];
  followUps: FollowUp[];
  onboardingFlows: OnboardingFlow[];
  changeOrders: ChangeOrder[];
  templates: Template[];
  services: ServiceBlueprint[];
  activity: ActivityEvent[];
  notifications: AppNotification[];

  /** lead id currently being analyzed by the simulated AI */
  analyzingLeadId: string | null;

  setLeadStage: (id: string, stage: Stage) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  addLead: (lead: Lead) => void;
  runIntakeAnalysis: (leadId: string, rawText?: string) => void;

  updateBrief: (id: string, patch: Partial<Brief>) => void;
  answerBriefQuestion: (briefId: string, questionId: string, answer: string) => void;

  updateScope: (id: string, patch: Partial<ScopeDoc>) => void;

  updateProposal: (id: string, patch: Partial<Proposal>) => void;
  setProposalStatus: (id: string, status: ProposalStatus) => void;
  moveProposalSection: (id: string, sectionId: string, dir: -1 | 1) => void;
  toggleProposalSection: (id: string, sectionId: string) => void;

  setFollowUpStatus: (id: string, status: FollowUpStatus) => void;

  toggleOnboardingTask: (flowId: string, taskId: string) => void;

  setChangeOrderStatus: (id: string, status: ChangeOrder["status"]) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  logActivity: (kind: ActivityEvent["kind"], text: string, leadId?: string) => void;
}

let activityCounter = 100;

/** Lightweight heuristic so pasting arbitrary text still yields a plausible analysis. */
function genericAnalysis(raw: string): IntakeAnalysis {
  const lower = raw.toLowerCase();
  const hasBudget = /€|\$|£|budget|thousand|\bk\b/.test(lower);
  const hasTimeline = /deadline|launch|by (january|february|march|april|may|june|july|august|september|october|november|december)|q[1-4]|week|month/.test(lower);
  return {
    summary:
      "Inbound request parsed. The core ask, urgency drivers, and constraints below are extracted from the raw text; gaps are listed as missing information.",
    goals: [
      "Primary objective extracted from the request — review and refine",
      "Secondary outcome implied by the business context",
    ],
    missingInfo: [
      ...(hasBudget ? [] : ["No budget signal detected — qualify before scoping"]),
      ...(hasTimeline ? [] : ["No timeline driver detected — ask what makes this 'now'"]),
      "Decision process and stakeholders not described",
      "Current baseline metrics not provided",
    ],
    risks: [
      "Unvalidated expectations — request describes solutions, not problems",
      "Single-contact thread: no second stakeholder identified",
    ],
    timelineClues: hasTimeline ? ["Timeline language detected in the request — confirm the hard date vs preference"] : [],
    budgetClues: hasBudget ? ["Budget language detected — anchor the range on the qualification call"] : [],
    suggestedQuestions: [
      "What happens if this isn't solved in the next two quarters?",
      "Who besides you needs to approve this, and what do they care about?",
      "What would make this project a clear success in 90 days?",
    ],
    confidence: Math.min(74, 35 + Math.round(raw.length / 60)),
  };
}

/** Canned high-quality analysis for the Harbor & Fern demo intake. */
const HARBORFERN_ANALYSIS: IntakeAnalysis = {
  summary:
    "DTC home-goods brand (~€1.1M/yr, 70% Meta-dependent) with CAC nearly doubled since January (€31 → €58). Founder self-diagnoses three fixes — account restructure, ad-matched landing pages, email capture — which are symptoms of one funnel problem. Hard commercial deadline: Q4 must be profitable. Warm referral via existing client.",
  goals: [
    "Bring blended CAC back toward the €35 range before Q4 spend scales",
    "Restructure a 40+ ad-set Meta account into a testable architecture",
    "Stop sending paid traffic to generic collection pages",
    "Build an email capture path to reduce paid dependency",
  ],
  missingInfo: [
    "Monthly ad spend (needed to size the fee model: flat vs % of spend)",
    "Margin structure — is €58 CAC unprofitable or just uncomfortable?",
    "AOV and repeat-purchase rate (LTV context for the CAC ceiling)",
    "Who builds landing pages today — internal, agency, or nobody?",
  ],
  risks: [
    "'A few thousand a month' may anchor below fee + landing page production cost",
    "Previous agency relationship ended badly — expectation scar tissue around 'just raising budgets'",
    "Q4 deadline means visible progress needed within ~8 weeks of start",
    "70% revenue concentration in one paid channel is itself a business risk the client may underweight",
  ],
  timelineClues: ["Q4/Black Friday profitability is the hard driver — work must show effect by October", "Founder traveling Thu–Fri; wants contact this week"],
  budgetClues: ["'A few thousand a month if the numbers make sense' — likely €2.5–4k/mo expectation; fee floor for this scope is €2.8k + landing page project"],
  suggestedQuestions: [
    "What's your current monthly Meta spend, and what blended CAC makes Q4 work at your margins?",
    "When the CAC was €31 in January — what was different? Creative, audiences, or season?",
    "If we proposed a one-time funnel rebuild (account + landing pages) before the monthly programme, does that fit how you'd budget it?",
  ],
  confidence: 81,
};

export const useApp = create<AppState>((set, get) => ({
  workspace: seedWorkspace,
  team: seedTeam,
  leads: seedLeads,
  briefs: seedBriefs,
  scopes: seedScopes,
  pricingModels: seedPricing,
  proposals: seedProposals,
  followUps: seedFollowUps,
  onboardingFlows: seedOnboarding,
  changeOrders: seedChangeOrders,
  templates: seedTemplates,
  services: seedServices,
  activity: seedActivity,
  notifications: seedNotifications,

  analyzingLeadId: null,

  setLeadStage: (id, stage) =>
    set((s) => {
      const lead = s.leads.find((l) => l.id === id);
      return {
        leads: s.leads.map((l) =>
          l.id === id ? { ...l, stage, lastActivityAt: daysFromNow(0, 10) } : l
        ),
        activity: lead
          ? [
              {
                id: `ac-live-${activityCounter++}`,
                at: daysFromNow(0, 10),
                actorId: "tm-maya",
                kind: "stage_change" as const,
                text: `${lead.company} moved to ${stage.replace(/_/g, " ")}`,
                leadId: id,
              },
              ...s.activity,
            ]
          : s.activity,
      };
    }),

  updateLead: (id, patch) =>
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })),

  addLead: (lead) =>
    set((s) => ({
      leads: [lead, ...s.leads],
      activity: [
        {
          id: `ac-live-${activityCounter++}`,
          at: daysFromNow(0, 10),
          actorId: "tm-maya",
          kind: "lead_created" as const,
          text: `New lead created: ${lead.company} (${lead.projectType})`,
          leadId: lead.id,
        },
        ...s.activity,
      ],
    })),

  runIntakeAnalysis: (leadId, rawText) => {
    set({ analyzingLeadId: leadId });
    // Simulated model latency — long enough to show the working state.
    setTimeout(() => {
      const lead = get().leads.find((l) => l.id === leadId);
      const analysis =
        leadId === "ld-harborfern"
          ? HARBORFERN_ANALYSIS
          : genericAnalysis(rawText ?? lead?.rawIntake ?? "");
      set((s) => ({
        analyzingLeadId: null,
        leads: s.leads.map((l) =>
          l.id === leadId
            ? { ...l, intakeAnalysis: analysis, rawIntake: rawText ?? l.rawIntake }
            : l
        ),
        activity: [
          {
            id: `ac-live-${activityCounter++}`,
            at: daysFromNow(0, 10),
            actorId: "tm-maya",
            kind: "intake_analyzed" as const,
            text: `${lead?.company ?? "Lead"} intake analyzed — ${analysis.confidence}% confidence, ${analysis.suggestedQuestions.length} clarifying questions suggested`,
            leadId,
          },
          ...s.activity,
        ],
      }));
    }, 1900);
  },

  updateBrief: (id, patch) =>
    set((s) => ({
      briefs: s.briefs.map((b) =>
        b.id === id ? { ...b, ...patch, updatedAt: daysFromNow(0, 10) } : b
      ),
    })),

  answerBriefQuestion: (briefId, questionId, answer) =>
    set((s) => ({
      briefs: s.briefs.map((b) =>
        b.id === briefId
          ? {
              ...b,
              openQuestions: b.openQuestions.map((q) =>
                q.id === questionId ? { ...q, answered: true, answer } : q
              ),
              updatedAt: daysFromNow(0, 10),
            }
          : b
      ),
    })),

  updateScope: (id, patch) =>
    set((s) => ({
      scopes: s.scopes.map((sc) =>
        sc.id === id ? { ...sc, ...patch, updatedAt: daysFromNow(0, 10) } : sc
      ),
    })),

  updateProposal: (id, patch) =>
    set((s) => ({
      proposals: s.proposals.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: daysFromNow(0, 10) } : p
      ),
    })),

  setProposalStatus: (id, status) =>
    set((s) => {
      const p = s.proposals.find((x) => x.id === id);
      const stamps: Partial<Proposal> =
        status === "sent"
          ? { sentAt: daysFromNow(0, 10) }
          : status === "accepted" || status === "declined"
            ? { decidedAt: daysFromNow(0, 10) }
            : {};
      return {
        proposals: s.proposals.map((x) =>
          x.id === id ? { ...x, status, ...stamps, updatedAt: daysFromNow(0, 10) } : x
        ),
        activity: p
          ? [
              {
                id: `ac-live-${activityCounter++}`,
                at: daysFromNow(0, 10),
                actorId: "tm-maya",
                kind: (status === "sent"
                  ? "proposal_sent"
                  : status === "accepted"
                    ? "proposal_accepted"
                    : "comment") as ActivityEvent["kind"],
                text: `Proposal "${p.title}" marked ${status}`,
                leadId: p.leadId,
              },
              ...s.activity,
            ]
          : s.activity,
      };
    }),

  moveProposalSection: (id, sectionId, dir) =>
    set((s) => ({
      proposals: s.proposals.map((p) => {
        if (p.id !== id) return p;
        const idx = p.sections.findIndex((sec) => sec.id === sectionId);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= p.sections.length) return p;
        const sections = [...p.sections];
        [sections[idx], sections[target]] = [sections[target], sections[idx]];
        return { ...p, sections, updatedAt: daysFromNow(0, 10) };
      }),
    })),

  toggleProposalSection: (id, sectionId) =>
    set((s) => ({
      proposals: s.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              sections: p.sections.map((sec) =>
                sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec
              ),
            }
          : p
      ),
    })),

  setFollowUpStatus: (id, status) =>
    set((s) => ({
      followUps: s.followUps.map((f) => (f.id === id ? { ...f, status } : f)),
    })),

  toggleOnboardingTask: (flowId, taskId) =>
    set((s) => ({
      onboardingFlows: s.onboardingFlows.map((f) =>
        f.id === flowId
          ? {
              ...f,
              tasks: f.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            }
          : f
      ),
    })),

  setChangeOrderStatus: (id, status) =>
    set((s) => ({
      changeOrders: s.changeOrders.map((c) => (c.id === id ? { ...c, status } : c)),
    })),

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  logActivity: (kind, text, leadId) =>
    set((s) => ({
      activity: [
        {
          id: `ac-live-${activityCounter++}`,
          at: daysFromNow(0, 10),
          actorId: "tm-maya",
          kind,
          text,
          leadId,
        },
        ...s.activity,
      ],
    })),
}));
