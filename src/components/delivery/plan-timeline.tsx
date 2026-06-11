"use client";

/* First-14-days plan — horizontal day-anchored timeline on desktop
   (D1–D14 spine, action cards aligned to their day on a 16-col grid,
   alternating rows so neighbours never collide), vertical on mobile. */

import { motion } from "framer-motion";
import { cx } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";

const DAYS = Array.from({ length: 14 }, (_, i) => i + 1);

export function PlanTimeline({ plan }: { plan: { day: number; action: string }[] }) {
  const actionDays = new Set(plan.map((p) => p.day));

  return (
    <>
      {/* desktop: day-positioned grid */}
      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="hidden gap-x-2 gap-y-3 md:grid"
        style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
      >
        {/* spine */}
        <div className="relative h-9" style={{ gridColumn: "1 / -1", gridRow: 1 }}>
          <span aria-hidden className="absolute top-[7px] right-0 left-0 h-px bg-line" />
        </div>
        {DAYS.map((d) => (
          <div
            key={d}
            className="z-10 flex flex-col items-center gap-1 pt-[3px]"
            style={{ gridColumn: `${d} / span 1`, gridRow: 1 }}
          >
            <span
              className={cx(
                "h-[9px] w-[9px] rounded-full border",
                actionDays.has(d)
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface"
              )}
            />
            <span
              className={cx(
                "font-mono text-[9.5px] tracking-wide",
                actionDays.has(d) ? "font-medium text-accent" : "text-ink-faint"
              )}
            >
              D{d}
            </span>
          </div>
        ))}
        {plan.map((p, i) => {
          const span = Math.min(3, 17 - p.day);
          return (
            <motion.div
              key={`${p.day}-${i}`}
              variants={itemVariants}
              style={{ gridColumn: `${p.day} / span ${span}`, gridRow: 2 + (i % 2) }}
              className="rounded-md border border-line bg-surface px-3 py-2.5 transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-e1"
            >
              <span className="microlabel !text-accent">Day {p.day}</span>
              <p className="mt-1 text-[12px] leading-snug text-ink">{p.action}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* mobile: stacked spine */}
      <motion.ol
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="relative space-y-2.5 md:hidden"
      >
        <span aria-hidden className="absolute top-3 bottom-3 left-[17px] w-px bg-line" />
        {plan.map((p, i) => (
          <motion.li key={`${p.day}-${i}`} variants={itemVariants} className="relative flex gap-3">
            <span className="tnum z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-raised font-mono text-[10.5px] font-medium text-accent">
              D{p.day}
            </span>
            <div className="well flex-1 px-3 py-2">
              <p className="text-[12.5px] leading-snug text-ink">{p.action}</p>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </>
  );
}
