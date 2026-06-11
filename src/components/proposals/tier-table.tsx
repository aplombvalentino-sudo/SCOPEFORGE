"use client";

/* Three-column pricing tier table for the client-facing proposal render. */

import { Icon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/primitives";
import { cx, money } from "@/lib/format";
import type { PricingModel, TierKey } from "@/lib/types";

export function TierTable({
  model,
  selected,
  className,
}: {
  model: PricingModel;
  selected: TierKey;
  className?: string;
}) {
  const perMonth = model.mode === "retainer";
  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-3">
        {model.tiers.map((tier) => {
          const isSelected = tier.key === selected;
          return (
            <div
              key={tier.key}
              className={cx(
                "relative overflow-hidden rounded-lg border px-4 pt-4 pb-4 transition-colors duration-150",
                isSelected
                  ? "border-accent-line bg-accent-soft/40"
                  : "border-line bg-surface hover:border-line-strong"
              )}
            >
              {tier.recommended && (
                <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[14px] font-medium tracking-tight">
                  {tier.name}
                </p>
                {isSelected ? (
                  <Badge tone="accent">Selected</Badge>
                ) : tier.recommended ? (
                  <Badge tone="neutral">Recommended</Badge>
                ) : null}
              </div>
              <p className="tnum mt-2 font-display text-[21px] font-medium tracking-tight">
                {money(tier.price)}
                {perMonth && (
                  <span className="text-[12px] font-normal text-ink-mute">/mo</span>
                )}
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-mute">
                {tier.summary}
              </p>
              <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                {tier.inclusions.map((inc) => (
                  <li
                    key={inc}
                    className="flex items-start gap-1.5 text-[12px] leading-snug text-ink-mute"
                  >
                    <Icon
                      name="check"
                      size={11}
                      strokeWidth={2.2}
                      className={cx(
                        "mt-0.5 shrink-0",
                        isSelected ? "text-accent" : "text-ink-faint"
                      )}
                    />
                    {inc}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {model.addOns.length > 0 && (
        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
          <span className="microlabel mr-1.5">Add-ons</span>
          {model.addOns
            .map((a) => `${a.name} — ${money(a.price)}`)
            .join("  ·  ")}
        </p>
      )}
    </div>
  );
}
