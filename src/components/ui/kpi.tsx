"use client";

/* KPI stat card with animated count-up. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { cx } from "@/lib/format";
import { Icon, type IconName } from "./icons";

/** Animates a number from 0 to target on mount. Format via `render`. */
export function CountUp({
  value,
  render,
  duration = 0.9,
}: {
  value: number;
  render?: (v: number) => string;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // ease-out-quart
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(value * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration, reduced]);

  return <>{render ? render(display) : Math.round(display).toString()}</>;
}

export function KpiCard({
  label,
  value,
  render,
  delta,
  deltaGood,
  icon,
  footer,
  className,
}: {
  label: string;
  value: number;
  render?: (v: number) => string;
  /** e.g. "+12% vs May" */
  delta?: string;
  deltaGood?: boolean;
  icon?: IconName;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "panel group relative overflow-hidden px-4 py-3.5 transition-[border-color,box-shadow,transform] duration-200 hover:border-line-strong hover:shadow-e1",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="microlabel">{label}</span>
        {icon && (
          <Icon
            name={icon}
            size={14}
            className="text-ink-faint transition-colors duration-200 group-hover:text-accent"
          />
        )}
      </div>
      <div className="tnum mt-1.5 font-display text-[26px] leading-none font-medium tracking-tight">
        <CountUp value={value} render={render} />
      </div>
      {(delta || footer) && (
        <div className="mt-2 flex items-center gap-2">
          {delta && (
            <span
              className={cx(
                "tnum font-mono text-[11px]",
                deltaGood === undefined
                  ? "text-ink-faint"
                  : deltaGood
                    ? "text-ok"
                    : "text-danger"
              )}
            >
              {delta}
            </span>
          )}
          {footer}
        </div>
      )}
    </div>
  );
}
