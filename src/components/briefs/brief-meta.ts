/* ================================================================
   Brief module metadata — status labels/tones, health scoring,
   and the canned clarifying-question generator used by the
   "Suggest clarifying questions" action.
   ================================================================ */

import type { Brief, ScopeStatus } from "@/lib/types";
import type { Tone } from "@/components/ui/primitives";

export const BRIEF_STATUS_LABELS: Record<Brief["status"], string> = {
  draft: "Draft",
  needs_clarification: "Needs clarification",
  confirmed: "Confirmed",
};

export const BRIEF_STATUS_TONE: Record<Brief["status"], Tone> = {
  draft: "neutral",
  needs_clarification: "warn",
  confirmed: "ok",
};

export const SCOPE_STATUS_LABELS: Record<ScopeStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
};

export const SCOPE_STATUS_TONE: Record<ScopeStatus, Tone> = {
  draft: "neutral",
  in_review: "info",
  approved: "ok",
};

export const INFLUENCE_TONE: Record<Brief["stakeholders"][number]["influence"], Tone> = {
  decision: "accent",
  input: "info",
  informed: "neutral",
};

export function unansweredCount(brief: Brief): number {
  return brief.openQuestions.filter((q) => !q.answered).length;
}

export interface BriefHealth {
  filled: number;
  total: number;
  pct: number;
  unanswered: number;
  tone: "ok" | "warn" | "accent";
}

/** Nine scopable sections; a brief is "healthy" when all are filled and no question blocks. */
export function briefHealth(brief: Brief): BriefHealth {
  const sections: boolean[] = [
    brief.clientContext.trim().length > 0,
    brief.projectGoal.trim().length > 0,
    brief.deliverablesSummary.trim().length > 0,
    brief.budgetNote.trim().length > 0,
    brief.timelineNote.trim().length > 0,
    brief.successMetrics.length > 0,
    brief.constraints.length > 0,
    brief.dependencies.length > 0,
    brief.stakeholders.length > 0,
  ];
  const filled = sections.filter(Boolean).length;
  const total = sections.length;
  const pct = Math.round((filled / total) * 100);
  const unanswered = unansweredCount(brief);
  return {
    filled,
    total,
    pct,
    unanswered,
    tone: unanswered > 0 ? "warn" : pct === 100 ? "ok" : "accent",
  };
}

/* ---------- clarifying-question suggestions ----------
   Domain-specific pairs for the seeded briefs; anything else gets
   questions derived from its constraints and stakeholder map. */

const CANNED: Record<string, string[]> = {
  "br-vey": [
    "If Studio Hervé's identity assets slip past week 2, does the 24 Jun art-direction review with Hélène move — or do we hold the date and de-scope the lookbook module first?",
    "Who owns the 301 redirect map for the top-200 WooCommerce URLs — Théo, or does that need a separate SEO contact on the client side?",
  ],
  "br-northgate": [
    "When the CMS vendor's 2-week change window collides with a critical technical fix, can Daniel escalate — or do we batch fixes and accept the ranking lag?",
    "Does Dr. Singh's clinical review cover the 12 location-page rebuilds as well as the monthly content pieces, and what turnaround can she commit to?",
  ],
  "br-aurelia": [
    "If the interior design concept landing mid-July contradicts the approved identity direction, is the rework a paid change order — and who makes that call?",
    "Does the signage vendor's November fabrication deadline require final trilingual (PT/EN/FR) artwork, or can language variants follow the master files later?",
  ],
  "br-calder": [
    "Can the partners' committee delegate page-level and template approvals to Susan between fortnightly meetings, reserving the committee for identity gates only?",
    "Which legacy domain becomes the canonical redirect target, and who holds DNS access for the week-9 cutover?",
  ],
  "br-stratus": [
    "Should the parallel-run week cover all 11 engineers at once, or start with a pilot crew of 3 before full dispatch cutover?",
    "If Moneybird API rate limits delay invoice triggers at end of day, is next-morning batching acceptable to the accountant?",
  ],
};

function derivedQuestions(brief: Brief): string[] {
  const out: string[] = [];
  const constraint = brief.constraints[0];
  if (constraint) {
    out.push(
      `Regarding "${constraint}" — what is the agreed fallback if this slips, and who signs off on invoking it?`
    );
  }
  const decider = brief.stakeholders.find((s) => s.influence === "decision");
  if (decider) {
    out.push(
      `Does ${decider.name} review interim work or only final deliverables — and at what cadence can we book them?`
    );
  }
  if (out.length < 2) {
    out.push(
      "What single outcome would make this project an unambiguous success in the first 90 days?",
      "Who besides the day-to-day contact must approve before work can be invoiced?"
    );
  }
  return out;
}

/** Up to two new questions not already on the brief. */
export function suggestClarifyingQuestions(brief: Brief): string[] {
  const existing = new Set(brief.openQuestions.map((q) => q.question));
  const pool = [...(CANNED[brief.id] ?? []), ...derivedQuestions(brief)];
  return pool.filter((q) => !existing.has(q)).slice(0, 2);
}
