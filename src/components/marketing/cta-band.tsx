"use client";

/* ================================================================
   Final CTA band — blueprint texture, demo + live-demo CTAs.
   Reused on /, /product, /pricing with overridable copy.
   ================================================================ */

import { Icon } from "@/components/ui/icons";
import { DemoCta } from "@/components/shell/marketing-shell";
import { LinkButton, MarketingSection, Reveal } from "./shared";

export function CtaBand({
  title = "Your next proposal could go out this week — scoped, priced, and tracked.",
  lede = "Book a 25-minute demo, or open the live demo workspace: Atelier North's real pipeline, real margins, nothing staged.",
}: {
  title?: string;
  lede?: string;
}) {
  return (
    <MarketingSection className="py-20">
      <Reveal>
        <div className="panel-raised relative overflow-hidden px-6 py-14 text-center shadow-e2 sm:px-12">
          <div aria-hidden className="blueprint blueprint-fade absolute inset-0" />
          <div className="relative">
            <p className="microlabel">Get started</p>
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-[26px] leading-[1.12] font-medium tracking-tight sm:text-[32px]">
              {title}
            </h2>
            <p className="mx-auto mt-3.5 max-w-xl text-[14px] leading-relaxed text-ink-mute">
              {lede}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <DemoCta>Book a demo</DemoCta>
              <LinkButton href="/dashboard">
                Explore the live demo
                <Icon name="arrow-up-right" size={13} />
              </LinkButton>
            </div>
            <p className="mt-6 font-mono text-[10.5px] tracking-wide text-ink-faint">
              25 MINUTES · SANDBOX PRE-LOADED WITH YOUR SERVICE TYPES · NO CARD REQUIRED
            </p>
          </div>
        </div>
      </Reveal>
    </MarketingSection>
  );
}
