"use client";

/* /follow-ups — the nudge queue. The engine drafts the message and the
   reason; the user approves the send. */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FollowUpCard,
  FollowUpHistoryRow,
} from "@/components/proposals/follow-up-card";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { KpiCard } from "@/components/ui/kpi";
import { PageHeader, PageTransition, Section } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitives";
import { DEMO_NOW, cx } from "@/lib/format";
import { collapseVariants, itemVariants, listVariants } from "@/lib/motion";
import { useApp } from "@/lib/store";
import type { FollowUp } from "@/lib/types";

function byDueAt(a: FollowUp, b: FollowUp): number {
  return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
}

export default function FollowUpsPage() {
  const followUps = useApp((s) => s.followUps);
  const leads = useApp((s) => s.leads);
  const [historyOpen, setHistoryOpen] = useState(false);

  const leadById = useMemo(
    () => Object.fromEntries(leads.map((l) => [l.id, l])),
    [leads]
  );

  const now = DEMO_NOW.getTime();
  // overdue-but-still-scheduled items surface in the Due now queue
  const dueNow = followUps
    .filter(
      (f) =>
        f.status === "due" ||
        (f.status === "scheduled" && new Date(f.dueAt).getTime() < now)
    )
    .sort(byDueAt);
  const scheduled = followUps
    .filter(
      (f) => f.status === "scheduled" && new Date(f.dueAt).getTime() >= now
    )
    .sort(byDueAt);
  const history = followUps.filter(
    (f) => f.status === "done" || f.status === "skipped"
  );
  const doneCount = followUps.filter((f) => f.status === "done").length;

  return (
    <PageTransition>
      <PageHeader
        overline="PIPELINE / FOLLOW-UPS"
        title="Follow-ups"
        description="Sent proposals arm a sequence automatically. The engine drafts the message and the reason it's worth sending — you approve the touch."
      />

      {/* KPI band */}
      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="mb-6 grid gap-3 md:grid-cols-3"
      >
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Due now"
            value={dueNow.length}
            icon="zap"
            delta={
              dueNow.length > 0
                ? `oldest: ${leadById[dueNow[0].leadId]?.company ?? "unknown"}`
                : "queue is clear"
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Scheduled"
            value={scheduled.length}
            icon="calendar"
            delta={
              scheduled.length > 0
                ? `next: ${leadById[scheduled[0].leadId]?.company ?? "unknown"}`
                : "nothing queued ahead"
            }
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Completed this week"
            value={doneCount}
            icon="check"
            delta="marked sent from this queue"
          />
        </motion.div>
      </motion.div>

      {/* Due now */}
      <Section
        title="Due now"
        description="Overdue and due-today touches, oldest first."
        actions={
          <Badge tone={dueNow.length > 0 ? "warn" : "neutral"} className="tnum">
            {dueNow.length}
          </Badge>
        }
      >
        {dueNow.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon="follow-up"
              title="Queue clear."
              body="Sent proposals arm follow-ups automatically — the next nudge lands here with a reason and a ready draft."
            />
          </div>
        ) : (
          <motion.div
            variants={listVariants}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <AnimatePresence initial={false}>
              {dueNow.map((f) => (
                <FollowUpCard
                  key={f.id}
                  followUp={f}
                  lead={leadById[f.leadId]}
                  urgency="due"
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </Section>

      {/* Scheduled */}
      <Section
        title="Scheduled"
        description="Armed and waiting — each fires into the due queue on its date."
        actions={
          <Badge tone="neutral" className="tnum">
            {scheduled.length}
          </Badge>
        }
      >
        {scheduled.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon="calendar"
              title="Nothing scheduled"
              body="Future touches appear here — sending a proposal or marking a nudge sent queues the next one."
            />
          </div>
        ) : (
          <motion.div
            variants={listVariants}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <AnimatePresence initial={false}>
              {scheduled.map((f) => (
                <FollowUpCard
                  key={f.id}
                  followUp={f}
                  lead={leadById[f.leadId]}
                  urgency="scheduled"
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </Section>

      {/* Done / Skipped accordion */}
      <Section>
        <div className="panel overflow-hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors duration-100 hover:bg-overlay/60"
          >
            <Icon
              name="chevron-right"
              size={13}
              className={cx(
                "text-ink-faint transition-transform duration-200",
                historyOpen && "rotate-90"
              )}
            />
            <span className="font-display text-[13.5px] font-medium tracking-tight text-ink">
              Done &amp; skipped
            </span>
            <Badge tone="neutral" className="tnum">
              {history.length}
            </Badge>
            <span className="flex-1" />
            <span className="microlabel">history</span>
          </button>
          <AnimatePresence initial={false}>
            {historyOpen && (
              <motion.div
                variants={collapseVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="overflow-hidden"
              >
                {history.length === 0 ? (
                  <p className="border-t border-line px-4 py-3.5 text-[12.5px] text-ink-faint">
                    Nothing here yet — items land in history when you mark them sent or
                    skip them.
                  </p>
                ) : (
                  <div className="divide-y divide-line border-t border-line">
                    {history.map((f) => (
                      <FollowUpHistoryRow
                        key={f.id}
                        followUp={f}
                        lead={leadById[f.leadId]}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Section>
    </PageTransition>
  );
}
