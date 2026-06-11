"use client";

/* ================================================================
   /analytics — commercial performance: funnel, turnaround,
   margins, scope-creep recovery. Reads analytics aggregates
   plus live pipeline composition from the store.
   ================================================================ */

import Link from "next/link";
import { useApp } from "@/lib/store";
import { analytics } from "@/lib/demo-data";
import { money, moneyCompact, pct } from "@/lib/format";
import { STAGE_LABELS, STAGE_ORDER, type Stage } from "@/lib/types";
import { PageHeader, PageTransition, Section } from "@/components/ui/page";
import { KpiCard } from "@/components/ui/kpi";
import { BarRow, FunnelSteps, MiniBars, RingGauge } from "@/components/ui/charts";
import { Icon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default function AnalyticsPage() {
  const leads = useApp((s) => s.leads);

  const openLeads = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const byStage = STAGE_ORDER.filter((s) => s !== "won" && s !== "lost")
    .map((stage) => ({
      stage,
      count: openLeads.filter((l) => l.stage === stage).length,
      value: openLeads
        .filter((l) => l.stage === stage)
        .reduce((sum, l) => sum + l.value, 0),
    }))
    .filter((row) => row.count > 0);
  const maxStageValue = Math.max(...byStage.map((r) => r.value), 1);

  const sentTotal = analytics.monthly.reduce((s, m) => s + m.sent, 0);
  const wonTotal = analytics.monthly.reduce((s, m) => s + m.won, 0);

  return (
    <PageTransition>
      <PageHeader
        overline="INSIGHT / ANALYTICS"
        title="Commercial performance"
        description="How fast you respond, how often you win, and what each service line actually earns. Trailing six months unless noted."
      />

      {/* KPI band */}
      <div className="grid grid-cols-12 gap-4">
        <KpiCard
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          label="Win rate"
          value={analytics.winRatePct}
          render={(v) => `${Math.round(v)}%`}
          icon="target"
          delta={`${analytics.funnel.accepted} won of ${analytics.funnel.sent} sent`}
        />
        <KpiCard
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          label="Median turnaround"
          value={analytics.medianTurnaroundDays}
          render={(v) => `${v.toFixed(1)}d`}
          icon="clock"
          delta={`industry median ${analytics.industryTurnaroundDays}d`}
          deltaGood
        />
        <KpiCard
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          label="Average margin"
          value={analytics.avgMarginPct}
          render={(v) => `${v.toFixed(1)}%`}
          icon="shield"
          delta={`floor ${analytics.marginFloorPct}% — no breach in 6 months`}
          deltaGood
        />
        <KpiCard
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          label="Average deal"
          value={analytics.avgDealValue}
          render={(v) => moneyCompact(v)}
          icon="euro"
          delta={`first response ${analytics.responseTimeHours}h median`}
        />
      </div>

      <div className="mt-6 grid grid-cols-12 gap-4">
        {/* Funnel */}
        <div className="panel col-span-12 p-5 lg:col-span-5">
          <Section
            title="Proposal funnel"
            description="Created → accepted, trailing 6 months. Percentages are step conversion."
            className="!mb-0"
          >
            <FunnelSteps
              className="mt-4"
              steps={[
                { label: "Created", value: analytics.funnel.created },
                { label: "Sent", value: analytics.funnel.sent },
                { label: "Viewed", value: analytics.funnel.viewed },
                { label: "Accepted", value: analytics.funnel.accepted },
              ]}
            />
            <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-relaxed text-ink-mute">
              The created→sent gap is 4 stalled drafts — proposals that died in
              internal review. The biggest lever remains view→accept:{" "}
              <span className="text-ink">
                proposals followed up within 48h of a view close at nearly twice the rate
              </span>{" "}
              of those left alone.
            </p>
          </Section>
        </div>

        {/* Monthly flow */}
        <div className="panel col-span-12 p-5 lg:col-span-7">
          <Section
            title="Monthly proposal flow"
            description={`${wonTotal} won of ${sentTotal} sent · ${moneyCompact(
              analytics.monthly.reduce((s, m) => s + m.value, 0)
            )} proposed`}
            className="!mb-0"
          >
            <MiniBars
              className="mt-3"
              height={120}
              data={analytics.monthly.map((m) => m.value)}
              labels={analytics.monthly.map((m) => m.month)}
              formatValue={moneyCompact}
            />
            <div className="mt-4 overflow-hidden rounded-md border border-line">
              <table className="w-full text-[12.5px]">
                <thead className="border-b border-line bg-inset/60">
                  <tr>
                    <th className="microlabel px-3 py-2 text-left font-medium">Month</th>
                    <th className="microlabel px-3 py-2 text-right font-medium">Sent</th>
                    <th className="microlabel px-3 py-2 text-right font-medium">Won</th>
                    <th className="microlabel px-3 py-2 text-right font-medium">Win %</th>
                    <th className="microlabel px-3 py-2 text-right font-medium">Proposed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {analytics.monthly.map((m) => (
                    <tr key={m.month}>
                      <td className="px-3 py-1.5 text-ink-mute">{m.month} 2026</td>
                      <td className="tnum px-3 py-1.5 text-right font-mono">{m.sent}</td>
                      <td className="tnum px-3 py-1.5 text-right font-mono">{m.won}</td>
                      <td className="tnum px-3 py-1.5 text-right font-mono">
                        {Math.round((m.won / m.sent) * 100)}%
                      </td>
                      <td className="tnum px-3 py-1.5 text-right font-mono">
                        {moneyCompact(m.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        {/* Margin by service */}
        <div className="panel col-span-12 p-5 lg:col-span-7">
          <Section
            title="Margin by service line"
            description={`Realized margin vs the ${analytics.marginFloorPct}% workspace floor.`}
            className="!mb-0"
          >
            <div className="mt-4 space-y-3">
              {analytics.marginByService.map((row) => (
                <BarRow
                  key={row.service}
                  label={row.service}
                  value={row.marginPct}
                  max={50}
                  display={pct(row.marginPct)}
                  tone={row.marginPct >= 40 ? "accent" : row.marginPct >= analytics.marginFloorPct ? "warn" : "danger"}
                />
              ))}
            </div>
            <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-relaxed text-ink-mute">
              Brand identity runs closest to the floor at 37% — multi-approver revision
              cycles are the drag. The decision-process clause now standard in identity
              proposals exists to fix exactly this.
            </p>
          </Section>
        </div>

        {/* Scope creep recovery */}
        <div className="panel col-span-12 flex flex-col p-5 lg:col-span-5">
          <Section
            title="Scope-creep recovery"
            description="Out-of-scope requests caught and converted to paid change orders."
            className="!mb-0"
          >
            <div className="mt-4 flex items-center gap-5">
              <RingGauge
                value={(analytics.scopeCreepCaught / 14) * 100}
                display={`${analytics.scopeCreepCaught}`}
                label="caught YTD"
                tone="ok"
              />
              <div>
                <p className="tnum font-display text-[24px] font-medium tracking-tight">
                  {money(analytics.scopeCreepRecoveredValue)}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-mute">
                  recovered as paid change orders
                </p>
                <Badge tone="ok" className="mt-2">
                  <Icon name="shield" size={10} /> margin protected
                </Badge>
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-relaxed text-ink-mute">
              Every &ldquo;quick addition&rdquo; classified against the signed scope before
              anyone builds it. 3 requests were in-scope and done free — goodwill,
              chosen deliberately, not absorbed silently.
            </p>
            <Link
              href="/change-orders"
              className="group mt-auto inline-flex items-center gap-1 pt-3 text-[12.5px] font-medium text-accent"
            >
              Open change orders
              <Icon name="arrow-right" size={12} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </Section>
        </div>

        {/* Live pipeline composition */}
        <div className="col-span-12">
          <Section
            title="Open pipeline composition"
            description="Live — reflects current lead stages in this workspace."
          >
            <Table>
              <THead>
                <tr>
                  <TH>Stage</TH>
                  <TH numeric>Leads</TH>
                  <TH numeric>Value</TH>
                  <TH>Share of pipeline</TH>
                </tr>
              </THead>
              <TBody>
                {byStage.map((row) => (
                  <TR key={row.stage}>
                    <TD>
                      <span className="text-[13px] font-medium">
                        {STAGE_LABELS[row.stage as Stage]}
                      </span>
                    </TD>
                    <TD numeric>{row.count}</TD>
                    <TD numeric>{money(row.value)}</TD>
                    <TD className="w-2/5">
                      <div className="h-3.5 w-full overflow-hidden rounded-sm bg-inset">
                        <div
                          className="h-full rounded-sm bg-accent/70"
                          style={{ width: `${(row.value / maxStageValue) * 100}%` }}
                        />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Section>
        </div>
      </div>
    </PageTransition>
  );
}
