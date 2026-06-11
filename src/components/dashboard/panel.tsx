/* Shared dashboard panel shell — microlabel header, hairline divider, dense body. */

import type { ReactNode } from "react";
import { cx } from "@/lib/format";

export function DashPanel({
  title,
  caption,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  /** one-line computed context under the title, e.g. "€171,900 across 6 open leads" */
  caption?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx("panel flex flex-col overflow-hidden", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="microlabel">{title}</h2>
          {caption && (
            <p className="tnum mt-1 text-[12px] leading-snug text-ink-mute">{caption}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cx("flex-1 px-4 py-3.5", bodyClassName)}>{children}</div>
    </section>
  );
}
