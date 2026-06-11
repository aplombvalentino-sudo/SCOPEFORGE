"use client";

/* ================================================================
   Right-rail cards for the brief builder: linked records
   (lead workspace + scope doc) and brief health (RingGauge).
   ================================================================ */

import Link from "next/link";
import type { ReactNode } from "react";
import type { Brief, Lead, ScopeDoc } from "@/lib/types";
import { cx, moneyCompact } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/icons";
import { Badge, StagePill } from "@/components/ui/primitives";
import { RingGauge } from "@/components/ui/charts";
import {
  BRIEF_STATUS_LABELS,
  BRIEF_STATUS_TONE,
  briefHealth,
  SCOPE_STATUS_LABELS,
  SCOPE_STATUS_TONE,
} from "./brief-meta";

function RecordRow({
  href,
  icon,
  title,
  meta,
  right,
}: {
  href: string;
  icon: IconName;
  title: string;
  meta: string;
  right: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors duration-150 hover:bg-overlay"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-line bg-inset text-ink-faint transition-colors duration-150 group-hover:text-accent">
        <Icon name={icon} size={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-ink">{title}</span>
        <span className="tnum block truncate font-mono text-[11px] text-ink-faint">
          {meta}
        </span>
      </span>
      {right}
      <Icon
        name="arrow-up-right"
        size={12}
        className="shrink-0 text-ink-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      />
    </Link>
  );
}

export function LinkedRecordsCard({ lead, scope }: { lead: Lead; scope?: ScopeDoc }) {
  return (
    <div className="panel px-4 py-3.5">
      <p className="microlabel">Linked records</p>
      <div className="mt-2 -mx-2 space-y-0.5">
        <RecordRow
          href={`/leads/${lead.id}`}
          icon="leads"
          title={lead.company}
          meta={`${moneyCompact(lead.value)} · ${lead.contact.name}`}
          right={<StagePill stage={lead.stage} />}
        />
        {scope ? (
          <RecordRow
            href={`/scopes/${scope.id}`}
            icon="scope"
            title="Scope document"
            meta={`${scope.deliverables.length} deliverables · ${scope.timelineWeeks} wks`}
            right={
              <Badge tone={SCOPE_STATUS_TONE[scope.status]}>
                {SCOPE_STATUS_LABELS[scope.status]}
              </Badge>
            }
          />
        ) : (
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-dashed border-line bg-inset/40 text-ink-faint">
              <Icon name="scope" size={14} />
            </span>
            <p className="text-[12px] leading-snug text-ink-faint">
              No scope yet — confirm this brief to start scoping.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function BriefHealthCard({ brief }: { brief: Brief }) {
  const h = briefHealth(brief);
  return (
    <div className="panel px-4 py-3.5">
      <p className="microlabel">Brief health</p>
      <div className="mt-3 flex items-center gap-4">
        <RingGauge value={h.pct} size={76} tone={h.tone} label="filled" />
        <div className="flex-1 space-y-2 text-[12px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-mute">Sections filled</span>
            <span className="tnum font-mono text-ink">
              {h.filled}/{h.total}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-mute">Unanswered</span>
            <span
              className={cx(
                "tnum font-mono",
                h.unanswered > 0 ? "text-warn" : "text-ok"
              )}
            >
              {h.unanswered}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-mute">Status</span>
            <Badge tone={BRIEF_STATUS_TONE[brief.status]}>
              {BRIEF_STATUS_LABELS[brief.status]}
            </Badge>
          </div>
        </div>
      </div>
      {h.unanswered > 0 && (
        <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] leading-snug text-ink-faint">
          Confirmation is blocked until every open question has a recorded answer.
        </p>
      )}
    </div>
  );
}
