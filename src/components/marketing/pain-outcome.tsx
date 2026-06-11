"use client";

/* ================================================================
   Pain-to-outcome mapping: "today" vs "with Scopeforge", row by
   row, each pair anchored to a real workspace number.
   ================================================================ */

import { Icon } from "@/components/ui/icons";
import { MarketingSection, RevealItem, RevealList, SectionIntro } from "./shared";

const ROWS: { today: string; after: string; stat: string; statLabel: string }[] = [
  {
    today:
      "First proposal goes out in 6.5 days — the industry median. By then the lead has gone cold or gone shopping.",
    after:
      "2.1-day median from intake to sent proposal. Quotes go out while the requirement is still warm in the client's head.",
    stat: "2.1d",
    statLabel: "median turnaround",
  },
  {
    today:
      "Pricing from memory: last project's number, adjusted by whatever the client sighed at on the call.",
    after:
      "Every tier costed against a 35% margin floor before anyone sees a number. Workspace average holds at 39.4%.",
    stat: "39.4%",
    statLabel: "avg margin",
  },
  {
    today:
      "“While you’re at it…” requests get shipped free, because nobody can cite the scope line in the moment.",
    after:
      "11 creep requests classified and re-quoted last quarter — €14,750 invoiced instead of silently absorbed.",
    stat: "€14.8K",
    statLabel: "creep recovered",
  },
  {
    today:
      "Follow-ups happen when someone remembers. “Just checking in” lands three weeks too late.",
    after:
      "Sequences armed at send. Drafts reference what the client actually did — like re-reading the pricing section four times.",
    stat: "×4",
    statLabel: "views, tracked",
  },
  {
    today:
      "Every kickoff is improvised. Access requests dribble in over three weeks while the team waits to start.",
    after:
      "A standard onboarding flow at signature: kickoff checklist, asset requests, and a 14-day plan the client can see.",
    stat: "11",
    statLabel: "kickoff tasks",
  },
];

export function PainOutcome() {
  return (
    <MarketingSection className="py-20">
      <SectionIntro
        overline="Before / after"
        title="The margin doesn't leak in delivery. It leaks in the gaps."
        lede="Slow quotes, gut pricing, free change requests, forgotten follow-ups. Here is what each gap looks like on either side of the switch."
      />
      <div className="mt-9 hidden grid-cols-[1fr_1fr_92px] gap-3 sm:grid">
        <p className="microlabel px-1">Quoting today</p>
        <p className="microlabel px-1" style={{ color: "var(--accent)" }}>
          With Scopeforge
        </p>
        <span aria-hidden />
      </div>
      <RevealList className="mt-3 space-y-3">
        {ROWS.map((r) => (
          <RevealItem
            key={r.stat}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_92px] sm:items-stretch"
          >
            <div className="flex items-start gap-2.5 rounded-md border border-line bg-surface px-4 py-3 transition-colors duration-150 hover:border-line-strong">
              <Icon name="x" size={12} className="mt-1 shrink-0 text-ink-faint" />
              <p className="text-[13px] leading-relaxed text-ink-mute">{r.today}</p>
            </div>
            <div className="flex items-start gap-2.5 rounded-md border border-accent-line/35 bg-accent-soft/40 px-4 py-3 transition-colors duration-150 hover:border-accent-line">
              <Icon name="check" size={13} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[13px] leading-relaxed text-ink">{r.after}</p>
            </div>
            <div className="hidden flex-col items-end justify-center rounded-md border border-line bg-inset/60 px-3 py-2 sm:flex">
              <span className="tnum font-display text-[18px] font-medium tracking-tight text-ink">
                {r.stat}
              </span>
              <span className="microlabel mt-0.5 text-right !text-[9px]">{r.statLabel}</span>
            </div>
          </RevealItem>
        ))}
      </RevealList>
    </MarketingSection>
  );
}
