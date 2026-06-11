"use client";

/* Service blueprint card — the productised offer at a glance:
   price, margin target, timeline, deliverables, guardrail counts. */

import { motion } from "framer-motion";
import type { ServiceBlueprint } from "@/lib/types";
import { money } from "@/lib/format";
import { itemVariants } from "@/lib/motion";
import { Badge } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { MonoChip } from "./bits";

const SHOWN = 4;

export function ServiceCard({
  service,
  isLocal,
  onOpen,
}: {
  service: ServiceBlueprint;
  /** added this session — not part of the seeded catalogue */
  isLocal?: boolean;
  onOpen: () => void;
}) {
  const extra = service.deliverables.length - SHOWN;
  return (
    <motion.button
      type="button"
      variants={itemVariants}
      layout
      onClick={onOpen}
      className="panel group flex h-full flex-col px-4 py-3.5 text-left transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-e1"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <h3 className="font-display text-[15px] leading-snug font-medium tracking-tight text-ink">
          {service.name}
        </h3>
        <span className="flex shrink-0 items-center gap-1.5">
          {isLocal && <Badge tone="accent">this session</Badge>}
          <Badge>{service.category}</Badge>
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-mute">
        {service.description}
      </p>

      <div className="mt-3 flex w-full items-baseline gap-1.5">
        <span className="tnum font-display text-[20px] leading-none font-medium tracking-tight text-ink">
          {money(service.basePrice)}
        </span>
        {service.pricingMode === "retainer" && (
          <span className="font-mono text-[11px] text-ink-mute">/mo</span>
        )}
        <MonoChip className="ml-auto">target margin {service.targetMarginPct}%</MonoChip>
      </div>

      <div className="mt-2 flex w-full flex-wrap gap-1.5">
        <MonoChip icon="clock">{service.typicalTimelineWeeks} wks typical</MonoChip>
        <MonoChip icon="shield">{service.standardExclusions.length} exclusions</MonoChip>
        <MonoChip icon="pen">
          {service.revisionRounds} revision {service.revisionRounds === 1 ? "round" : "rounds"}
        </MonoChip>
      </div>

      <div className="mt-3 w-full flex-1">
        {service.deliverables.length === 0 ? (
          <p className="text-[12px] text-ink-faint">
            No deliverables defined yet — open the blueprint to add them before first use.
          </p>
        ) : (
          <ul className="space-y-1">
            {service.deliverables.slice(0, SHOWN).map((d) => (
              <li key={d} className="flex items-start gap-1.5 text-[12.5px] leading-snug text-ink">
                <Icon name="check" size={11} className="mt-0.5 shrink-0 text-accent" />
                {d}
              </li>
            ))}
            {extra > 0 && (
              <li className="tnum pl-[18.5px] font-mono text-[11px] text-ink-faint">
                +{extra} more
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="mt-3 flex w-full items-center justify-between border-t border-line pt-2.5">
        <span className="tnum font-mono text-[11px] text-ink-mute">
          Used {service.usedCount}×
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px] text-ink-faint transition-colors duration-150 group-hover:text-accent">
          blueprint
          <Icon name="arrow-right" size={11} />
        </span>
      </div>
    </motion.button>
  );
}
