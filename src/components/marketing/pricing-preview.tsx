"use client";

/* ================================================================
   Tier cards — used as the landing preview (fixed monthly) and on
   /pricing (driven by the billing toggle). Agency tier is the
   visually recommended one.
   ================================================================ */

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cx, money } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/primitives";
import { DemoCta } from "@/components/shell/marketing-shell";
import {
  MARKETING_TIERS,
  tierPrice,
  type Billing,
  type MarketingTier,
} from "./pricing-data";
import {
  LinkButton,
  MarketingSection,
  RevealItem,
  RevealList,
  SectionIntro,
} from "./shared";

function TierCard({ tier, billing }: { tier: MarketingTier; billing: Billing }) {
  const price = tierPrice(tier, billing);
  return (
    <div
      className={cx(
        "relative flex h-full flex-col rounded-lg border px-5 py-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5",
        tier.highlighted
          ? "border-accent-line bg-raised shadow-glow"
          : "border-line bg-surface hover:border-line-strong hover:shadow-e2"
      )}
    >
      {tier.highlighted && (
        <Badge tone="accent" className="absolute -top-2.5 left-5">
          recommended
        </Badge>
      )}
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-[16px] font-medium tracking-tight">{tier.name}</h3>
        <span className="microlabel">{tier.audience}</span>
      </div>
      <div className="mt-3 flex h-11 items-baseline gap-1.5 overflow-hidden">
        {price !== null ? (
          <>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${tier.key}-${billing}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="tnum font-display text-[32px] leading-none font-medium tracking-tight text-ink"
              >
                {money(price)}
              </motion.span>
            </AnimatePresence>
            <span className="font-mono text-[10.5px] tracking-wide text-ink-faint">
              / USER / MO{billing === "annual" ? " · BILLED ANNUALLY" : ""}
            </span>
          </>
        ) : (
          <>
            <span className="font-display text-[32px] leading-none font-medium tracking-tight text-ink">
              Custom
            </span>
            <span className="font-mono text-[10.5px] tracking-wide text-ink-faint">
              ANNUAL CONTRACT
            </span>
          </>
        )}
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-mute">{tier.blurb}</p>
      <ul className="mt-4 flex-1 space-y-1.5 border-t border-line pt-4">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[12.5px] text-ink-mute">
            <Icon
              name="check"
              size={12}
              className={cx("mt-0.5 shrink-0", tier.highlighted ? "text-accent" : "text-ink-faint")}
            />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-5">
        {tier.cta.kind === "demo" ? (
          <DemoCta
            variant={tier.highlighted ? "primary" : "secondary"}
            className="w-full"
          >
            {tier.cta.label}
          </DemoCta>
        ) : (
          <LinkButton href="/signup" className="w-full">
            {tier.cta.label}
          </LinkButton>
        )}
      </div>
    </div>
  );
}

export function TierGrid({ billing }: { billing: Billing }) {
  return (
    <RevealList className="grid items-stretch gap-4 pt-3 md:grid-cols-3">
      {MARKETING_TIERS.map((t) => (
        <RevealItem key={t.key} className="h-full">
          <TierCard tier={t} billing={billing} />
        </RevealItem>
      ))}
    </RevealList>
  );
}

/** Landing-page pricing preview: monthly prices + link to /pricing. */
export function PricingPreview() {
  return (
    <MarketingSection id="pricing" className="border-t border-line py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionIntro
          overline="Pricing"
          title="Priced like you price: tiers, no surprises."
          lede="Per user, per month. Annual billing takes 20% off. Every plan includes the full intake-to-proposal chain — the difference is volume and control."
        />
        <Link
          href="/pricing"
          className="group mb-1 flex items-center gap-1.5 text-[13px] font-medium text-accent transition-colors hover:text-accent-hover"
        >
          Full comparison table
          <Icon
            name="arrow-right"
            size={13}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
      <div className="mt-8">
        <TierGrid billing="monthly" />
      </div>
    </MarketingSection>
  );
}
