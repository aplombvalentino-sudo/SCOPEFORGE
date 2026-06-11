"use client";

/* Overview tab — working summary, editable notes, linked-document grid. */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { money, pct } from "@/lib/format";
import { useApp } from "@/lib/store";
import { PROPOSAL_STATUS_LABELS, type Lead } from "@/lib/types";
import { useToast } from "@/components/ui/feedback";
import { Textarea } from "@/components/ui/fields";
import { Icon, type IconName } from "@/components/ui/icons";
import { Badge, Button, Progress, type Tone } from "@/components/ui/primitives";

/* ---------- linked document card ---------- */

function DocCard({
  icon,
  title,
  status,
  statusTone,
  stat,
  href,
  emptyCta,
  emptyHref,
  emptyHint,
  children,
}: {
  icon: IconName;
  title: string;
  status?: string;
  statusTone?: Tone;
  stat?: string;
  href?: string;
  emptyCta: string;
  emptyHref: string;
  emptyHint: string;
  children?: ReactNode;
}) {
  if (!href) {
    return (
      <div className="flex flex-col rounded-lg border border-dashed border-line bg-surface/50 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Icon name={icon} size={15} className="text-ink-faint" />
          <span className="text-[13px] font-medium text-ink-mute">{title}</span>
          <span className="microlabel ml-auto">not started</span>
        </div>
        <p className="mt-1.5 flex-1 text-[12px] leading-snug text-ink-faint">{emptyHint}</p>
        <Link
          href={emptyHref}
          className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
        >
          {emptyCta}
          <Icon name="arrow-right" size={12} />
        </Link>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-line bg-surface px-4 py-3.5 transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-e1"
    >
      <div className="flex items-center gap-2">
        <Icon name={icon} size={15} className="text-accent" />
        <span className="text-[13px] font-medium text-ink">{title}</span>
        {status && statusTone && (
          <Badge tone={statusTone} className="ml-auto">
            {status}
          </Badge>
        )}
      </div>
      <div className="mt-2 flex-1">
        {stat && <p className="tnum font-mono text-[11.5px] text-ink-mute">{stat}</p>}
        {children}
      </div>
      <span className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-mute transition-colors duration-150 group-hover:text-accent">
        Open
        <Icon
          name="arrow-right"
          size={12}
          className="transition-transform duration-150 group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

/* ---------- tab ---------- */

const BRIEF_TONES: Record<string, Tone> = { draft: "neutral", needs_clarification: "warn", confirmed: "ok" };
const BRIEF_LABELS: Record<string, string> = { draft: "Draft", needs_clarification: "Needs clarification", confirmed: "Confirmed" };
const SCOPE_TONES: Record<string, Tone> = { draft: "neutral", in_review: "warn", approved: "ok" };
const SCOPE_LABELS: Record<string, string> = { draft: "Draft", in_review: "In review", approved: "Approved" };
const PROPOSAL_TONES: Record<string, Tone> = {
  draft: "neutral",
  internal_review: "warn",
  sent: "info",
  viewed: "accent",
  accepted: "ok",
  declined: "danger",
  expired: "neutral",
};

export function OverviewTab({ lead }: { lead: Lead }) {
  const toast = useToast();
  const updateLead = useApp((s) => s.updateLead);
  const brief = useApp((s) => s.briefs.find((b) => b.id === lead.briefId));
  const scope = useApp((s) => s.scopes.find((sc) => sc.id === lead.scopeId));
  const proposal = useApp((s) => s.proposals.find((p) => p.id === lead.proposalId));
  const onboarding = useApp((s) => s.onboardingFlows.find((f) => f.id === lead.onboardingId));

  const [notes, setNotes] = useState(lead.notes ?? "");
  const dirty = notes !== (lead.notes ?? "");

  function saveNotes() {
    updateLead(lead.id, { notes });
    toast.success("Notes saved", `${lead.company} workspace updated for the whole team.`);
  }

  const openQuestions = brief ? brief.openQuestions.filter((q) => !q.answered).length : 0;
  const obDone = onboarding ? onboarding.tasks.filter((t) => t.done).length : 0;
  const obTotal = onboarding ? onboarding.tasks.length : 0;
  const obPct = obTotal > 0 ? (obDone / obTotal) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* working summary */}
      <div className="panel px-4 py-3.5">
        <p className="microlabel mb-1.5">Working summary</p>
        <p className="text-[13px] leading-relaxed text-ink">{lead.summary}</p>
      </div>

      {/* notes */}
      <div className="panel px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="microlabel">Internal notes</p>
          <Button variant="secondary" size="sm" disabled={!dirty} onClick={saveNotes}>
            <Icon name="pen" size={12} />
            Save notes
          </Button>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Stakeholder dynamics, pricing posture, who to keep close — notes the team needs before the next call."
          className="min-h-24"
        />
      </div>

      {/* documents */}
      <div>
        <p className="microlabel mb-2">Documents</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DocCard
            icon="brief"
            title="Brief"
            status={brief ? BRIEF_LABELS[brief.status] : undefined}
            statusTone={brief ? BRIEF_TONES[brief.status] : undefined}
            stat={
              brief
                ? openQuestions > 0
                  ? `${openQuestions} open ${openQuestions === 1 ? "question" : "questions"} · ${brief.successMetrics.length} success metrics`
                  : `All questions answered · ${brief.successMetrics.length} success metrics`
                : undefined
            }
            href={brief ? `/briefs/${brief.id}` : undefined}
            emptyCta="Generate brief"
            emptyHref="/briefs"
            emptyHint="Turn the intake analysis into a structured brief the client confirms before scoping starts."
          />
          <DocCard
            icon="scope"
            title="Scope"
            status={scope ? SCOPE_LABELS[scope.status] : undefined}
            statusTone={scope ? SCOPE_TONES[scope.status] : undefined}
            stat={
              scope
                ? `${scope.deliverables.length} deliverables · ${scope.timelineWeeks} wks · ${scope.riskFlags.length} risk ${scope.riskFlags.length === 1 ? "flag" : "flags"}`
                : undefined
            }
            href={scope ? `/scopes/${scope.id}` : undefined}
            emptyCta="Build scope"
            emptyHref="/scopes"
            emptyHint="Deliverables, exclusions, milestones, and acceptance criteria — the document that prevents scope creep later."
          />
          <DocCard
            icon="proposal"
            title="Proposal"
            status={proposal ? PROPOSAL_STATUS_LABELS[proposal.status] : undefined}
            statusTone={proposal ? PROPOSAL_TONES[proposal.status] : undefined}
            stat={
              proposal
                ? `${money(proposal.amount)} · ${proposal.views} ${proposal.views === 1 ? "view" : "views"}`
                : undefined
            }
            href={proposal ? `/proposals/${proposal.id}` : undefined}
            emptyCta="Compose proposal"
            emptyHref="/proposals"
            emptyHint="Assemble the client-facing document from the approved scope and pricing tiers — sent with view tracking."
          />
          <DocCard
            icon="onboarding"
            title="Onboarding"
            status={onboarding ? (obPct === 100 ? "Complete" : "In progress") : undefined}
            statusTone={onboarding ? (obPct === 100 ? "ok" : "accent") : undefined}
            stat={
              onboarding ? `${obDone}/${obTotal} tasks · ${pct(obPct)} complete` : undefined
            }
            href={onboarding ? `/onboarding/${onboarding.id}` : undefined}
            emptyCta="Start onboarding"
            emptyHref="/onboarding"
            emptyHint="Post-signature flow: access checklist, asset requests, kickoff agenda, and the first-14-days plan."
          >
            {onboarding && <Progress value={obPct} tone={obPct === 100 ? "ok" : "accent"} className="mt-2" />}
          </DocCard>
        </div>
      </div>
    </div>
  );
}
