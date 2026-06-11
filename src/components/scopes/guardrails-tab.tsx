"use client";

/* ================================================================
   Guardrails tab — the anti-scope-creep core. Exclusions,
   assumptions, acceptance criteria, the revision line, and
   client-owed dependencies. This is where margin lives.
   ================================================================ */

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { analytics } from "@/lib/demo-data";
import { cx, money } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import type { ScopeDoc } from "@/lib/types";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";
import { ListEditor } from "./list-editor";

function clip(v: string, max = 64): string {
  return v.length > max ? `${v.slice(0, max - 1)}…` : v;
}

export function GuardrailsTab({ scope }: { scope: ScopeDoc }) {
  const updateScope = useApp((s) => s.updateScope);
  const toast = useToast();

  const patch = (p: Partial<ScopeDoc>) => updateScope(scope.id, p);

  /* ---------- exclusions ---------- */
  const addExclusion = (v: string) => {
    patch({ exclusions: [...scope.exclusions, v] });
    toast.success(
      "Exclusion locked",
      `"${clip(v)}" is now explicitly out of scope — if it comes up, it's a change order.`
    );
  };
  const removeExclusion = (i: number) => {
    const next = [...scope.exclusions];
    const removed = next.splice(i, 1)[0];
    patch({ exclusions: next });
    toast.info(
      "Exclusion removed",
      `"${clip(removed)}" is no longer excluded. Anything un-excluded is arguable — re-add it if the client hasn't paid for it.`
    );
  };

  /* ---------- assumptions ---------- */
  const addAssumption = (v: string) => {
    patch({ assumptions: [...scope.assumptions, v] });
    toast.success(
      "Assumption recorded",
      `"${clip(v)}" is priced as true — if it breaks, timeline and price reopen with it.`
    );
  };
  const removeAssumption = (i: number) => {
    const next = [...scope.assumptions];
    next.splice(i, 1);
    patch({ assumptions: next });
    toast.info("Assumption removed", "One less stated condition. Unstated assumptions become disputes around week 4.");
  };

  /* ---------- acceptance criteria ---------- */
  const addCriterion = (v: string) => {
    patch({ acceptanceCriteria: [...scope.acceptanceCriteria, v] });
    toast.success(
      "Acceptance criterion added",
      `"${clip(v)}" is now part of the definition of done.`
    );
  };
  const removeCriterion = (i: number) => {
    const next = [...scope.acceptanceCriteria];
    next.splice(i, 1);
    patch({ acceptanceCriteria: next });
    toast.info("Criterion removed", "The definition of done just got softer — make sure that's intentional.");
  };

  /* ---------- dependencies ---------- */
  const addDependency = (v: string) => {
    patch({ dependencies: [...scope.dependencies, v] });
    toast.success(
      "Dependency logged",
      `"${clip(v)}" is client-owed and tracked against the timeline.`
    );
  };
  const removeDependency = (i: number) => {
    const next = [...scope.dependencies];
    next.splice(i, 1);
    patch({ dependencies: next });
    toast.info("Dependency cleared", "Removed from the client-owed list — the timeline no longer waits on it.");
  };

  /* ---------- revision rounds ---------- */
  function setRounds(delta: number) {
    const next = Math.min(6, Math.max(0, scope.revisionRounds + delta));
    if (next === scope.revisionRounds) return;
    patch({ revisionRounds: next });
    toast.info(
      `Revision line set to ${next} round${next === 1 ? "" : "s"}`,
      next > 2
        ? "Above the workspace default of 2 — confirm pricing carries the extra rounds."
        : "Rounds beyond this line are billed as change orders, not goodwill."
    );
  }

  return (
    <motion.div variants={listVariants} initial="initial" animate="animate">
      {/* why this tab matters — workspace numbers, not platitudes */}
      <motion.div
        variants={itemVariants}
        className="well mb-4 flex items-start gap-3 px-4 py-3.5"
      >
        <Icon name="shield" size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-[12.5px] leading-relaxed text-ink-mute">
          <span className="font-medium text-ink">Guardrails are where margin lives.</span>{" "}
          Atelier North caught{" "}
          <span className="tnum font-mono text-ink">{analytics.scopeCreepCaught}</span>{" "}
          scope-creep attempts this year and recovered{" "}
          <span className="tnum font-mono text-ink">
            {money(analytics.scopeCreepRecoveredValue)}
          </span>{" "}
          by pointing at this section instead of arguing.
        </p>
      </motion.div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <motion.div variants={itemVariants}>
            <ListEditor
              title="Exclusions"
              microcopy="What is explicitly NOT included. The most profitable section of any scope."
              icon="shield"
              tone="danger"
              items={scope.exclusions}
              onAdd={addExclusion}
              onRemove={removeExclusion}
              placeholder="e.g. Copywriting in any language"
              emptyHint="Nothing excluded yet — and everything not excluded is negotiable. Start with copywriting, photography, and post-launch maintenance."
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ListEditor
              title="Acceptance criteria"
              microcopy="What 'done' means, in testable terms. The client signs against these lines."
              icon="target"
              tone="ok"
              items={scope.acceptanceCriteria}
              onAdd={addCriterion}
              onRemove={removeCriterion}
              placeholder="e.g. LCP < 1.8s on 4G, mid-tier device"
              emptyHint="No acceptance criteria. 'Done' is currently a feeling, not a checklist."
            />
          </motion.div>
        </div>

        <div className="flex flex-col gap-4">
          <motion.div variants={itemVariants}>
            <ListEditor
              title="Assumptions"
              microcopy="What this scope prices as true. If one breaks, the scope reopens with it."
              icon="doc"
              tone="info"
              items={scope.assumptions}
              onAdd={addAssumption}
              onRemove={removeAssumption}
              placeholder="e.g. One consolidated feedback round per phase"
              emptyHint="No assumptions recorded. Unstated assumptions become disputes around week 4."
            />
          </motion.div>

          {/* revision rounds — the line everyone tests */}
          <motion.section variants={itemVariants} className="panel px-4 py-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <header className="flex items-center gap-2">
                  <Icon name="pen" size={14} className="text-ink-faint" />
                  <h3 className="font-display text-[13.5px] font-medium tracking-tight text-ink">
                    Revision rounds
                  </h3>
                </header>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-mute">
                  Workspace default: 2. Every undefined round costs ~6% margin.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRounds(-1)}
                  disabled={scope.revisionRounds <= 0}
                  aria-label="Decrease revision rounds"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-inset font-mono text-[14px] text-ink-mute transition-colors duration-100 hover:border-line-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  −
                </button>
                <span
                  className={cx(
                    "tnum w-8 text-center font-display text-[22px] font-medium",
                    scope.revisionRounds > 2 ? "text-warn" : "text-ink"
                  )}
                >
                  {scope.revisionRounds}
                </span>
                <button
                  type="button"
                  onClick={() => setRounds(1)}
                  disabled={scope.revisionRounds >= 6}
                  aria-label="Increase revision rounds"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-inset font-mono text-[14px] text-ink-mute transition-colors duration-100 hover:border-line-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
            <p className="mt-2.5 border-t border-line pt-2.5 font-mono text-[10.5px] leading-relaxed text-ink-faint">
              Rounds beyond the line are pre-priced change orders. Put the number in
              the proposal, not in the goodwill budget.
            </p>
          </motion.section>

          <motion.div variants={itemVariants}>
            <ListEditor
              title="Client-owed dependencies"
              microcopy="Inputs the client owes, with dates. A slipped dependency moves the timeline — because it's written here."
              icon="calendar"
              tone="neutral"
              itemIcon="calendar"
              items={scope.dependencies}
              onAdd={addDependency}
              onRemove={removeDependency}
              placeholder="e.g. Final product copy by week 6"
              emptyHint="No client-owed items tracked. Every undated dependency is a free timeline extension."
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
