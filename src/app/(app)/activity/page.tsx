"use client";

/* ================================================================
   /activity — the full workspace event log. Filterable by kind,
   team member, and keyword; grouped by day with micro separators.
   ================================================================ */

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { DEMO_NOW, fullDate, timeAgo } from "@/lib/format";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { KpiCard } from "@/components/ui/kpi";
import { Input, Select } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Timeline } from "@/components/ui/timeline";
import type { ActivityEvent, ActivityKind } from "@/lib/types";

const KIND_LABELS: Record<ActivityKind, string> = {
  lead_created: "Lead created",
  intake_analyzed: "Intake analyzed",
  brief_updated: "Brief updated",
  scope_updated: "Scope updated",
  proposal_sent: "Proposal sent",
  proposal_viewed: "Proposal viewed",
  proposal_accepted: "Proposal accepted",
  follow_up_sent: "Follow-up sent",
  onboarding_started: "Onboarding started",
  change_order: "Change order",
  comment: "Comment",
  stage_change: "Stage change",
};

const TODAY_KEY = DEMO_NOW.toISOString().slice(0, 10);
const YESTERDAY_KEY = new Date(DEMO_NOW.getTime() - 86400000).toISOString().slice(0, 10);
const WEEK_AGO_MS = DEMO_NOW.getTime() - 7 * 86400000;

function dayLabel(key: string): string {
  if (key === TODAY_KEY) return "Today";
  if (key === YESTERDAY_KEY) return "Yesterday";
  return fullDate(key);
}

export default function ActivityPage() {
  const activity = useApp((s) => s.activity);
  const team = useApp((s) => s.team);

  const [kind, setKind] = useState<ActivityKind | "all">("all");
  const [actor, setActor] = useState<string>("all");
  const [query, setQuery] = useState("");

  /* ---- KPI strip ---- */
  const eventsToday = activity.filter((a) => a.at.slice(0, 10) === TODAY_KEY).length;
  const sentEvents = activity.filter(
    (a) => a.kind === "proposal_sent" && new Date(a.at).getTime() >= WEEK_AGO_MS
  );
  const stageChangeEvents = activity.filter(
    (a) => a.kind === "stage_change" && new Date(a.at).getTime() >= WEEK_AGO_MS
  );
  const latestSent = [...sentEvents].sort((a, b) => b.at.localeCompare(a.at))[0];
  const latestStageChange = [...stageChangeEvents].sort((a, b) =>
    b.at.localeCompare(a.at)
  )[0];

  /* ---- filtering + day grouping ---- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activity.filter((a) => {
      if (kind !== "all" && a.kind !== kind) return false;
      if (actor !== "all" && a.actorId !== actor) return false;
      if (q && !a.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activity, kind, actor, query]);

  const groups = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.at.localeCompare(a.at));
    const map = new Map<string, ActivityEvent[]>();
    for (const ev of sorted) {
      const key = ev.at.slice(0, 10);
      const bucket = map.get(key);
      if (bucket) bucket.push(ev);
      else map.set(key, [ev]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const hasFilters = kind !== "all" || actor !== "all" || query.trim() !== "";
  const clearFilters = () => {
    setKind("all");
    setActor("all");
    setQuery("");
  };

  return (
    <PageTransition>
      <PageHeader
        overline="WORKSPACE / ACTIVITY"
        title="Activity log"
        description="Every event across the pipeline — who did what, when, on which deal. Live actions from this session land at the top."
      />

      {/* ---- KPI strip ---- */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Events today"
          value={eventsToday}
          icon="activity"
          delta={`of ${activity.length} in the log`}
        />
        <KpiCard
          label="Proposals sent · 7 days"
          value={sentEvents.length}
          icon="send"
          delta={latestSent ? `latest ${timeAgo(latestSent.at)}` : "none this week"}
        />
        <KpiCard
          label="Stage changes · 7 days"
          value={stageChangeEvents.length}
          icon="arrow-right"
          delta={
            latestStageChange
              ? `latest ${timeAgo(latestStageChange.at)}`
              : "none this week"
          }
        />
      </div>

      {/* ---- filter bar ---- */}
      <div className="panel mb-4 flex flex-wrap items-center gap-2.5 px-3.5 py-3">
        <div className="relative min-w-52 flex-1">
          <Icon
            name="search"
            size={13}
            className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events — company, action, keyword…"
            className="pl-8.5"
            aria-label="Search activity"
          />
        </div>
        <div className="w-44">
          <Select
            value={kind}
            onChange={(e) => setKind(e.target.value as ActivityKind | "all")}
            aria-label="Filter by event kind"
          >
            <option value="all">All kinds</option>
            {(Object.keys(KIND_LABELS) as ActivityKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            aria-label="Filter by team member"
          >
            <option value="all">Everyone</option>
            {team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <span className="tnum font-mono text-[11px] text-ink-faint">
          {filtered.length} of {activity.length} events
        </span>
      </div>

      {/* ---- event log ---- */}
      {filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="search"
            title="No events match"
            body="Nothing in the log matches the current filters. Try a broader keyword, a different kind, or clear everything."
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  <Icon name="x" size={12} />
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="panel px-4 pt-1.5 pb-3">
          {groups.map(([key, events]) => (
            <div key={key}>
              <div className="flex items-center gap-3 pt-3 pb-1.5">
                <span className="microlabel">{dayLabel(key)}</span>
                <span aria-hidden className="h-px flex-1 bg-line" />
                <span className="tnum font-mono text-[10.5px] text-ink-faint">
                  {events.length} {events.length === 1 ? "event" : "events"}
                </span>
              </div>
              <Timeline events={events} />
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
