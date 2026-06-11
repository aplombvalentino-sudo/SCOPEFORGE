"use client";

/* Pipeline by stage — segmented value bar + per-stage legend, computed from open leads. */

import { motion, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/store";
import { cx, money, moneyCompact } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { STAGE_LABELS, STAGE_ORDER, type Stage } from "@/lib/types";
import { DashPanel } from "./panel";

/** Stage → token color. Cool tones early, accent mid-pipe, warm when money is on the table. */
const SEGMENT_CLASS: Partial<Record<Stage, string>> = {
  intake: "bg-info/45",
  brief: "bg-info/80",
  scoping: "bg-accent/50",
  proposal_draft: "bg-accent/80",
  proposal_sent: "bg-warn/55",
  negotiation: "bg-warn/85",
};

export function PipelineStageBar({ className }: { className?: string }) {
  const leads = useApp((s) => s.leads);
  const reduced = useReducedMotion();

  const open = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const total = open.reduce((sum, l) => sum + l.value, 0) || 1;

  const stages = STAGE_ORDER.filter((st) => st !== "won" && st !== "lost")
    .map((stage) => {
      const inStage = open.filter((l) => l.stage === stage);
      return {
        stage,
        count: inStage.length,
        value: inStage.reduce((sum, l) => sum + l.value, 0),
      };
    })
    .filter((s) => s.count > 0);

  return (
    <DashPanel
      title="Pipeline by stage"
      caption={`${money(total)} across ${open.length} open leads`}
      className={cx("h-full", className)}
    >
      <div
        className="flex h-3 w-full gap-px overflow-hidden rounded-full bg-inset"
        role="img"
        aria-label="Pipeline value split by stage"
      >
        {stages.map((s, i) => (
          <motion.div
            key={s.stage}
            className={cx("h-full", SEGMENT_CLASS[s.stage])}
            initial={reduced ? false : { width: 0 }}
            animate={{ width: `${(s.value / total) * 100}%` }}
            transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
          />
        ))}
      </div>
      <ul className="mt-3.5 space-y-0.5">
        {stages.map((s) => (
          <li
            key={s.stage}
            className="flex items-center gap-2.5 rounded-sm px-1.5 py-1 transition-colors duration-150 hover:bg-overlay/60"
          >
            <span
              aria-hidden
              className={cx("h-2 w-2 shrink-0 rounded-[2px]", SEGMENT_CLASS[s.stage])}
            />
            <span className="flex-1 truncate text-[12.5px] text-ink-mute">
              {STAGE_LABELS[s.stage]}
            </span>
            <span className="tnum font-mono text-[11px] text-ink-faint">
              {s.count} {s.count === 1 ? "lead" : "leads"}
            </span>
            <span className="tnum w-16 shrink-0 text-right font-mono text-[12px] text-ink">
              {moneyCompact(s.value)}
            </span>
          </li>
        ))}
      </ul>
    </DashPanel>
  );
}
