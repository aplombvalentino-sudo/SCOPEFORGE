"use client";

/* ================================================================
   /pricing — three tiers with billing toggle (annual −20%), full
   capability comparison table, FAQ subset, final CTA.
   ================================================================ */

import { Fragment, useState } from "react";
import { PageTransition } from "@/components/ui/page";
import { Segmented } from "@/components/ui/tabs";
import { Icon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cx } from "@/lib/format";
import { TierGrid } from "@/components/marketing/pricing-preview";
import { COMPARE_GROUPS, type Billing } from "@/components/marketing/pricing-data";
import { FAQ_ITEMS, FaqAccordion } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";
import {
  MarketingSection,
  Reveal,
  SectionIntro,
} from "@/components/marketing/shared";

function CompareCell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  return (
    <TD className={cx("text-center", highlight && "bg-accent-soft/20")}>
      {value === true ? (
        <Icon name="check" size={14} className="inline text-accent" />
      ) : value === false ? (
        <span className="text-ink-faint">—</span>
      ) : (
        <span className="tnum font-mono text-[11.5px] text-ink">{value}</span>
      )}
    </TD>
  );
}

function ComparisonTable() {
  return (
    <Table>
      <THead>
        <tr>
          <TH className="w-2/5">Capability</TH>
          <TH className="text-center">Studio</TH>
          <TH className="bg-accent-soft/20 text-center">
            <span className="inline-flex items-center gap-1.5">
              Agency
              <Badge tone="accent">rec</Badge>
            </span>
          </TH>
          <TH className="text-center">Scale</TH>
        </tr>
      </THead>
      <TBody>
        {COMPARE_GROUPS.map((group) => (
          <Fragment key={group.group}>
            <TR className="bg-inset/40">
              <TD colSpan={4} className="!py-2">
                <span className="microlabel">{group.group}</span>
              </TD>
            </TR>
            {group.rows.map((row) => (
              <TR key={row.label}>
                <TD className="text-[12.5px] text-ink-mute">{row.label}</TD>
                <CompareCell value={row.studio} />
                <CompareCell value={row.agency} highlight />
                <CompareCell value={row.scale} />
              </TR>
            ))}
          </Fragment>
        ))}
      </TBody>
    </Table>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <PageTransition>
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="blueprint blueprint-fade absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-14 lg:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="microlabel">Pricing</p>
              <h1 className="mt-3 max-w-xl font-display text-[32px] leading-[1.08] font-medium tracking-tight sm:text-[38px]">
                Priced like you price: tiers, no surprises.
              </h1>
              <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-ink-mute">
                Per user, per month. Every plan ships the full intake-to-proposal chain — the
                difference is volume, margin control, and governance. Annual billing takes 20%
                off.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Segmented<Billing>
                options={[
                  { value: "monthly", label: "Billed monthly" },
                  { value: "annual", label: "Billed annually" },
                ]}
                value={billing}
                onChange={setBilling}
              />
              <span
                className={cx(
                  "tnum font-mono text-[10px] tracking-wide transition-colors duration-200",
                  billing === "annual" ? "text-accent" : "text-ink-faint"
                )}
              >
                ANNUAL = 20% OFF, 12-MONTH TERM
              </span>
            </div>
          </div>
          <div className="mt-10">
            <TierGrid billing={billing} />
          </div>
        </div>
      </section>

      <MarketingSection className="py-16">
        <SectionIntro
          overline="Full comparison"
          title="Every capability, every plan."
          lede="No “contact us to find out” rows. If a limit matters to a 14-person agency, it's in this table."
        />
        <Reveal delay={0.06} className="mt-8">
          <ComparisonTable />
        </Reveal>
        <p className="tnum mt-4 font-mono text-[10.5px] tracking-wide text-ink-faint">
          ALL PLANS: EU HOSTING (FRANKFURT) · DATA EXPORT ANYTIME · NO PER-PROPOSAL FEES
        </p>
      </MarketingSection>

      <MarketingSection className="border-t border-line py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <SectionIntro
            overline="Pricing questions"
            title="Asked on most demo calls."
            lede="The full FAQ — including what the AI does and doesn't do — lives on the landing page."
          />
          <Reveal delay={0.08}>
            <FaqAccordion items={[FAQ_ITEMS[0], FAQ_ITEMS[2], FAQ_ITEMS[4], FAQ_ITEMS[5]]} />
          </Reveal>
        </div>
      </MarketingSection>

      <CtaBand
        title="Run your next quote through Scopeforge and check the margin math yourself."
        lede="Book a 25-minute demo, or open the live workspace — the Maison Vey pricing model is in there, floor checks and all."
      />
    </PageTransition>
  );
}
