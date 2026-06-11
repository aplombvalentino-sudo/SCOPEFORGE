"use client";

/* ================================================================
   /scopes/[id] — the scope builder. Deliverables, guardrails,
   milestones, and the pricing builder for one engagement.
   ================================================================ */

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { teamById } from "@/lib/demo-data";
import { money, timeAgo } from "@/lib/format";
import { transition } from "@/lib/motion";
import type { ScopeStatus } from "@/lib/types";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Tabs, type TabDef } from "@/components/ui/tabs";
import { Avatar, Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { Menu, type MenuItem } from "@/components/ui/overlays";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { ScopeStatusBadge, SCOPE_STATUS_LABELS } from "@/components/scopes/scope-status";
import { DeliverablesTab } from "@/components/scopes/deliverables-tab";
import { GuardrailsTab } from "@/components/scopes/guardrails-tab";
import { MilestonesTab } from "@/components/scopes/milestones-tab";
import { PricingTab } from "@/components/scopes/pricing-tab";

type ScopeTab = "deliverables" | "guardrails" | "milestones" | "pricing";

export default function ScopeBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const scopes = useApp((s) => s.scopes);
  const leads = useApp((s) => s.leads);
  const pricingModels = useApp((s) => s.pricingModels);
  const updateScope = useApp((s) => s.updateScope);
  const logActivity = useApp((s) => s.logActivity);

  const [tab, setTab] = useState<ScopeTab>("deliverables");

  const scope = scopes.find((sc) => sc.id === params.id);
  const lead = scope ? leads.find((l) => l.id === scope.leadId) : undefined;

  if (!scope || !lead) {
    return (
      <PageTransition>
        <EmptyState
          icon="scope"
          title="Scope not found"
          body={`No scope with id "${params.id}" exists in this workspace. It may have been merged into another record or never created from its brief.`}
          action={
            <Link href="/scopes">
              <Button variant="secondary" size="sm">
                <Icon name="chevron-left" size={13} />
                Back to scopes
              </Button>
            </Link>
          }
        />
      </PageTransition>
    );
  }

  const owner = teamById[lead.ownerId];
  const model = pricingModels.find((pm) => pm.leadId === scope.leadId);

  function advance(next: ScopeStatus) {
    if (!scope || !lead) return;
    const prev = scope.status;
    updateScope(scope.id, { status: next });
    logActivity(
      "scope_updated",
      `${lead.company} scope moved to ${SCOPE_STATUS_LABELS[next].toLowerCase()}`,
      lead.id
    );
    if (next === "approved") {
      toast.success(
        "Scope approved",
        `${lead.company} is locked against this document — anything outside it is now a change order.`
      );
    } else if (next === "in_review") {
      if (prev === "approved") {
        toast.info(
          "Approval withdrawn",
          "Scope is back in review — the change-order baseline is suspended until re-approval."
        );
      } else {
        toast.success(
          "Sent for internal review",
          `Delivery checks effort and risk before ${lead.company} sees a number.`
        );
      }
    } else {
      toast.info(
        "Returned to draft",
        "Edits are free again — nothing is locked until the next review pass."
      );
    }
  }

  const statusItems: MenuItem[] =
    scope.status === "draft"
      ? [{ label: "Send for internal review", onSelect: () => advance("in_review") }]
      : scope.status === "in_review"
        ? [
            { label: "Approve scope", onSelect: () => advance("approved") },
            { label: "Return to draft", onSelect: () => advance("draft") },
          ]
        : [{ label: "Reopen for review", onSelect: () => advance("in_review") }];

  const tabs: TabDef<ScopeTab>[] = [
    { value: "deliverables", label: "Deliverables", count: scope.deliverables.length },
    {
      value: "guardrails",
      label: "Guardrails",
      count:
        scope.exclusions.length +
        scope.assumptions.length +
        scope.acceptanceCriteria.length,
    },
    { value: "milestones", label: "Milestones", count: scope.milestones.length },
    { value: "pricing", label: "Pricing", count: model ? model.tiers.length : undefined },
  ];

  return (
    <PageTransition>
      <PageHeader
        overline={`BUILD / SCOPES / ${scope.id.toUpperCase()}`}
        title={`${lead.company} — ${lead.projectType}`}
        description={lead.summary}
        actions={
          <>
            <span
              className="tnum flex h-8.5 items-center gap-1.5 rounded-md border border-line bg-inset px-3 font-mono text-[12px] text-ink-mute"
              title="Committed delivery timeline"
            >
              <Icon name="clock" size={13} className="text-ink-faint" />
              {scope.timelineWeeks} wks
            </span>
            <ScopeStatusBadge status={scope.status} />
            <Menu
              align="end"
              items={statusItems}
              trigger={
                <Button variant="secondary" size="sm">
                  Status
                  <Icon name="chevron-down" size={12} />
                </Button>
              }
            />
            <Button
              variant="primary"
              onClick={() =>
                router.push(lead.proposalId ? `/proposals/${lead.proposalId}` : "/proposals")
              }
            >
              Draft proposal
              <Icon name="arrow-right" size={14} />
            </Button>
          </>
        }
      />

      {/* context strip */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-mute">
        {owner && (
          <span className="flex items-center gap-1.5">
            <Avatar initials={owner.initials} size={18} title={owner.name} />
            {owner.name}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Icon name="euro" size={13} className="text-ink-faint" />
          <span className="tnum font-mono">{money(lead.value)}</span> est. value
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="clock" size={13} className="text-ink-faint" />
          Updated {timeAgo(scope.updatedAt)}
        </span>
        {lead.briefId && (
          <Link
            href={`/briefs/${lead.briefId}`}
            className="flex items-center gap-1.5 text-accent transition-colors hover:text-accent-hover"
          >
            <Icon name="brief" size={13} />
            Open brief
          </Link>
        )}
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-5" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={transition}
        >
          {tab === "deliverables" && <DeliverablesTab scope={scope} />}
          {tab === "guardrails" && <GuardrailsTab scope={scope} />}
          {tab === "milestones" && <MilestonesTab scope={scope} />}
          {tab === "pricing" && <PricingTab scope={scope} />}
        </motion.div>
      </AnimatePresence>
    </PageTransition>
  );
}
