"use client";

/* Animated underline tabs — shared layoutId gives the sliding indicator. */

import { motion } from "framer-motion";
import { useId } from "react";
import { cx } from "@/lib/format";

export interface TabDef<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabDef<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const layoutGroup = useId();
  return (
    <div
      role="tablist"
      className={cx("flex items-center gap-0.5 border-b border-line", className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cx(
              "relative px-3 pt-1.5 pb-2.5 text-[13px] font-medium transition-colors duration-150",
              active ? "text-ink" : "text-ink-faint hover:text-ink-mute"
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cx(
                    "tnum rounded-sm px-1 font-mono text-[10.5px]",
                    active ? "bg-accent-soft text-accent" : "bg-inset text-ink-faint"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {active && (
              <motion.span
                layoutId={`tab-underline-${layoutGroup}`}
                className="absolute right-1 -bottom-px left-1 h-0.5 rounded-full bg-accent"
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* Segmented control — for view switches (list / board). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const layoutGroup = useId();
  return (
    <div
      role="tablist"
      className={cx(
        "inline-flex items-center gap-0.5 rounded-md border border-line bg-inset p-0.5",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              "relative flex h-6.5 items-center gap-1.5 rounded-[5px] px-2.5 text-[12.5px] font-medium transition-colors duration-150",
              active ? "text-ink" : "text-ink-faint hover:text-ink-mute"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${layoutGroup}`}
                className="absolute inset-0 rounded-[5px] border border-line bg-raised shadow-e1"
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
