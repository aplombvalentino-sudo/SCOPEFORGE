/* Shared proposal-module metadata: section-kind labels + document numbering. */

import type { ProposalSectionKind, ProposalStatus } from "@/lib/types";

export const SECTION_KIND_LABELS: Record<ProposalSectionKind, string> = {
  executive_summary: "Exec summary",
  scope_of_work: "Scope of work",
  deliverables: "Deliverables",
  exclusions: "Exclusions",
  timeline: "Timeline",
  pricing: "Pricing",
  terms: "Terms",
  revision_policy: "Revision policy",
  next_steps: "Next steps",
};

/** "pp-northgate" → "SF-2026-NORTHGATE" — the document number printed on the client render. */
export function proposalNumber(id: string): string {
  return `SF-2026-${id.replace(/^pp-/, "").toUpperCase()}`;
}

/** Statuses where the client has not yet decided — validity chips apply to these. */
export const OPEN_STATUSES: ProposalStatus[] = [
  "draft",
  "internal_review",
  "sent",
  "viewed",
];

export function isOpenStatus(status: ProposalStatus): boolean {
  return OPEN_STATUSES.includes(status);
}
