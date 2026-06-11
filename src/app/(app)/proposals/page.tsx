"use client";

/* /proposals — every client document from draft to decision. */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { isOpenStatus } from "@/components/proposals/meta";
import {
  ProposalStatusBadge,
  ValidUntilChip,
} from "@/components/proposals/status-badge";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { KpiCard } from "@/components/ui/kpi";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Button } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Tabs, type TabDef } from "@/components/ui/tabs";
import { analytics } from "@/lib/demo-data";
import { money, pct, shortDate } from "@/lib/format";
import { DUR, EASE, itemVariants, listVariants } from "@/lib/motion";
import { useApp } from "@/lib/store";
import type { Proposal } from "@/lib/types";

type TabValue = "all" | "draft" | "sent" | "viewed" | "accepted" | "declined";

function matchesTab(p: Proposal, tab: TabValue): boolean {
  if (tab === "all") return true;
  if (tab === "draft") return p.status === "draft" || p.status === "internal_review";
  return p.status === tab;
}

const TAB_EMPTY_COPY: Record<Exclude<TabValue, "all">, { title: string; body: string }> = {
  draft: {
    title: "No drafts in progress",
    body: "Drafts appear here the moment a scope is turned into a document — nothing is waiting on a writer right now.",
  },
  sent: {
    title: "Nothing out for review",
    body: "No proposal is sitting unopened in a client inbox. Documents move here the moment you hit send.",
  },
  viewed: {
    title: "No live reads",
    body: "View tracking lights up this tab when a client opens their link — dwell time and read counts land on the document.",
  },
  accepted: {
    title: "No acceptances in this view",
    body: "Signed documents collect here, ready to hand off to onboarding.",
  },
  declined: {
    title: "No declined proposals",
    body: "When a client passes, the document lands here for the win/loss review — reasons and re-engagement notes included.",
  },
};

export default function ProposalsPage() {
  const router = useRouter();
  const proposals = useApp((s) => s.proposals);
  const leads = useApp((s) => s.leads);
  const [tab, setTab] = useState<TabValue>("all");

  const leadById = useMemo(
    () => Object.fromEntries(leads.map((l) => [l.id, l])),
    [leads]
  );

  /* ---- KPI computations ---- */
  const awaiting = proposals.filter(
    (p) => p.status === "sent" || p.status === "viewed"
  );
  const awaitingSum = awaiting.reduce((acc, p) => acc + p.amount, 0);

  const decisionDays = proposals
    .filter((p) => p.sentAt && p.decidedAt)
    .map((p) =>
      Math.max(
        0,
        Math.round(
          (new Date(p.decidedAt as string).getTime() -
            new Date(p.sentAt as string).getTime()) /
            86400000
        )
      )
    )
    .sort((a, b) => a - b);
  const medianDecision =
    decisionDays.length === 0
      ? 0
      : decisionDays.length % 2 === 1
        ? decisionDays[(decisionDays.length - 1) / 2]
        : (decisionDays[decisionDays.length / 2 - 1] +
            decisionDays[decisionDays.length / 2]) /
          2;

  /* ---- tabs ---- */
  const tabs: TabDef<TabValue>[] = (
    ["all", "draft", "sent", "viewed", "accepted", "declined"] as TabValue[]
  ).map((value) => ({
    value,
    label: value === "all" ? "All" : value[0].toUpperCase() + value.slice(1),
    count: proposals.filter((p) => matchesTab(p, value)).length,
  }));

  const rows = proposals
    .filter((p) => matchesTab(p, tab))
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  return (
    <PageTransition>
      <PageHeader
        overline="BUILD / PROPOSALS"
        title="Proposals"
        description="Every client document from draft to decision — amounts follow the pricing tier, view tracking shows who is actually reading."
      />

      {/* KPI band */}
      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="mb-5 grid gap-3 md:grid-cols-3"
      >
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Awaiting decision"
            value={awaitingSum}
            render={(v) => money(v)}
            icon="clock"
            delta={`${awaiting.length} proposal${awaiting.length === 1 ? "" : "s"} in market`}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Acceptance rate"
            value={analytics.winRatePct}
            render={(v) => pct(v)}
            icon="target"
            delta={`${analytics.funnel.accepted} of ${analytics.funnel.sent} sent in 2026`}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard
            label="Median days to decision"
            value={medianDecision}
            render={(v) => `${Math.round(v)}d`}
            icon="calendar"
            delta={`across ${decisionDays.length} decided this year`}
          />
        </motion.div>
      </motion.div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-4" />

      {rows.length === 0 ? (
        <div className="panel">
          {tab === "all" ? (
            <EmptyState
              icon="proposal"
              title="No proposals yet"
              body="Proposals are assembled from approved scopes — sections, pricing tiers, and payment schedule come along automatically."
              action={
                <Button variant="secondary" size="sm" onClick={() => router.push("/scopes")}>
                  Open scopes
                  <Icon name="arrow-right" size={13} />
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="proposal"
              title={TAB_EMPTY_COPY[tab].title}
              body={TAB_EMPTY_COPY[tab].body}
              action={
                <Button variant="secondary" size="sm" onClick={() => setTab("all")}>
                  Show all proposals
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <Table key={tab}>
          <THead>
            <tr>
              <TH>Proposal</TH>
              <TH numeric>Amount</TH>
              <TH>Status</TH>
              <TH>Sent</TH>
              <TH>Valid until</TH>
              <TH aria-label="Open" />
            </tr>
          </THead>
          <TBody>
            {rows.map((p, i) => {
              const lead = leadById[p.leadId];
              return (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.base, ease: EASE, delay: 0.035 * i }}
                  onClick={() => router.push(`/proposals/${p.id}`)}
                  className="group cursor-pointer transition-colors duration-100 hover:bg-overlay/70"
                >
                  <TD>
                    <div className="max-w-[420px] min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {p.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-faint">
                        {lead
                          ? `${lead.company} · ${lead.contact.name}`
                          : "Unlinked lead"}
                      </p>
                    </div>
                  </TD>
                  <TD numeric>{money(p.amount)}</TD>
                  <TD>
                    <ProposalStatusBadge status={p.status} views={p.views} />
                  </TD>
                  <TD>
                    <span className="tnum font-mono text-[12px] text-ink-mute">
                      {p.sentAt ? shortDate(p.sentAt) : "—"}
                    </span>
                  </TD>
                  <TD>
                    {isOpenStatus(p.status) ? (
                      <ValidUntilChip iso={p.validUntil} />
                    ) : (
                      <span className="tnum font-mono text-[12px] text-ink-faint">
                        {shortDate(p.validUntil)}
                      </span>
                    )}
                  </TD>
                  <TD className="w-8">
                    <Icon
                      name="chevron-right"
                      size={14}
                      className="text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5"
                    />
                  </TD>
                </motion.tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </PageTransition>
  );
}
