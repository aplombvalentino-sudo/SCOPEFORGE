"use client";

/* ================================================================
   /scopes — every scope document with status, effort, timeline,
   and the risk picture. Row click opens the scope builder.
   ================================================================ */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import type { RiskLevel, ScopeStatus } from "@/lib/types";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Tabs, type TabDef } from "@/components/ui/tabs";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";
import { Button, RiskBadge } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { ScopeStatusBadge, SCOPE_STATUS_LABELS } from "@/components/scopes/scope-status";

const RISK_ORDER: RiskLevel[] = ["high", "medium", "low"];

type Filter = "all" | ScopeStatus;

export default function ScopesPage() {
  const router = useRouter();
  const scopes = useApp((s) => s.scopes);
  const leads = useApp((s) => s.leads);
  const [filter, setFilter] = useState<Filter>("all");

  const leadById = useMemo(
    () => new Map(leads.map((l) => [l.id, l])),
    [leads]
  );

  const counts = useMemo(() => {
    const c: Record<ScopeStatus, number> = { draft: 0, in_review: 0, approved: 0 };
    for (const sc of scopes) c[sc.status] += 1;
    return c;
  }, [scopes]);

  const filtered = filter === "all" ? scopes : scopes.filter((sc) => sc.status === filter);

  const filterTabs: TabDef<Filter>[] = [
    { value: "all", label: "All", count: scopes.length },
    { value: "draft", label: "Draft", count: counts.draft },
    { value: "in_review", label: "In review", count: counts.in_review },
    { value: "approved", label: "Approved", count: counts.approved },
  ];

  return (
    <PageTransition>
      <PageHeader
        overline="BUILD / SCOPES"
        title="Scopes"
        description="Scope is the contract before the contract — deliverables, exclusions, and the revision line."
      />

      <Tabs tabs={filterTabs} value={filter} onChange={setFilter} className="mb-4" />

      {scopes.length === 0 ? (
        <EmptyState
          icon="scope"
          title="No scopes yet"
          body="Scope is where a confirmed brief becomes commitments: deliverables with effort, explicit exclusions, and a revision line the client signs. Build the first one from a brief."
          action={
            <Button variant="primary" size="sm" onClick={() => router.push("/briefs")}>
              Go to briefs
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="filter"
          title={`No ${SCOPE_STATUS_LABELS[filter as ScopeStatus].toLowerCase()} scopes`}
          body="Nothing in this state right now — scopes move draft → in review → approved from the builder header."
          action={
            <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
              Show all scopes
            </Button>
          }
        />
      ) : (
        <motion.div variants={listVariants} initial="initial" animate="animate">
          <Table>
            <THead>
              <tr>
                <TH>Company / Project</TH>
                <TH>Status</TH>
                <TH numeric>Deliverables</TH>
                <TH numeric>Timeline</TH>
                <TH>Risk flags</TH>
                <TH>Updated</TH>
              </tr>
            </THead>
            <TBody>
              {filtered.map((sc) => {
                const lead = leadById.get(sc.leadId);
                const worst = RISK_ORDER.find((lv) =>
                  sc.riskFlags.some((rf) => rf.level === lv)
                );
                return (
                  <motion.tr
                    key={sc.id}
                    variants={itemVariants}
                    onClick={() => router.push(`/scopes/${sc.id}`)}
                    className="cursor-pointer transition-colors duration-100 hover:bg-overlay/70"
                  >
                    <TD>
                      <p className="text-[13px] font-medium text-ink">
                        {lead?.company ?? sc.leadId}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-mute">
                        {lead?.projectType ?? "Unlinked lead"}
                      </p>
                    </TD>
                    <TD>
                      <ScopeStatusBadge status={sc.status} />
                    </TD>
                    <TD numeric>{sc.deliverables.length}</TD>
                    <TD numeric>{sc.timelineWeeks} wks</TD>
                    <TD>
                      {worst ? (
                        <span className="flex items-center gap-1.5">
                          <RiskBadge level={worst} />
                          {sc.riskFlags.length > 1 && (
                            <span
                              className="tnum font-mono text-[11px] text-ink-faint"
                              title={`${sc.riskFlags.length} flags total`}
                            >
                              +{sc.riskFlags.length - 1}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </TD>
                    <TD>
                      <span className="font-mono text-[11.5px] text-ink-mute">
                        {timeAgo(sc.updatedAt)}
                      </span>
                    </TD>
                  </motion.tr>
                );
              })}
            </TBody>
          </Table>
          <p className="tnum mt-3 font-mono text-[11px] text-ink-faint">
            {filtered.length} of {scopes.length} scopes shown
          </p>
        </motion.div>
      )}
    </PageTransition>
  );
}
