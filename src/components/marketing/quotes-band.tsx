"use client";

/* ================================================================
   Trust architecture: three operator quotes, each with a concrete
   metric chip. No logo spam.
   ================================================================ */

import { initials } from "@/lib/format";
import { Avatar, Badge } from "@/components/ui/primitives";
import { MarketingSection, RevealItem, RevealList, SectionIntro } from "./shared";

const QUOTES = [
  {
    metric: "6d → 2.1d to proposal",
    quote:
      "An inbound landed at 07:04 — founder, CAC crisis, traveling Thursday. By standup we had the analysis, the gaps, and a call booked for Wednesday. That used to be a week of back-and-forth.",
    name: "Maya Lindqvist",
    role: "Founder, Atelier North",
    org: "14-person digital agency · Copenhagen",
  },
  {
    metric: "€11,200 creep re-quoted in Q1",
    quote:
      "The change-order replies are the feature we actually pay for. “Feels small, the logic is all there” used to cost us a free sprint. Now it gets a classification, a scope citation, and a price.",
    name: "Ruben Castell",
    role: "Managing Partner, Forma Negra",
    org: "8-person brand studio · Barcelona",
  },
  {
    metric: "+4pts avg margin in 2 quarters",
    quote:
      "Margin floor alerts ended the quiet discounting. Nobody drops below 35% by accident anymore — and we didn't raise a single rate card to get those four points back.",
    name: "Hanne Vos",
    role: "Operations Director, Kanaal Werk",
    org: "19-person automation consultancy · Rotterdam",
  },
];

export function QuotesBand() {
  return (
    <MarketingSection className="py-20">
      <SectionIntro
        overline="Operators, not logos"
        title="Run by the people who price the work."
      />
      <RevealList className="mt-9 grid gap-4 md:grid-cols-3">
        {QUOTES.map((q) => (
          <RevealItem key={q.name}>
            <figure className="panel flex h-full flex-col px-5 py-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-e2">
              <Badge tone="accent" className="tnum self-start">
                {q.metric}
              </Badge>
              <blockquote className="mt-4 flex-1 text-[13.5px] leading-relaxed text-ink">
                {q.quote}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-2.5 border-t border-line pt-4">
                <Avatar initials={initials(q.name)} size={28} title={q.name} />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-ink">
                    {q.name} · <span className="font-normal text-ink-mute">{q.role}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] tracking-wide text-ink-faint">
                    {q.org}
                  </p>
                </div>
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealList>
    </MarketingSection>
  );
}
