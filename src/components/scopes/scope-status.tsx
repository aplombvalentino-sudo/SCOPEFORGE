"use client";

/* Scope status vocabulary — shared by the list table and the builder header. */

import { Badge, type Tone } from "@/components/ui/primitives";
import type { ScopeStatus } from "@/lib/types";

export const SCOPE_STATUS_LABELS: Record<ScopeStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
};

export const SCOPE_STATUS_TONES: Record<ScopeStatus, Tone> = {
  draft: "neutral",
  in_review: "info",
  approved: "ok",
};

export function ScopeStatusBadge({
  status,
  className,
}: {
  status: ScopeStatus;
  className?: string;
}) {
  return (
    <Badge tone={SCOPE_STATUS_TONES[status]} className={className}>
      {SCOPE_STATUS_LABELS[status]}
    </Badge>
  );
}
