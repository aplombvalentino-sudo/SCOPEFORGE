"use client";

/* /onboarding/[id] — single kickoff flow: welcome note, ring progress,
   five task lanes, asset/stakeholder rail, and the first-14-days plan. */

import { useParams, useRouter } from "next/navigation";
import { DEMO_NOW, fullDate } from "@/lib/format";
import { useApp } from "@/lib/store";
import { AssetRequestsCard, StakeholderMapCard } from "@/components/delivery/onboarding-rail";
import { PlanTimeline } from "@/components/delivery/plan-timeline";
import { TaskBoard } from "@/components/delivery/task-board";
import { RingGauge } from "@/components/ui/charts";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { PageHeader, PageTransition, Section } from "@/components/ui/page";
import { Badge, Button } from "@/components/ui/primitives";

export default function OnboardingFlowPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const flow = useApp((s) => s.onboardingFlows).find((f) => f.id === params.id);

  if (!flow) {
    return (
      <PageTransition>
        <div className="panel">
          <EmptyState
            icon="onboarding"
            title="This onboarding flow doesn't exist"
            body="The id in the URL doesn't match any flow in this workspace — it may have been archived, or the link is stale."
            action={
              <Button variant="primary" onClick={() => router.push("/onboarding")}>
                Back to onboarding
              </Button>
            }
          />
        </div>
      </PageTransition>
    );
  }

  const total = flow.tasks.length;
  const done = flow.tasks.filter((t) => t.done).length;
  const pctDone = total === 0 ? 0 : (done / total) * 100;
  const complete = total > 0 && done === total;
  const clientOpen = flow.tasks.filter((t) => t.group === "client" && !t.done).length;
  const daysSinceKickoff = Math.max(
    0,
    Math.round((DEMO_NOW.getTime() - new Date(flow.kickoffDate).getTime()) / 86400000)
  );

  const exportPack = () => {
    toast.success(
      "Welcome pack exported — PDF + checklist",
      `${flow.clientName} pack rendered with the live task list and the 14-day plan.`
    );
  };

  return (
    <PageTransition>
      <PageHeader
        overline={`DELIVERY / ONBOARDING / ${flow.id.toUpperCase()}`}
        title={flow.clientName}
        description={`${flow.projectName} · Kickoff ${fullDate(flow.kickoffDate)}`}
        actions={
          <>
            <Button variant="secondary" onClick={exportPack}>
              <Icon name="download" size={14} />
              Export welcome pack
            </Button>
            <Button variant="ghost" onClick={() => router.push(`/leads/${flow.leadId}`)}>
              <Icon name="external" size={13} />
              Open lead
            </Button>
          </>
        }
      />

      {/* welcome note + progress band */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="well flex-1 px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <p className="microlabel">Welcome note — visible to the client</p>
            {complete && <Badge tone="ok">Delivered</Badge>}
          </div>
          <p className="text-[13.5px] leading-relaxed text-ink-mute italic">
            “{flow.welcomeNote}”
          </p>
        </div>
        <div className="panel flex shrink-0 items-center gap-5 px-5 py-4">
          <RingGauge
            value={pctDone}
            tone={complete ? "ok" : "accent"}
            label="Complete"
            size={84}
          />
          <dl className="space-y-2.5">
            <div>
              <dt className="microlabel">Tasks closed</dt>
              <dd className="tnum mt-0.5 font-mono text-[13px] text-ink">
                {done}/{total}
              </dd>
            </div>
            <div>
              <dt className="microlabel">Client-owed open</dt>
              <dd
                className={`tnum mt-0.5 font-mono text-[13px] ${clientOpen > 0 ? "text-warn" : "text-ink"}`}
              >
                {clientOpen}
              </dd>
            </div>
            <div>
              <dt className="microlabel">Since kickoff</dt>
              <dd className="tnum mt-0.5 font-mono text-[13px] text-ink">
                D+{daysSinceKickoff}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* task board + rail */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <TaskBoard flow={flow} />
        <div className="space-y-3">
          <AssetRequestsCard flow={flow} />
          <StakeholderMapCard flow={flow} />
        </div>
      </div>

      {/* 14-day plan */}
      <Section
        title="First 14 days"
        description="The plan issued at kickoff — day-anchored, nothing left to 'we'll see'."
        className="mt-6"
      >
        <div className="panel px-4 py-4">
          <PlanTimeline plan={flow.planFirst14Days} />
        </div>
      </Section>
    </PageTransition>
  );
}
