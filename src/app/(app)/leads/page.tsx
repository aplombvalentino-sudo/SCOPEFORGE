"use client";

/* /leads — pipeline list + kanban board with visible filters. */

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { teamById } from "@/lib/demo-data";
import { money, moneyCompact, timeAgo } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { STAGE_LABELS, STAGE_ORDER, type RiskLevel, type Stage } from "@/lib/types";
import { ImportFromGmail } from "@/components/leads/import-from-google";
import { CreateLeadModal, ImportLeadModal } from "@/components/leads/lead-modals";
import { PipelineBoard } from "@/components/leads/pipeline-board";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icons";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Avatar, Button, RiskBadge, StagePill } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Segmented } from "@/components/ui/tabs";

type ViewMode = "list" | "pipeline";

const RISK_LABELS: Record<RiskLevel, string> = { low: "Low", medium: "Medium", high: "High" };

function LeadsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leads = useApp((s) => s.leads);
  const team = useApp((s) => s.team);

  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<"all" | Stage>("all");
  const [risk, setRisk] = useState<"all" | RiskLevel>("all");
  const [owner, setOwner] = useState<string>("all");
  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Topbar deep link: /leads?new=1 opens the create modal.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
      router.replace("/leads", { scroll: false });
    }
  }, [searchParams, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (q) {
        const haystack = `${l.company} ${l.projectType} ${l.contact.name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (stage !== "all" && l.stage !== stage) return false;
      if (risk !== "all" && l.risk !== risk) return false;
      if (owner !== "all" && l.ownerId !== owner) return false;
      return true;
    });
  }, [leads, query, stage, risk, owner]);

  const activeFilters =
    (query.trim() ? 1 : 0) +
    (stage !== "all" ? 1 : 0) +
    (risk !== "all" ? 1 : 0) +
    (owner !== "all" ? 1 : 0);

  function clearFilters() {
    setQuery("");
    setStage("all");
    setRisk("all");
    setOwner("all");
  }

  const shownValue = filtered.reduce((sum, l) => sum + l.value, 0);

  return (
    <PageTransition>
      <PageHeader
        overline="PIPELINE / LEADS"
        title="Leads"
        description="Every inbound request from first signal to signed work — qualify hard here so scoping starts clean."
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Icon name="upload" size={14} />
              Import lead
            </Button>
            <ImportFromGmail />
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Icon name="plus" size={14} />
              New lead
            </Button>
          </>
        }
      />

      {/* toolbar: view switch + visible filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented<ViewMode>
          options={[
            { value: "list", label: "List", icon: <Icon name="list" size={13} /> },
            { value: "pipeline", label: "Pipeline", icon: <Icon name="kanban" size={13} /> },
          ]}
          value={view}
          onChange={setView}
        />
        <div className="relative min-w-52 flex-1 sm:max-w-64">
          <Icon
            name="search"
            size={13}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Company, project, or contact…"
            aria-label="Search leads"
            className="pl-8"
          />
        </div>
        <Select
          value={stage}
          onChange={(e) => setStage(e.target.value as "all" | Stage)}
          aria-label="Filter by stage"
          className="w-40"
        >
          <option value="all">All stages</option>
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select
          value={risk}
          onChange={(e) => setRisk(e.target.value as "all" | RiskLevel)}
          aria-label="Filter by risk"
          className="w-32"
        >
          <option value="all">All risk</option>
          {(Object.keys(RISK_LABELS) as RiskLevel[]).map((r) => (
            <option key={r} value={r}>
              {RISK_LABELS[r]} risk
            </option>
          ))}
        </Select>
        <Select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          aria-label="Filter by owner"
          className="w-40"
        >
          <option value="all">All owners</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        {activeFilters > 0 && (
          <button
            onClick={clearFilters}
            className="tnum inline-flex h-7 items-center gap-1.5 rounded-sm border border-accent-line bg-accent-soft px-2 font-mono text-[11px] font-medium text-accent transition-colors duration-150 hover:bg-accent-soft/70"
          >
            {activeFilters} {activeFilters === 1 ? "filter" : "filters"}
            <Icon name="x" size={11} />
          </button>
        )}
        <span className="tnum ml-auto font-mono text-[11px] whitespace-nowrap text-ink-faint">
          {filtered.length} of {leads.length} · {moneyCompact(shownValue)}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="filter"
            title="No leads match these filters"
            body="Nothing in the pipeline fits this combination of search, stage, risk, and owner. Widen the net or clear everything."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </div>
      ) : view === "pipeline" ? (
        <PipelineBoard leads={filtered} />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Company</TH>
              <TH>Project type</TH>
              <TH>Stage</TH>
              <TH numeric>Value</TH>
              <TH>Risk</TH>
              <TH>Owner</TH>
              <TH className="text-right">Last activity</TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((lead, i) => {
              const ownerMember = teamById[lead.ownerId];
              return (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.base, ease: EASE, delay: Math.min(i * 0.03, 0.4) }}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="cursor-pointer transition-colors duration-100 hover:bg-overlay/70"
                >
                  <TD>
                    <p className="text-[13px] font-medium text-ink">{lead.company}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-faint">{lead.contact.name}</p>
                  </TD>
                  <TD className="max-w-52">
                    <span className="block truncate text-ink-mute">{lead.projectType}</span>
                  </TD>
                  <TD>
                    <StagePill stage={lead.stage} />
                  </TD>
                  <TD numeric>{lead.value > 0 ? money(lead.value) : "—"}</TD>
                  <TD>
                    <RiskBadge level={lead.risk} />
                  </TD>
                  <TD>
                    {ownerMember && (
                      <Avatar
                        initials={ownerMember.initials}
                        size={24}
                        title={`${ownerMember.name} — ${ownerMember.role}`}
                      />
                    )}
                  </TD>
                  <TD className="tnum text-right font-mono text-[11.5px] whitespace-nowrap text-ink-faint">
                    {timeAgo(lead.lastActivityAt)}
                  </TD>
                </motion.tr>
              );
            })}
          </TBody>
        </Table>
      )}

      <ImportLeadModal open={importOpen} onClose={() => setImportOpen(false)} />
      <CreateLeadModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </PageTransition>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={null}>
      <LeadsPageInner />
    </Suspense>
  );
}
