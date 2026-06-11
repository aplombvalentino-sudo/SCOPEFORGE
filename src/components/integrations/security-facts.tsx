"use client";

/* ================================================================
   Security footer — four quiet, factual guarantees.
   ================================================================ */

import { Icon, type IconName } from "@/components/ui/icons";

const FACTS: { icon: IconName; text: string }[] = [
  { icon: "lock", text: "Tokens encrypted at rest — never in the browser" },
  { icon: "eye", text: "On-demand access only — no background mailbox sync" },
  { icon: "shield", text: "Every access is logged and visible above" },
  { icon: "x", text: "Disconnect revokes access at the provider, instantly" },
];

export function SecurityFacts() {
  return (
    <div className="panel grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {FACTS.map((fact) => (
        <div key={fact.text} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-inset">
            <Icon name={fact.icon} size={12} className="text-ink-faint" />
          </span>
          <p className="text-[12px] leading-snug text-ink-mute">{fact.text}</p>
        </div>
      ))}
    </div>
  );
}
