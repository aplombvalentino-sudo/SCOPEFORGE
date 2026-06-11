/* Shared lead-module constants and helpers (no JSX). */

import { STAGE_ORDER, type LeadSource, type RiskLevel, type Stage } from "@/lib/types";

export const SOURCE_LABELS: Record<LeadSource, string> = {
  email: "Email",
  website_form: "Website form",
  referral: "Referral",
  call_notes: "Call notes",
  loom: "Loom",
  meeting_transcript: "Meeting transcript",
  pdf_brief: "PDF brief",
};

/** Stage progression without the terminal "lost" branch. */
export const STAGE_PROGRESS: Stage[] = STAGE_ORDER.filter((s) => s !== "lost");

export const riskDotClass: Record<RiskLevel, string> = {
  low: "bg-ok",
  medium: "bg-warn",
  high: "bg-danger",
};

/** Stable-ish readable id for leads created at runtime. */
export function newLeadId(company: string): string {
  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 14);
  return `ld-${slug || "lead"}-${Date.now().toString(36)}`;
}

/** Pull "From: Name <email>" out of pasted source material when present. */
export function extractContact(raw: string): { name: string; email: string } | null {
  const m = raw.match(/From:\s*([^<\n]+?)\s*<([^>\s]+@[^>\s]+)>/i);
  if (!m) return null;
  return { name: m[1].trim(), email: m[2].trim() };
}
