"use client";

/* ================================================================
   Milestones tab — week-grid delivery plan plus the risk register.
   Bars sit on a CSS grid of timelineWeeks columns; risk flags live
   beside the plan because that's where they bite.
   ================================================================ */

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { cx } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import type { Milestone, RiskFlag, RiskLevel, ScopeDoc } from "@/lib/types";
import { Icon } from "@/components/ui/icons";
import { Button, RiskBadge } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { EmptyState, useToast } from "@/components/ui/feedback";

function weekRange(m: Milestone): string {
  return m.durationWeeks > 1 ? `W${m.week}–W${m.week + m.durationWeeks - 1}` : `W${m.week}`;
}

export function MilestonesTab({ scope }: { scope: ScopeDoc }) {
  const updateScope = useApp((s) => s.updateScope);
  const toast = useToast();

  const weeks = Math.max(1, scope.timelineWeeks);
  const labelStep = weeks > 24 ? 4 : weeks > 12 ? 2 : 1;
  const columns = `repeat(${weeks}, minmax(0, 1fr))`;
  const milestones = [...scope.milestones].sort((a, b) => a.week - b.week);

  /* ---------- add risk form ---------- */
  const [riskLabel, setRiskLabel] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("medium");
  const [riskDetail, setRiskDetail] = useState("");
  const canFlag = riskLabel.trim().length > 0 && riskDetail.trim().length > 0;

  function flagRisk() {
    if (!canFlag) return;
    const flag: RiskFlag = {
      id: `rf-${scope.id}-${Date.now()}`,
      label: riskLabel.trim(),
      level: riskLevel,
      detail: riskDetail.trim(),
    };
    updateScope(scope.id, { riskFlags: [...scope.riskFlags, flag] });
    toast.success(
      `Risk flagged — ${flag.label}`,
      `${riskLevel} level. The detail doubles as the mitigation note in the proposal appendix.`
    );
    setRiskLabel("");
    setRiskLevel("medium");
    setRiskDetail("");
  }

  function removeRisk(flag: RiskFlag) {
    updateScope(scope.id, {
      riskFlags: scope.riskFlags.filter((r) => r.id !== flag.id),
    });
    toast.info("Risk flag cleared", `"${flag.label}" removed from the scope record.`);
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* ---------- left: week grid + milestone detail ---------- */}
      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="flex min-w-0 flex-col gap-4"
      >
        <motion.section variants={itemVariants} className="panel px-4 py-4">
          <header className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-[13.5px] font-medium tracking-tight text-ink">
                Delivery plan
              </h3>
              <p className="mt-0.5 text-[12px] text-ink-mute">
                Committed milestones on the week grid — the dates the dependencies
                and the launch hold each other to.
              </p>
            </div>
            <span className="tnum flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-inset px-2 py-1 font-mono text-[11px] text-ink-mute">
              <Icon name="clock" size={11} className="text-ink-faint" />
              {weeks} wks
            </span>
          </header>

          {milestones.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No milestones planned"
              body="Lay the delivery on a week grid so the dependencies and the launch date hold each other accountable."
              className="py-10"
            />
          ) : (
            <div className="overflow-x-auto pb-1">
              <div
                className="relative"
                style={{ minWidth: Math.max(weeks * 26, 480) }}
              >
                {/* week hairlines behind the bars */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid"
                  style={{ gridTemplateColumns: columns }}
                >
                  {Array.from({ length: weeks }).map((_, i) => (
                    <div
                      key={i}
                      className={cx("h-full border-l border-line/40", i === 0 && "border-l-0")}
                    />
                  ))}
                </div>

                <div
                  className="relative grid gap-y-1.5"
                  style={{ gridTemplateColumns: columns }}
                >
                  {/* week labels */}
                  {Array.from({ length: weeks }).map((_, i) => (
                    <div
                      key={`wk-${i}`}
                      style={{ gridColumn: i + 1, gridRow: 1 }}
                      className="pb-1.5 pl-1"
                    >
                      {i % labelStep === 0 && (
                        <span className="microlabel !text-[9px]">W{i + 1}</span>
                      )}
                    </div>
                  ))}

                  {/* milestone bars */}
                  {milestones.map((m, idx) => {
                    const start = Math.min(Math.max(m.week, 1), weeks);
                    const span = Math.max(1, Math.min(m.durationWeeks, weeks - start + 1));
                    return (
                      <motion.div
                        key={m.id}
                        variants={itemVariants}
                        style={{ gridColumn: `${start} / span ${span}`, gridRow: idx + 2 }}
                        title={`${m.title} · ${weekRange(m)} — ${m.description}`}
                        className="truncate rounded-sm border border-accent-line/50 bg-accent-soft px-1.5 py-1 text-[11px] leading-tight font-medium text-accent transition-colors duration-150 hover:border-accent-line"
                      >
                        {m.title}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {milestones.length > 0 && (
          <motion.section variants={itemVariants} className="panel px-4 py-2">
            <motion.ul
              variants={listVariants}
              initial="initial"
              animate="animate"
              className="divide-y divide-line"
            >
              {milestones.map((m) => (
                <motion.li
                  key={m.id}
                  variants={itemVariants}
                  className="flex items-start gap-3.5 py-2.5"
                >
                  <span className="tnum w-16 shrink-0 pt-px font-mono text-[11.5px] text-ink-faint">
                    {weekRange(m)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink">{m.title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-mute">
                      {m.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </motion.section>
        )}
      </motion.div>

      {/* ---------- right: risk register ---------- */}
      <motion.aside
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="panel px-4 py-4"
      >
        <motion.header variants={itemVariants} className="flex items-center gap-2">
          <Icon name="alert-triangle" size={14} className="text-warn" />
          <h3 className="font-display text-[13.5px] font-medium tracking-tight text-ink">
            Risk flags
          </h3>
          <span className="tnum ml-auto font-mono text-[10.5px] text-ink-faint">
            {scope.riskFlags.length}
          </span>
        </motion.header>
        <motion.p variants={itemVariants} className="mt-1 text-[12px] leading-relaxed text-ink-mute">
          Named risks with mitigations. Each one is paraphrased in the proposal so
          the client signs the risk, not just the price.
        </motion.p>

        <div className="mt-3 space-y-2.5">
          {scope.riskFlags.length === 0 && (
            <motion.p
              variants={itemVariants}
              className="rounded-md border border-dashed border-line px-3 py-2.5 text-[12px] leading-relaxed text-ink-faint"
            >
              No risks flagged. Either this is the calmest project of the year, or
              nobody has looked yet.
            </motion.p>
          )}
          {scope.riskFlags.map((flag) => (
            <motion.article
              key={flag.id}
              layout
              variants={itemVariants}
              className="group rounded-lg border border-line bg-inset/40 px-3.5 py-3 transition-colors duration-150 hover:border-line-strong"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] leading-snug font-medium text-ink">
                  {flag.label}
                </p>
                <button
                  type="button"
                  onClick={() => removeRisk(flag)}
                  aria-label={`Clear risk "${flag.label}"`}
                  className="mt-0.5 shrink-0 text-ink-faint opacity-0 transition-[opacity,color] duration-100 group-hover:opacity-100 hover:text-danger"
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
              <RiskBadge level={flag.level} className="mt-1.5" />
              <p className="mt-2 text-[12px] leading-relaxed text-ink-mute">
                {flag.detail}
              </p>
            </motion.article>
          ))}
        </div>

        {/* add-risk inline */}
        <motion.div
          variants={itemVariants}
          className="mt-4 space-y-3 border-t border-line pt-3.5"
        >
          <p className="microlabel">Flag a risk</p>
          <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2">
            <Input
              value={riskLabel}
              onChange={(e) => setRiskLabel(e.target.value)}
              placeholder="Risk in five words"
              aria-label="Risk label"
              className="h-7.5 text-[12.5px]"
            />
            <Select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              aria-label="Risk level"
              className="!h-7.5 text-[12.5px]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <Field
            label="Detail & mitigation"
            htmlFor="risk-detail"
            hint="What could go wrong, and what's already in the plan to absorb it."
          >
            <Textarea
              id="risk-detail"
              value={riskDetail}
              onChange={(e) => setRiskDetail(e.target.value)}
              rows={2}
              className="min-h-14 text-[12.5px]"
              placeholder="e.g. Client copy historically 6 weeks late — deadline in contract, phased-launch fallback."
            />
          </Field>
          <Button variant="secondary" size="sm" disabled={!canFlag} onClick={flagRisk}>
            <Icon name="alert-triangle" size={12} />
            Flag risk
          </Button>
        </motion.div>
      </motion.aside>
    </div>
  );
}
