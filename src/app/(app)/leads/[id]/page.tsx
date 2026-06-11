"use client";

/* /leads/[id] — the lead workspace: header, stage stepper, overview / intake / activity. */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { teamById } from "@/lib/demo-data";
import { money } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { IntakeTab } from "@/components/leads/intake-tab";
import { LeadRail } from "@/components/leads/lead-rail";
import { OverviewTab } from "@/components/leads/overview-tab";
import { StageStepper } from "@/components/leads/stage-stepper";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Avatar, Badge, Button, RiskBadge, StagePill } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/tabs";
import { Timeline } from "@/components/ui/timeline";

type TabValue = "overview" | "intake" | "activity";

export default function LeadWorkspacePage() {
  const params = useParams<{ id: string }>();
  const lead = useApp((s) => s.leads.find((l) => l.id === params.id));
  const activity = useApp((s) => s.activity);

  const [tab, setTab] = useState<TabValue>("overview");
  const [autoTabbed, setAutoTabbed] = useState(false);

  // Fresh imports land straight on the intake tab — that's where the action is.
  useEffect(() => {
    if (!autoTabbed && lead && !lead.intakeAnalysis && lead.rawIntake) {
      setTab("intake");
      setAutoTabbed(true);
    }
  }, [autoTabbed, lead]);

  const leadActivity = useMemo(
    () => activity.filter((ev) => ev.leadId === params.id),
    [activity, params.id]
  );

  if (!lead) {
    return (
      <PageTransition>
        <PageHeader overline="PIPELINE / LEADS" title="Lead workspace" />
        <div className="panel">
          <EmptyState
            icon="leads"
            title="This lead doesn't exist"
            body="The id in the URL doesn't match anything in the pipeline — it may have been removed, or the link is stale."
            action={
              <Link href="/leads">
                <Button variant="secondary">
                  <Icon name="chevron-left" size={13} />
                  Back to leads
                </Button>
              </Link>
            }
          />
        </div>
      </PageTransition>
    );
  }

  const owner = teamById[lead.ownerId];

  return (
    <PageTransition>
      <PageHeader
        overline="PIPELINE / LEADS"
        title={lead.company}
        description={lead.projectType}
        actions={
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="microlabel">est. value</p>
              <p className="tnum font-display text-[22px] leading-tight font-medium tracking-tight text-ink">
                {lead.value > 0 ? money(lead.value) : "—"}
              </p>
            </div>
            {owner && (
              <>
                <span aria-hidden className="h-9 w-px bg-line" />
                <div className="flex items-center gap-2.5">
                  <Avatar initials={owner.initials} size={30} title={owner.name} />
                  <div className="hidden sm:block">
                    <p className="text-[12.5px] font-medium text-ink">{owner.name}</p>
                    <p className="text-[11px] text-ink-faint">{owner.role}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        }
      />

      {/* meta row */}
      <div className="-mt-2 mb-4 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <StagePill stage={lead.stage} />
        <RiskBadge level={lead.risk} />
        {lead.riskNote && (
          <span
            title={lead.riskNote}
            className="flex max-w-xl min-w-0 items-center gap-1.5 text-[12px] text-ink-faint"
          >
            <Icon name="alert-triangle" size={11} className="shrink-0 text-warn" />
            <span className="truncate">{lead.riskNote}</span>
          </span>
        )}
        <span aria-hidden className="hidden h-3.5 w-px bg-line sm:block" />
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-mute">
          <Icon name="mail" size={11} className="text-ink-faint" />
          {lead.contact.email || lead.contact.name}
          <span className="text-ink-faint">· {lead.contact.role}</span>
        </span>
        {lead.tags.length > 0 && (
          <span className="flex items-center gap-1.5">
            {lead.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
          </span>
        )}
      </div>

      <StageStepper lead={lead} />

      <Tabs<TabValue>
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "intake", label: "Intake" },
          { value: "activity", label: "Activity", count: leadActivity.length },
        ]}
        value={tab}
        onChange={setTab}
        className="mb-5"
      />

      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: DUR.fast, ease: EASE }}
            >
              {tab === "overview" && <OverviewTab lead={lead} />}
              {tab === "intake" && <IntakeTab lead={lead} />}
              {tab === "activity" &&
                (leadActivity.length > 0 ? (
                  <div className="panel px-4 py-3">
                    <Timeline events={leadActivity} />
                  </div>
                ) : (
                  <div className="panel">
                    <EmptyState
                      icon="activity"
                      title="No activity yet"
                      body="Stage changes, analysis runs, proposal views, and follow-ups for this lead will collect here as they happen."
                    />
                  </div>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <LeadRail lead={lead} />
      </div>
    </PageTransition>
  );
}
