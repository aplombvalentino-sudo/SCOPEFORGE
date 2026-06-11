"use client";

/* ================================================================
   /briefs/[id] — the brief builder. Editable requirement sections
   in the main column; open questions, linked records, and brief
   health in a sticky right rail. Confirmation is gated on every
   open question having a recorded answer.
   ================================================================ */

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import type { Brief } from "@/lib/types";
import { itemVariants, listVariants } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { Badge, Button } from "@/components/ui/primitives";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { EditableSection } from "@/components/briefs/editable-section";
import { ListEditor } from "@/components/briefs/list-editor";
import { StakeholderEditor } from "@/components/briefs/stakeholder-table";
import { OpenQuestionsPanel } from "@/components/briefs/open-questions";
import { BriefHealthCard, LinkedRecordsCard } from "@/components/briefs/rail-cards";
import {
  BRIEF_STATUS_LABELS,
  BRIEF_STATUS_TONE,
  unansweredCount,
} from "@/components/briefs/brief-meta";

export default function BriefBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const briefs = useApp((s) => s.briefs);
  const leads = useApp((s) => s.leads);
  const scopes = useApp((s) => s.scopes);
  const updateBrief = useApp((s) => s.updateBrief);
  const logActivity = useApp((s) => s.logActivity);
  const toast = useToast();

  const brief = briefs.find((b) => b.id === params.id);
  const lead = brief ? leads.find((l) => l.id === brief.leadId) : undefined;
  const scope = lead?.scopeId ? scopes.find((s) => s.id === lead.scopeId) : undefined;

  if (!brief || !lead) {
    return (
      <PageTransition>
        <PageHeader overline="PIPELINE / BRIEFS" title="Brief not found" />
        <div className="panel">
          <EmptyState
            icon="brief"
            title="No brief with that id"
            body={`"${params.id}" doesn't match any brief in the Atelier North workspace. It may have been merged into another lead's record.`}
            action={
              <Button variant="secondary" onClick={() => router.push("/briefs")}>
                <Icon name="chevron-left" size={13} />
                Back to briefs
              </Button>
            }
          />
        </div>
      </PageTransition>
    );
  }

  const unanswered = unansweredCount(brief);

  const save = (patch: Partial<Brief>, message: string) => {
    updateBrief(brief.id, patch);
    toast.success(message);
  };

  const confirm = () => {
    updateBrief(brief.id, { status: "confirmed" });
    logActivity(
      "brief_updated",
      `${lead.company} brief confirmed — ready for scoping`,
      lead.id
    );
    toast.success(
      "Brief confirmed — ready for scoping",
      lead.scopeId
        ? "The linked scope can now be finalised against these requirements."
        : "Open the scope engine to draft deliverables from this brief."
    );
  };

  return (
    <PageTransition>
      <PageHeader
        overline={`PIPELINE / BRIEFS / ${brief.id.toUpperCase()}`}
        title={`${lead.company} — ${lead.projectType}`}
        description={brief.projectGoal || lead.summary}
        actions={
          <>
            <Badge tone={BRIEF_STATUS_TONE[brief.status]}>
              {BRIEF_STATUS_LABELS[brief.status]}
            </Badge>
            <Button variant="ghost" onClick={() => router.push(`/leads/${lead.id}`)}>
              Open lead workspace
              <Icon name="arrow-up-right" size={13} />
            </Button>
            {brief.status === "confirmed" ? (
              <Button
                variant="primary"
                onClick={() =>
                  router.push(lead.scopeId ? `/scopes/${lead.scopeId}` : "/scopes")
                }
              >
                Build scope
                <Icon name="arrow-right" size={13} />
              </Button>
            ) : (
              <>
                {unanswered > 0 && (
                  <span className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-warn/25 bg-warn-soft px-2.5 font-mono text-[11px] text-warn">
                    <Icon name="alert-triangle" size={12} />
                    <span className="tnum">{unanswered}</span> unanswered
                  </span>
                )}
                <Button
                  variant="primary"
                  disabled={unanswered > 0}
                  title={
                    unanswered > 0
                      ? "Record an answer to every open question first"
                      : undefined
                  }
                  onClick={confirm}
                >
                  <Icon name="check" size={13} />
                  Mark confirmed
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---------- main column: editable requirement sections ---------- */}
        <motion.div
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="min-w-0 space-y-4"
        >
          <motion.div variants={itemVariants}>
            <EditableSection
              title="Client context"
              value={brief.clientContext}
              placeholder="Who is the client, what do they sell, and what changed that makes this project necessary now?"
              emptyHint="Not captured yet — who is the client and what changed that makes this necessary now?"
              onSave={(v) => save({ clientContext: v }, "Client context updated")}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <EditableSection
              title="Project goal"
              value={brief.projectGoal}
              placeholder="One sentence: the outcome, the deadline, and how success will be judged."
              emptyHint="Not captured yet — one sentence covering outcome, deadline, and how success is judged."
              onSave={(v) => save({ projectGoal: v }, "Project goal updated")}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <EditableSection
              title="Deliverables summary"
              value={brief.deliverablesSummary}
              placeholder="The headline deliverables, comma-separated — detail lives in the scope document."
              emptyHint="Not captured yet — list the headline deliverables; detail belongs in the scope."
              onSave={(v) => save({ deliverablesSummary: v }, "Deliverables summary updated")}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
            <EditableSection
              title="Budget note"
              value={brief.budgetNote}
              placeholder="Stated range, source (verbal / written), and where we positioned."
              emptyHint="No budget signal recorded — qualify before scoping."
              compact
              onSave={(v) => save({ budgetNote: v }, "Budget note updated")}
            />
            <EditableSection
              title="Timeline note"
              value={brief.timelineNote}
              placeholder="Working weeks, hard dates, and what drives them."
              emptyHint="No timeline driver recorded — ask what makes this 'now'."
              compact
              onSave={(v) => save({ timelineNote: v }, "Timeline note updated")}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <ListEditor
              title="Success metrics"
              items={brief.successMetrics}
              marker="check"
              addPlaceholder="Add a measurable outcome — press Enter"
              emptyHint="No success metrics yet — define what 'done and working' means before pricing it."
              onAdd={(m) => {
                updateBrief(brief.id, { successMetrics: [...brief.successMetrics, m] });
                toast.success(
                  `Success metric added — ${brief.successMetrics.length + 1} tracked`
                );
              }}
              onRemove={(i) => {
                updateBrief(brief.id, {
                  successMetrics: brief.successMetrics.filter((_, idx) => idx !== i),
                });
                toast.info("Success metric removed");
              }}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
            <ListEditor
              title="Constraints"
              items={brief.constraints}
              marker="dot"
              addPlaceholder="Add a constraint — press Enter"
              emptyHint="No constraints recorded — hard dates, approval chains, fixed tooling."
              onAdd={(c) => {
                updateBrief(brief.id, { constraints: [...brief.constraints, c] });
                toast.success("Constraint added to the brief");
              }}
              onRemove={(i) => {
                updateBrief(brief.id, {
                  constraints: brief.constraints.filter((_, idx) => idx !== i),
                });
                toast.info("Constraint removed");
              }}
            />
            <ListEditor
              title="Dependencies"
              items={brief.dependencies}
              marker="dot"
              addPlaceholder="Add a dependency — press Enter"
              emptyHint="No dependencies recorded — what must the client (or a third party) deliver, and when?"
              onAdd={(d) => {
                updateBrief(brief.id, { dependencies: [...brief.dependencies, d] });
                toast.success("Dependency added to the brief");
              }}
              onRemove={(i) => {
                updateBrief(brief.id, {
                  dependencies: brief.dependencies.filter((_, idx) => idx !== i),
                });
                toast.info("Dependency removed");
              }}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <StakeholderEditor
              stakeholders={brief.stakeholders}
              onAdd={(s) => {
                updateBrief(brief.id, { stakeholders: [...brief.stakeholders, s] });
                toast.success(`${s.name} mapped as ${s.influence}`);
              }}
              onRemove={(i) => {
                const removed = brief.stakeholders[i];
                updateBrief(brief.id, {
                  stakeholders: brief.stakeholders.filter((_, idx) => idx !== i),
                });
                toast.info(`${removed.name} removed from the stakeholder map`);
              }}
            />
          </motion.div>
        </motion.div>

        {/* ---------- right rail: blockers, links, health ---------- */}
        <motion.aside
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="min-w-0 space-y-4 self-start lg:sticky lg:top-16"
        >
          <motion.div variants={itemVariants}>
            <OpenQuestionsPanel
              brief={brief}
              leadCompany={lead.company}
              leadId={lead.id}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <LinkedRecordsCard lead={lead} scope={scope} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <BriefHealthCard brief={brief} />
          </motion.div>
        </motion.aside>
      </div>
    </PageTransition>
  );
}
