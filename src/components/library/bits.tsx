"use client";

/* ================================================================
   Library shared bits — template-kind metadata, mono chips, tag
   chips, and the local-id helper for session-only records.
   ================================================================ */

import type { ReactNode } from "react";
import { cx } from "@/lib/format";
import type { TemplateKind } from "@/lib/types";
import { Icon, type IconName } from "@/components/ui/icons";

export const TEMPLATE_KIND_META: Record<
  TemplateKind,
  { label: string; plural: string; icon: IconName }
> = {
  proposal: { label: "Proposal", plural: "Proposals", icon: "proposal" },
  scope_module: { label: "Scope module", plural: "Scope modules", icon: "scope" },
  onboarding: { label: "Onboarding", plural: "Onboarding", icon: "onboarding" },
  email: { label: "Email", plural: "Emails", icon: "mail" },
};

let localCounter = 0;

/** Ids for records created in this session (never collide with seeds). */
export function localId(prefix: string): string {
  return `${prefix}-local-${++localCounter}`;
}

/** Tiny mono metadata chip — timelines, margins, counts. */
export function MonoChip({
  icon,
  children,
  className,
}: {
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "tnum inline-flex items-center gap-1 rounded-sm border border-line bg-inset px-1.5 py-0.5 font-mono text-[10.5px] tracking-wide whitespace-nowrap text-ink-mute",
        className
      )}
    >
      {icon && <Icon name={icon} size={10} className="shrink-0 text-ink-faint" />}
      {children}
    </span>
  );
}

/** Lowercase tag chip for template tags. */
export function TagChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-sm bg-inset px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-faint">
      {children}
    </span>
  );
}
