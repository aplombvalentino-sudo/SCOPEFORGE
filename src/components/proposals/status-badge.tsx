"use client";

/* Proposal status badge + validity chip — shared by list, studio, and preview. */

import { Icon } from "@/components/ui/icons";
import { Badge, type Tone } from "@/components/ui/primitives";
import { DEMO_NOW, cx, dueIn } from "@/lib/format";
import { PROPOSAL_STATUS_LABELS, type ProposalStatus } from "@/lib/types";

const STATUS_TONES: Record<ProposalStatus, Tone> = {
  draft: "neutral",
  internal_review: "info",
  sent: "warn",
  viewed: "warn",
  accepted: "ok",
  declined: "danger",
  expired: "neutral",
};

export function ProposalStatusBadge({
  status,
  views,
  className,
}: {
  status: ProposalStatus;
  /** shown only for "viewed" — the client-side tracking count */
  views?: number;
  className?: string;
}) {
  return (
    <Badge tone={STATUS_TONES[status]} className={className}>
      {status === "viewed" && <Icon name="eye" size={11} />}
      {PROPOSAL_STATUS_LABELS[status]}
      {status === "viewed" && views !== undefined && (
        <span className="tnum">×{views}</span>
      )}
    </Badge>
  );
}

/** Validity countdown chip — warn under 7 days, danger once expired. */
export function ValidUntilChip({ iso, className }: { iso: string; className?: string }) {
  const d = dueIn(iso);
  const daysLeft = Math.round(
    (new Date(iso).getTime() - DEMO_NOW.getTime()) / 86400000
  );
  const tone: Tone = d.overdue ? "danger" : daysLeft < 7 ? "warn" : "neutral";
  const label = d.overdue
    ? d.label.replace("overdue", "expired")
    : d.label.replace("due in", "expires in");
  return (
    <Badge tone={tone} className={cx("tnum", className)}>
      {label}
    </Badge>
  );
}
