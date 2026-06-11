"use client";

/* Page-level scaffolding: PageHeader, Section, PageTransition wrapper. */

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cx } from "@/lib/format";
import { pageVariants } from "@/lib/motion";

/** Wrap every app page's root in this for the standard entry motion. */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  );
}

export function PageHeader({
  overline,
  title,
  description,
  actions,
  className,
}: {
  /** mono micro-label above the title, e.g. "PIPELINE / LEADS" */
  overline?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {overline && <p className="microlabel mb-1.5">{overline}</p>}
        <h1 className="font-display text-[22px] leading-tight font-medium tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-mute">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("mb-6", className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            {title && (
              <h2 className="font-display text-[15px] font-medium tracking-tight text-ink">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-[12.5px] text-ink-mute">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
