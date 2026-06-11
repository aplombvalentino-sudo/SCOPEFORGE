"use client";

/* Settings shared bits — panel wrapper and preference toggle rows. */

import type { ReactNode } from "react";
import { cx } from "@/lib/format";
import { Toggle } from "@/components/ui/fields";

/** Titled settings panel — the standard block on every tab. */
export function SettingsPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("panel px-4 py-4", className)}>
      <h2 className="font-display text-[14px] font-medium tracking-tight text-ink">{title}</h2>
      {description && (
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-mute">{description}</p>
      )}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

/** Toggle row with title + one-line rationale. */
export function PrefToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-mute">{description}</p>
      </div>
      <div className="mt-0.5 shrink-0">
        <Toggle checked={checked} onChange={onChange} label={title} />
      </div>
    </div>
  );
}
