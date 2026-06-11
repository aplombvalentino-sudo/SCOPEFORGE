"use client";

/* ================================================================
   MonoStepper — mono 01/02/03 step rail with an animated underline
   that slides to the active step. Shared by the signup flow and
   the integration connection ritual.
   ================================================================ */

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cx } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";

export function MonoStepper({
  steps,
  active,
  className,
}: {
  steps: string[];
  /** zero-based index of the current step */
  active: number;
  className?: string;
}) {
  const group = useId();
  const reduced = useReducedMotion();
  return (
    <div
      role="list"
      aria-label="Progress"
      className={cx("flex items-center gap-5 border-b border-line sm:gap-7", className)}
    >
      {steps.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <div
            key={label}
            role="listitem"
            aria-current={current ? "step" : undefined}
            className="relative flex items-center gap-2 pb-2.5"
          >
            <span
              className={cx(
                "font-mono text-[10.5px] font-medium tracking-[0.09em] tnum",
                current ? "text-accent" : done ? "text-ink-mute" : "text-ink-faint"
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={cx(
                "text-[12.5px] font-medium whitespace-nowrap",
                current ? "text-ink" : done ? "text-ink-mute" : "text-ink-faint"
              )}
            >
              {label}
            </span>
            {done && <Icon name="check" size={11} strokeWidth={2.2} className="text-ok" />}
            {current && (
              <motion.span
                layoutId={`mono-step-${group}`}
                className="absolute right-0 -bottom-px left-0 h-0.5 rounded-full bg-accent"
                transition={
                  reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE }
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
