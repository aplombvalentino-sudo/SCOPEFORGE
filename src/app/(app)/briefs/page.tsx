"use client";

/* ================================================================
   /briefs — the clarification queue (briefs blocked on client
   answers) followed by the full brief register with status tabs.
   ================================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { moneyCompact, timeAgo } from "@/lib/format";
import type { Brief, BriefStatus, Lead } from "@/lib/types";
import { itemVariants, listVariants } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { Badge, Button } from "@/components/ui/primitives";
import { PageHeader, PageTransition, Section } from "@/components/ui/page";
import { Tabs, type TabDef } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import {
  BRIEF_STATUS_LABELS,
  BRIEF_STATUS_TONE,
  unansweredCount,
} from "@/components/briefs/brief-meta";

type Filter = "all" | BriefStatus;

interface QueueEntry {
  brief: Brief;
  lead: Lead;
  blocking: Brief["openQuestions"];
}

export default function BriefsPage() {
  const router = useRouter();
  const briefs = useApp((s) => s.briefs);
  const leads = useApp((s) => s.leads);
  const [filter, setFilter] = useState<Filter>("all");

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  const queue = useMemo<QueueEntry[]>(
    () =>
      briefs
        .flatMap((brief) => {
          const lead = leadById.get(brief.leadId);
          if (!lead) return [];
          const blocking = brief.openQuestions.filter((q) => !q.answered);
          if (brief.status !== "needs_clarification" && blocking.length === 0) return [];
          return [{ brief, lead, blocking }];
        })
        .sort(
          (a, b) =>
            b.blocking.length - a.blocking.length ||
            +new Date(b.brief.updatedAt) - +new Date(a.brief.updatedAt)
        ),
    [briefs, leadById]
  );

  const counts = useMemo(() => {
    const c: Record<BriefStatus, number> = {
      draft: 0,
      needs_clarification: 0,
      confirmed: 0,
    };
    briefs.forEach((b) => c[b.status]++);
    return c;
  }, [briefs]);

  const tabs: TabDef<Filter>[] = [
    { value: "all", label: "All", count: briefs.length },
    { value: "draft", label: "Draft", count: counts.draft },
    {
      value: "needs_clarification",
      label: "Needs clarification",
      count: counts.needs_clarification,
    },
    { value: "confirmed", label: "Confirmed", count: counts.confirmed },
  ];

  const rows = useMemo(
    () =>
      briefs
        .filter((b) => filter === "all" || b.status === filter)
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [briefs, filter]
  );

  return (
    <PageTransition>
      <PageHeader
        overline="PIPELINE / BRIEFS"
        title="Briefs"
        description="Structured requirements distilled from intake — context, goals, constraints, and the questions still blocking scope. Confirm a brief to hand it to the scope engine."
      />

      {briefs.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="brief"
            title="No briefs yet"
            body="A brief turns raw intake — emails, call notes, transcripts — into requirements you can scope and price. Run intake analysis on a lead to draft its brief."
            action={
              <Button variant="primary" onClick={() => router.push("/leads")}>
                Open the pipeline
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {queue.length > 0 && (
            <Section
              title="Needs clarification"
              description={`${queue.length} brief${queue.length === 1 ? "" : "s"} blocked on client answers — resolve before scoping.`}
            >
              <motion.div
                variants={listVariants}
                initial="initial"
                animate="animate"
                className="grid gap-3 md:grid-cols-2"
              >
                {queue.map(({ brief, lead, blocking }) => (
                  <motion.div key={brief.id} variants={itemVariants}>
                    <Link
                      href={`/briefs/${brief.id}`}
                      className="group flex h-full flex-col rounded-lg border border-warn/30 border-l-2 border-l-warn/70 bg-surface px-4 py-3.5 transition-[border-color,box-shadow] duration-150 hover:border-warn/55 hover:shadow-e1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-display text-[15px] font-medium tracking-tight text-ink">
                            {lead.company}
                          </p>
                          <p className="tnum mt-0.5 truncate font-mono text-[11px] text-ink-faint">
                            {lead.projectType} · {moneyCompact(lead.value)} ·{" "}
                            {timeAgo(brief.updatedAt)}
                          </p>
                        </div>
                        <Badge tone="warn">{blocking.length} unanswered</Badge>
                      </div>

                      <ul className="mt-3 flex-1 space-y-1.5">
                        {blocking.map((q) => (
                          <li
                            key={q.id}
                            className="flex items-start gap-2 rounded-md bg-inset/60 px-2.5 py-1.5"
                          >
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-warn-soft font-mono text-[10px] font-semibold text-warn">
                              ?
                            </span>
                            <span className="text-[12.5px] leading-snug text-ink">
                              {q.question}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <span className="mt-3 inline-flex items-center gap-1 self-end text-[12.5px] font-medium text-accent">
                        Resolve
                        <Icon
                          name="arrow-right"
                          size={13}
                          className="transition-transform duration-150 group-hover:translate-x-0.5"
                        />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </Section>
          )}

          <Section
            title="All briefs"
            description="Everything captured from intake, in order of last touch."
          >
            <Tabs tabs={tabs} value={filter} onChange={setFilter} className="mb-3" />

            {rows.length === 0 ? (
              <div className="panel">
                <EmptyState
                  icon="filter"
                  title={`No ${BRIEF_STATUS_LABELS[filter as BriefStatus].toLowerCase()} briefs`}
                  body="Nothing matches this status right now. Clear the filter to see the full register."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setFilter("all")}>
                      Show all briefs
                    </Button>
                  }
                />
              </div>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Company</TH>
                    <TH>Project</TH>
                    <TH>Status</TH>
                    <TH numeric>Open questions</TH>
                    <TH numeric>Updated</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((brief) => {
                    const lead = leadById.get(brief.leadId);
                    const open = unansweredCount(brief);
                    return (
                      <TR
                        key={brief.id}
                        onClick={() => router.push(`/briefs/${brief.id}`)}
                      >
                        <TD>
                          <span className="font-medium text-ink">
                            {lead?.company ?? "—"}
                          </span>
                        </TD>
                        <TD>
                          <span className="text-ink-mute" title={lead?.summary}>
                            {lead?.projectType ?? "—"}
                          </span>
                        </TD>
                        <TD>
                          <Badge tone={BRIEF_STATUS_TONE[brief.status]}>
                            {BRIEF_STATUS_LABELS[brief.status]}
                          </Badge>
                        </TD>
                        <TD numeric>
                          {open > 0 ? (
                            <span className="text-warn">{open} open</span>
                          ) : (
                            <span className="text-ink-faint">
                              {brief.openQuestions.length === 0 ? "—" : "0 open"}
                            </span>
                          )}
                        </TD>
                        <TD numeric>
                          <span className="text-ink-faint">{timeAgo(brief.updatedAt)}</span>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Section>
        </>
      )}
    </PageTransition>
  );
}
