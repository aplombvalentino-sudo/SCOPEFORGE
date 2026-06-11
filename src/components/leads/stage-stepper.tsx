"use client";

/* Horizontal stage progression. Only the immediate next stage is clickable. */

import { cx } from "@/lib/format";
import { useApp } from "@/lib/store";
import { STAGE_LABELS, type Lead } from "@/lib/types";
import { useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";
import { STAGE_PROGRESS } from "./lead-shared";

export function StageStepper({ lead }: { lead: Lead }) {
  const toast = useToast();
  const setLeadStage = useApp((s) => s.setLeadStage);

  const isLost = lead.stage === "lost";
  const currentIdx = STAGE_PROGRESS.indexOf(lead.stage); // -1 when lost
  const nextStage =
    !isLost && currentIdx < STAGE_PROGRESS.length - 1 ? STAGE_PROGRESS[currentIdx + 1] : null;

  function advance() {
    if (!nextStage) return;
    setLeadStage(lead.id, nextStage);
    toast.success(
      `${lead.company} advanced to ${STAGE_LABELS[nextStage]}`,
      nextStage === "won" ? "Time to start onboarding — momentum dies in the handoff." : undefined
    );
  }

  function markLost() {
    setLeadStage(lead.id, "lost");
    toast.info(
      `${lead.company} marked lost`,
      "Kept in pipeline history — schedule a re-engagement check-in if the door was left open."
    );
  }

  function reopen() {
    setLeadStage(lead.id, "intake");
    toast.success(`${lead.company} reopened at Intake`, "Re-qualify before re-scoping — things change.");
  }

  return (
    <div className="panel mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
      <ol className={cx("flex min-w-0 flex-1 items-center", isLost && "opacity-50")}>
        {STAGE_PROGRESS.map((stage, i) => {
          const done = !isLost && i < currentIdx;
          const current = !isLost && i === currentIdx;
          const isNext = stage === nextStage;
          return (
            <li key={stage} className={cx("flex items-center", i > 0 && "min-w-0 flex-1")}>
              {i > 0 && (
                <span
                  aria-hidden
                  className={cx("mx-1.5 h-px min-w-3 flex-1", done || current ? "bg-accent/60" : "bg-line")}
                />
              )}
              <button
                onClick={isNext ? advance : undefined}
                disabled={!isNext}
                title={
                  isNext
                    ? `Advance to ${STAGE_LABELS[stage]}`
                    : current
                      ? "Current stage"
                      : undefined
                }
                className={cx(
                  "group flex shrink-0 items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors duration-150",
                  isNext && "cursor-pointer hover:bg-accent-soft/50",
                  !isNext && "cursor-default"
                )}
              >
                <span
                  className={cx(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
                    done && "border-accent bg-accent text-on-accent",
                    current && "border-accent bg-accent-soft text-accent ring-2 ring-accent/25",
                    !done && !current && "border-line bg-inset text-ink-faint",
                    isNext && "group-hover:border-accent-line"
                  )}
                >
                  {done ? (
                    <Icon name="check" size={10} strokeWidth={2.6} />
                  ) : (
                    <span
                      className={cx(
                        "h-1.5 w-1.5 rounded-full",
                        current ? "bg-accent" : "bg-ink-faint/50"
                      )}
                    />
                  )}
                </span>
                <span
                  className={cx(
                    "hidden font-mono text-[10px] tracking-[0.07em] uppercase lg:inline",
                    done && "text-ink-mute",
                    current && "font-semibold text-accent",
                    !done && !current && "text-ink-faint",
                    isNext && "group-hover:text-ink"
                  )}
                >
                  {STAGE_LABELS[stage]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex shrink-0 items-center gap-1.5">
        {isLost ? (
          <>
            <span className="microlabel !text-danger">marked lost</span>
            <Button variant="ghost" size="sm" onClick={reopen}>
              Reopen at Intake
            </Button>
          </>
        ) : lead.stage === "won" ? (
          <span className="microlabel !text-ok">deal won</span>
        ) : (
          <Button variant="ghost" size="sm" onClick={markLost} className="hover:!text-danger">
            Mark lost
          </Button>
        )}
      </div>
    </div>
  );
}
