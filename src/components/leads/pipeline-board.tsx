"use client";

/* Kanban pipeline — one column per stage, framer layout animation on moves. */

import { LayoutGroup, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { teamById } from "@/lib/demo-data";
import { cx, moneyCompact } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { STAGE_LABELS, STAGE_ORDER, type Lead, type Stage } from "@/lib/types";
import { useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Menu } from "@/components/ui/overlays";
import { Avatar } from "@/components/ui/primitives";
import { riskDotClass, STAGE_PROGRESS } from "./lead-shared";

function PipelineCard({ lead, muted }: { lead: Lead; muted: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const setLeadStage = useApp((s) => s.setLeadStage);
  const owner = teamById[lead.ownerId];

  const progressIdx = STAGE_PROGRESS.indexOf(lead.stage);
  const nextStage: Stage | null =
    progressIdx >= 0 && progressIdx < STAGE_PROGRESS.length - 1
      ? STAGE_PROGRESS[progressIdx + 1]
      : null;
  const prevStage: Stage | null = progressIdx > 0 ? STAGE_PROGRESS[progressIdx - 1] : null;

  function move(stage: Stage | null) {
    if (!stage) return;
    setLeadStage(lead.id, stage);
    toast.success(`${lead.company} moved to ${STAGE_LABELS[stage]}`);
  }

  return (
    <motion.div
      layoutId={`pipe-card-${lead.id}`}
      layout
      transition={{ duration: DUR.slow, ease: EASE }}
      onClick={() => router.push(`/leads/${lead.id}`)}
      className={cx(
        "group cursor-pointer rounded-md border border-line bg-raised px-3 py-2.5 shadow-e1 transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-e2",
        muted && "opacity-60 hover:opacity-90"
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <p className="min-w-0 truncate text-[13px] font-medium text-ink">{lead.company}</p>
        <div onClick={(e) => e.stopPropagation()} className="-mt-0.5 -mr-1 shrink-0">
          <Menu
            trigger={
              <button
                aria-label={`Actions for ${lead.company}`}
                className="flex h-6 w-6 items-center justify-center rounded-sm text-ink-faint opacity-0 transition-[opacity,background-color,color] duration-150 group-hover:opacity-100 hover:bg-overlay hover:text-ink focus-visible:opacity-100"
              >
                <Icon name="more" size={13} />
              </button>
            }
            items={[
              {
                label: nextStage ? `Move to ${STAGE_LABELS[nextStage]}` : "Move to next stage",
                onSelect: () => move(nextStage),
                disabled: !nextStage,
              },
              {
                label: prevStage ? `Back to ${STAGE_LABELS[prevStage]}` : "Move to previous stage",
                onSelect: () => move(prevStage),
                disabled: !prevStage,
              },
              { label: "Open workspace", onSelect: () => router.push(`/leads/${lead.id}`) },
            ]}
          />
        </div>
      </div>
      <p className="mt-0.5 truncate text-[12px] text-ink-mute">{lead.projectType}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="tnum font-mono text-[12px] text-ink">
          {lead.value > 0 ? moneyCompact(lead.value) : "—"}
        </span>
        <span
          title={`${lead.risk} risk`}
          className={cx("inline-block h-1.5 w-1.5 rounded-full", riskDotClass[lead.risk])}
        />
        {owner && (
          <Avatar
            initials={owner.initials}
            size={18}
            title={`${owner.name} — ${owner.role}`}
            className="ml-auto"
          />
        )}
      </div>
    </motion.div>
  );
}

export function PipelineBoard({ leads }: { leads: Lead[] }) {
  return (
    <LayoutGroup>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-4">
        {STAGE_ORDER.map((stage) => {
          const inStage = leads.filter((l) => l.stage === stage);
          const total = inStage.reduce((sum, l) => sum + l.value, 0);
          const lost = stage === "lost";
          return (
            <section
              key={stage}
              aria-label={`${STAGE_LABELS[stage]} column`}
              className={cx(
                "flex w-[252px] shrink-0 flex-col rounded-lg border border-line bg-surface",
                lost && "border-dashed bg-transparent"
              )}
            >
              <header className="flex items-baseline gap-2 border-b border-line px-3 py-2.5">
                <h3
                  className={cx(
                    "microlabel !tracking-[0.07em]",
                    !lost && stage !== "won" && "!text-ink-mute",
                    stage === "won" && "!text-ok"
                  )}
                >
                  {STAGE_LABELS[stage]}
                </h3>
                <span className="tnum font-mono text-[11px] text-ink-faint">{inStage.length}</span>
                <span className="tnum ml-auto font-mono text-[11px] text-ink-faint">
                  {total > 0 ? moneyCompact(total) : "·"}
                </span>
              </header>
              <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                {inStage.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-line py-5">
                    <span className="microlabel">empty</span>
                  </div>
                ) : (
                  inStage.map((lead) => <PipelineCard key={lead.id} lead={lead} muted={lost} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
