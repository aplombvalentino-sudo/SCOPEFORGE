"use client";

/* ================================================================
   Proposal turnaround — the funnel, the turnaround comparison,
   and in-view KPI count-ups from the workspace analytics.
   ================================================================ */

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { analytics } from "@/lib/demo-data";
import { moneyCompact, pct } from "@/lib/format";
import { EASE } from "@/lib/motion";
import { FunnelSteps } from "@/components/ui/charts";
import { KpiCard } from "@/components/ui/kpi";
import { MarketingSection, Reveal, VIEWPORT } from "./shared";

function TurnaroundBars() {
  const rows = [
    { label: "Scopeforge median", days: analytics.medianTurnaroundDays, accent: true },
    { label: "Industry median", days: analytics.industryTurnaroundDays, accent: false },
  ];
  const max = Math.max(...rows.map((r) => r.days));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-[12px] text-ink-mute">{r.label}</span>
          <div className="h-3.5 flex-1 overflow-hidden rounded-sm bg-inset">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(r.days / max) * 100}%` }}
              viewport={VIEWPORT}
              transition={{ duration: 0.7, ease: EASE }}
              className={r.accent ? "h-full rounded-sm bg-accent" : "h-full rounded-sm bg-line-strong"}
            />
          </div>
          <span className="tnum w-10 shrink-0 text-right font-mono text-[11.5px] text-ink">
            {r.days}d
          </span>
        </div>
      ))}
    </div>
  );
}

function KpiRow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {inView ? (
        <>
          <KpiCard
            label="Win rate (sent)"
            value={analytics.winRatePct}
            render={(v) => pct(v)}
            icon="target"
            delta="16 of 38 sent proposals"
          />
          <KpiCard
            label="Median to proposal"
            value={analytics.medianTurnaroundDays}
            render={(v) => `${v.toFixed(1)}d`}
            icon="clock"
            delta="vs 6.5d industry"
            deltaGood
          />
          <KpiCard
            label="Avg deal value"
            value={analytics.avgDealValue}
            render={(v) => moneyCompact(v)}
            icon="euro"
            delta="across 16 wins"
          />
          <KpiCard
            label="First response"
            value={analytics.responseTimeHours}
            render={(v) => `${v.toFixed(1)}h`}
            icon="zap"
            delta="inbound to first reply"
            deltaGood
          />
        </>
      ) : (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} aria-hidden className="panel h-[104px]" />
        ))
      )}
    </div>
  );
}

export function Turnaround() {
  return (
    <MarketingSection className="py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14">
        <Reveal className="order-2 lg:order-1">
          <div className="panel-raised px-5 py-5 shadow-e2">
            <div className="flex items-center justify-between">
              <span className="microlabel">Proposal funnel · Jan–Jun 2026</span>
              <span className="tnum font-mono text-[10.5px] text-ink-faint">
                ATELIER NORTH · 14 SEATS
              </span>
            </div>
            <FunnelSteps
              className="mt-4"
              steps={[
                { label: "Drafted", value: analytics.funnel.created },
                { label: "Sent", value: analytics.funnel.sent },
                { label: "Viewed", value: analytics.funnel.viewed },
                { label: "Won", value: analytics.funnel.accepted },
              ]}
            />
            <div className="mt-5 border-t border-line pt-4">
              <p className="microlabel mb-2.5">Intake → sent proposal</p>
              <TurnaroundBars />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08} className="order-1 lg:order-2">
          <p className="microlabel">Proposal turnaround</p>
          <h2 className="mt-2.5 font-display text-[26px] leading-[1.12] font-medium tracking-tight sm:text-[30px]">
            Proposals are assembled, not written.
          </h2>
          <p className="mt-3.5 max-w-lg text-[14px] leading-relaxed text-ink-mute">
            Executive summary, scope of work, exclusions, pricing — composed from the scope you
            already approved. Reorder sections, toggle them off, choose concise or detailed.
            The document inherits every number from the pricing model, so nothing is re-typed
            and nothing drifts.
          </p>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-mute">
            Send is when the system starts working for you: view tracking shows Northgate
            re-read the pricing section four times before the follow-up went out — and the
            follow-up referenced it, instead of “just checking in.”
          </p>
          <p className="tnum mt-5 font-mono text-[11px] tracking-wide text-ink-faint">
            42 DRAFTED → 16 WON · 42% WIN RATE ON SENT · EXPIRY DATES ENFORCED
          </p>
        </Reveal>
      </div>
      <div className="mt-12">
        <KpiRow />
      </div>
    </MarketingSection>
  );
}
