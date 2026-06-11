"use client";

/* ================================================================
   /dashboard — the Atelier North command center.
   Asymmetric 12-col grid: KPI band, action queue + risk rail,
   then pipeline / monthly flow / live activity.
   ================================================================ */

import Link from "next/link";
import { useApp } from "@/lib/store";
import { analytics } from "@/lib/demo-data";
import { DEMO_NOW, money, moneyCompact } from "@/lib/format";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { KpiCard } from "@/components/ui/kpi";
import { FunnelSteps, MiniBars } from "@/components/ui/charts";
import { Timeline } from "@/components/ui/timeline";
import { Icon } from "@/components/ui/icons";
import { AttentionQueue } from "@/components/dashboard/attention-queue";
import { ScopeRiskPanel } from "@/components/dashboard/scope-risk-panel";
import { PipelineStageBar } from "@/components/dashboard/pipeline-stage-bar";
import { DashPanel } from "@/components/dashboard/panel";

const ghostLink =
  "group flex items-center gap-1 rounded-sm px-1.5 py-1 text-[12px] font-medium text-ink-mute transition-colors duration-150 hover:text-accent";

const weekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const dayMonthFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export default function DashboardPage() {
  const leads = useApp((s) => s.leads);
  const proposals = useApp((s) => s.proposals);
  const followUps = useApp((s) => s.followUps);
  const activity = useApp((s) => s.activity);

  const todayKey = DEMO_NOW.toISOString().slice(0, 10);

  /* ---- KPI computations ---- */
  const openLeads = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const openPipeline = openLeads.reduce((sum, l) => sum + l.value, 0);

  const awaiting = proposals.filter((p) => p.status === "sent" || p.status === "viewed");
  const awaitingValue = awaiting.reduce((sum, p) => sum + p.amount, 0);

  const dueFollowUps = followUps.filter(
    (f) =>
      (f.status === "due" || f.status === "scheduled") && f.dueAt.slice(0, 10) <= todayKey
  );
  const nextDue = [...dueFollowUps].sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const nextDueCompany = nextDue
    ? (leads.find((l) => l.id === nextDue.leadId)?.company ?? "lead")
    : null;
  const nextDueTime = nextDue
    ? `${String(new Date(nextDue.dueAt).getUTCHours()).padStart(2, "0")}:00`
    : null;

  const turnaroundEdge = analytics.industryTurnaroundDays - analytics.medianTurnaroundDays;

  /* ---- operational status line ---- */
  const beingReread = proposals.filter((p) => p.status === "viewed").length;
  const awaitingAnalysis = leads.filter(
    (l) => l.stage === "intake" && !l.intakeAnalysis
  ).length;
  const statusParts: string[] = [];
  if (dueFollowUps.length > 0)
    statusParts.push(`${plural(dueFollowUps.length, "follow-up", "follow-ups")} due today`);
  if (beingReread > 0)
    statusParts.push(`${plural(beingReread, "proposal", "proposals")} being re-read`);
  if (awaitingAnalysis > 0)
    statusParts.push(`${plural(awaitingAnalysis, "intake", "intakes")} awaiting analysis`);
  const statusLine =
    statusParts.length > 0
      ? `Good morning, Maya — ${statusParts.join(", ")}.`
      : "Good morning, Maya — nothing is due today. The pipeline is quiet.";

  /* ---- monthly flow ---- */
  const monthlySent = analytics.monthly.reduce((sum, m) => sum + m.sent, 0);
  const monthlyWon = analytics.monthly.reduce((sum, m) => sum + m.won, 0);
  const monthlyValue = analytics.monthly.reduce((sum, m) => sum + m.value, 0);

  return (
    <PageTransition>
      <PageHeader
        overline="WORKSPACE / ATELIER NORTH"
        title={`${weekdayFmt.format(DEMO_NOW)}, ${dayMonthFmt.format(DEMO_NOW)}`}
        description={statusLine}
      />

      {/* ---- KPI band ---- */}
      <div className="grid grid-cols-12 gap-4">
        <KpiCard
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          label="Open pipeline"
          value={openPipeline}
          render={(v) => money(v)}
          icon="euro"
          delta={`across ${plural(openLeads.length, "open lead", "open leads")}`}
        />
        <KpiCard
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          label="Awaiting decision"
          value={awaitingValue}
          render={(v) => money(v)}
          icon="send"
          delta={`${plural(awaiting.length, "proposal", "proposals")} with clients`}
        />
        <KpiCard
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          label="Follow-ups due"
          value={dueFollowUps.length}
          icon="follow-up"
          delta={
            nextDue ? `next: ${nextDueCompany} at ${nextDueTime}` : "nothing in the queue"
          }
        />
        <KpiCard
          className="col-span-12 sm:col-span-6 xl:col-span-3"
          label="Median turnaround"
          value={analytics.medianTurnaroundDays}
          render={(v) => `${v.toFixed(1)}d`}
          icon="clock"
          delta={`−${turnaroundEdge.toFixed(1)}d vs industry ${analytics.industryTurnaroundDays}d`}
          deltaGood
        />
      </div>

      {/* ---- action queue + right rail ---- */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-8">
          <AttentionQueue />
        </div>
        <div className="col-span-12 flex flex-col gap-4 xl:col-span-4">
          <ScopeRiskPanel />
          <DashPanel
            title="Proposal funnel"
            caption={`Win rate ${analytics.winRatePct}% · trailing 6 months`}
          >
            <FunnelSteps
              steps={[
                { label: "Created", value: analytics.funnel.created },
                { label: "Sent", value: analytics.funnel.sent },
                { label: "Viewed", value: analytics.funnel.viewed },
                { label: "Accepted", value: analytics.funnel.accepted },
              ]}
            />
          </DashPanel>
        </div>
      </div>

      {/* ---- pipeline / monthly / activity band ---- */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6 xl:col-span-5">
          <PipelineStageBar />
        </div>
        <div className="col-span-12 lg:col-span-6 xl:col-span-3">
          <DashPanel
            title="Proposals · Jan–Jun"
            caption={`${monthlyWon} won of ${monthlySent} sent · ${moneyCompact(monthlyValue)} proposed`}
            className="h-full"
            action={
              <Link href="/analytics" className={ghostLink}>
                Analytics
                <Icon
                  name="arrow-up-right"
                  size={11}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            }
          >
            <MiniBars
              data={analytics.monthly.map((m) => m.value)}
              labels={analytics.monthly.map((m) => m.month)}
              formatValue={moneyCompact}
              height={132}
              className="pt-2"
            />
          </DashPanel>
        </div>
        <div className="col-span-12 xl:col-span-4">
          <DashPanel
            title="Recent activity"
            caption="Last 7 events across the workspace"
            bodyClassName="px-4 pt-2 pb-3"
            className="h-full"
            action={
              <Link href="/activity" className={ghostLink}>
                View all activity
                <Icon
                  name="arrow-right"
                  size={11}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            }
          >
            <Timeline events={activity} limit={7} />
          </DashPanel>
        </div>
      </div>
    </PageTransition>
  );
}
