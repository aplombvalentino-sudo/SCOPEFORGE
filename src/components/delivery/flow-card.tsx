"use client";

/* Onboarding flow card for /onboarding — progress, next undone task,
   archived treatment once every task is closed. */

import Link from "next/link";
import { motion } from "framer-motion";
import { cx, dueIn, fullDate } from "@/lib/format";
import { itemVariants } from "@/lib/motion";
import type { OnboardingFlow } from "@/lib/types";
import { Icon } from "@/components/ui/icons";
import { Badge, Progress } from "@/components/ui/primitives";

function nextTaskDueIso(flow: OnboardingFlow, days: number): string {
  const d = new Date(flow.kickoffDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function FlowCard({ flow }: { flow: OnboardingFlow }) {
  const total = flow.tasks.length;
  const done = flow.tasks.filter((t) => t.done).length;
  const complete = total > 0 && done === total;
  const pctDone = total === 0 ? 0 : (done / total) * 100;
  const next = flow.tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.dueInDays - b.dueInDays)[0];
  const clientOpen = flow.tasks.filter((t) => t.group === "client" && !t.done).length;
  const nextDue = next ? dueIn(nextTaskDueIso(flow, next.dueInDays)) : undefined;

  return (
    <motion.article variants={itemVariants} className="h-full">
      <Link
        href={`/onboarding/${flow.id}`}
        className={cx(
          "group panel flex h-full flex-col px-4 py-3.5 transition-[border-color,box-shadow,opacity] duration-200 hover:border-line-strong hover:shadow-e1",
          complete && "opacity-70 hover:opacity-100"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[15px] font-medium tracking-tight text-ink">
              {flow.clientName}
            </h3>
            <p className="mt-0.5 truncate text-[12.5px] text-ink-mute">{flow.projectName}</p>
          </div>
          {complete ? (
            <Badge tone="ok">Delivered</Badge>
          ) : clientOpen > 0 ? (
            <Badge tone="warn">{clientOpen} client-owed</Badge>
          ) : (
            <Badge tone="accent">On track</Badge>
          )}
        </div>

        <p className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
          <Icon name="calendar" size={11} />
          Kickoff {fullDate(flow.kickoffDate)}
        </p>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="microlabel">Progress</span>
            <span className="tnum font-mono text-[11px] text-ink-mute">
              {done}/{total} tasks
            </span>
          </div>
          <Progress value={pctDone} tone={complete ? "ok" : "accent"} />
        </div>

        <div className="mt-3 flex-1">
          {complete ? (
            <p className="flex items-start gap-1.5 text-[12px] leading-snug text-ink-faint">
              <Icon name="archive" size={12} className="mt-0.5 shrink-0" />
              All {total} tasks closed — flow retained for reference.
            </p>
          ) : next ? (
            <div className="well px-3 py-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="microlabel">Next up</span>
                {nextDue && (
                  <span
                    className={cx(
                      "tnum font-mono text-[10px]",
                      nextDue.overdue ? "text-danger" : "text-ink-faint"
                    )}
                  >
                    {nextDue.label}
                  </span>
                )}
              </div>
              <p className="text-[12.5px] leading-snug text-ink">{next.title}</p>
            </div>
          ) : null}
        </div>

        <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent">
          Open flow
          <Icon
            name="arrow-right"
            size={13}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </span>
      </Link>
    </motion.article>
  );
}
