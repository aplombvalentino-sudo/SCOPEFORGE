"use client";

/* ================================================================
   Landing hero — headline plus a layered, perspective-tilted
   product vignette built from the real UI primitives (board,
   stage pills, intake analysis, margin gauge). No screenshots.
   ================================================================ */

import { motion, useReducedMotion } from "framer-motion";
import { moneyCompact, pct } from "@/lib/format";
import { EASE } from "@/lib/motion";
import type { Stage } from "@/lib/types";
import { Icon } from "@/components/ui/icons";
import { Badge, Progress, RiskBadge, StagePill } from "@/components/ui/primitives";
import { RingGauge } from "@/components/ui/charts";
import { DemoCta } from "@/components/shell/marketing-shell";
import { LinkButton } from "./shared";

const BOARD_COLUMNS: {
  stage: Stage;
  cards: { company: string; value: number; note: string; risk?: "medium" | "high" }[];
}[] = [
  {
    stage: "intake",
    cards: [
      {
        company: "Harbor & Fern",
        value: 14500,
        note: "CAC €31→€58 since Jan — same-day SLA",
        risk: "medium",
      },
    ],
  },
  {
    stage: "proposal_sent",
    cards: [
      {
        company: "Northgate Dental",
        value: 42000,
        note: "Viewed ×4 — pricing section, 6 min dwell",
      },
    ],
  },
  {
    stage: "negotiation",
    cards: [
      {
        company: "Veldt Cycles",
        value: 31000,
        note: "2 unpriced asks — phasing prepped for Thu",
        risk: "high",
      },
    ],
  },
];

const BOARD_KPIS = [
  { label: "Open pipeline", value: moneyCompact(171400) },
  { label: "Win rate", value: "42%" },
  { label: "Median to proposal", value: "2.1d" },
];

function BoardCard({
  company,
  value,
  note,
  risk,
}: {
  company: string;
  value: number;
  note: string;
  risk?: "medium" | "high";
}) {
  return (
    <div className="rounded-md border border-line bg-raised px-2.5 py-2 shadow-e1 transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11.5px] font-medium text-ink">{company}</span>
        <span className="tnum shrink-0 font-mono text-[10.5px] text-ink-mute">
          {moneyCompact(value)}
        </span>
      </div>
      <p className="mt-1 truncate text-[10px] leading-snug text-ink-faint">{note}</p>
      {risk && <RiskBadge level={risk} className="mt-1.5" />}
    </div>
  );
}

function HeroVisual({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.18 }}
      className="relative hidden pb-12 sm:block lg:pb-6"
      style={{ perspective: 1500 }}
    >
      <motion.div
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={{ rotateX: 9, rotateY: -11 }}
        whileHover={reduced ? undefined : { rotateX: 4, rotateY: -5 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative"
      >
        {/* layer 1 — the pipeline board */}
        <div className="panel-raised relative overflow-hidden shadow-e3">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="microlabel">Pipeline / board</span>
            <span className="flex items-center gap-1.5">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="microlabel">Live</span>
            </span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
            {BOARD_KPIS.map((k) => (
              <div key={k.label} className="px-4 py-2.5">
                <span className="microlabel block truncate">{k.label}</span>
                <p className="tnum mt-0.5 font-display text-[17px] font-medium tracking-tight">
                  {k.value}
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 p-4 pb-14">
            {BOARD_COLUMNS.map((col) => (
              <div key={col.stage}>
                <div className="mb-2 flex items-center justify-between gap-1">
                  <StagePill stage={col.stage} />
                  <span className="tnum font-mono text-[10px] text-ink-faint">
                    {col.cards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.cards.map((c) => (
                    <BoardCard key={c.company} {...c} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* layer 2 — intake analysis float */}
        <div
          className="absolute -bottom-9 -left-5 w-60"
          style={{ transform: "translateZ(70px)" }}
        >
          <div className="panel-raised px-3.5 py-3 shadow-e3 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-1.5">
              <Icon name="sparkle" size={12} className="text-accent" />
              <span className="microlabel">Intake analysis</span>
            </div>
            <p className="mt-2 text-[12px] font-medium text-ink">
              Harbor &amp; Fern — paid media + funnel
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Progress value={81} className="flex-1" />
              <span className="tnum shrink-0 font-mono text-[10.5px] text-ink-mute">
                81% conf
              </span>
            </div>
            <p className="mt-2 text-[10.5px] leading-snug text-ink-faint">
              4 gaps flagged · 3 clarifying questions drafted · budget signal €2.5–4k/mo
            </p>
          </div>
        </div>

        {/* layer 3 — margin guidance float */}
        <div
          className="absolute -top-7 -right-4 w-[232px]"
          style={{ transform: "translateZ(55px)" }}
        >
          <div className="panel-raised flex items-center gap-3 px-3.5 py-3 shadow-e3 transition-transform duration-200 hover:-translate-y-0.5">
            <RingGauge value={39.8} size={54} display={pct(39.8)} tone="ok" />
            <div className="min-w-0">
              <span className="microlabel">Margin guidance</span>
              <p className="mt-1 text-[11px] leading-snug text-ink-mute">
                Standard tier clears the <span className="tnum font-mono">35%</span> workspace
                floor
              </p>
            </div>
          </div>
        </div>

        {/* layer 4 — follow-up chip */}
        <div
          className="absolute right-6 -bottom-4 hidden w-[268px] lg:block"
          style={{ transform: "translateZ(90px)" }}
        >
          <div className="panel-raised flex items-center gap-2.5 px-3 py-2.5 shadow-e3 transition-transform duration-200 hover:-translate-y-0.5">
            <Icon name="eye" size={13} className="shrink-0 text-ink-faint" />
            <p className="min-w-0 flex-1 text-[10.5px] leading-snug text-ink-mute">
              Northgate re-read pricing <span className="tnum font-mono">×4</span> — nudge
              drafted
            </p>
            <Badge tone="warn">due today</Badge>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="blueprint blueprint-fade absolute inset-x-0 top-0 h-[580px]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10 lg:pt-24 lg:pb-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="microlabel"
          >
            Quote-to-scope OS · for agencies of 3–25
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.06 }}
            className="mt-3 font-display text-[33px] leading-[1.08] font-medium tracking-tight text-ink sm:text-[40px]"
          >
            Turn messy client requests into profitable scopes, proposals, and onboarding
            flows.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.12 }}
            className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-ink-mute"
          >
            Scopeforge reads the raw intake — an email, call notes, a 47-minute transcript —
            drafts the brief and the scope, prices three tiers against your margin floor, and
            arms the follow-ups at send. Reply in hours instead of days, hold margin above the
            floor, and catch scope creep before it ships free.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.18 }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <DemoCta>Book a demo</DemoCta>
            <LinkButton href="/dashboard">
              Explore the live demo
              <Icon name="arrow-up-right" size={13} />
            </LinkButton>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            {[
              "2.1d median to proposal",
              "39.4% avg margin held",
              "11 creep catches last quarter",
            ].map((s) => (
              <span
                key={s}
                className="tnum flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-ink-faint"
              >
                <span className="inline-block h-1 w-1 rounded-full bg-accent" />
                {s}
              </span>
            ))}
          </motion.div>
        </div>
        <HeroVisual reduced={!!reduced} />
      </div>
    </section>
  );
}
