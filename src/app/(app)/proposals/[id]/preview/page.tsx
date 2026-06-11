"use client";

/* /proposals/[id]/preview — the polished client-facing render.
   Standalone feel: slim top bar instead of PageHeader, print-friendly. */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { proposalNumber } from "@/components/proposals/meta";
import { ProposalStatusBadge } from "@/components/proposals/status-badge";
import { TierTable } from "@/components/proposals/tier-table";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { PageTransition } from "@/components/ui/page";
import { Button } from "@/components/ui/primitives";
import { fullDate, money } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { TIER_LABELS } from "@/lib/types";

export default function ProposalPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const proposal = useApp((s) => s.proposals.find((p) => p.id === params.id));
  const lead = useApp((s) => s.leads.find((l) => l.id === proposal?.leadId));
  const pricingModel = useApp((s) =>
    s.pricingModels.find((m) => m.leadId === proposal?.leadId)
  );
  const setProposalStatus = useApp((s) => s.setProposalStatus);

  if (!proposal) {
    return (
      <PageTransition>
        <div className="panel mx-auto max-w-3xl">
          <EmptyState
            icon="proposal"
            title="No proposal to preview"
            body="This link points to a document that no longer exists. Head back to the proposals board to find the live ones."
            action={
              <Button variant="secondary" size="sm" onClick={() => router.push("/proposals")}>
                <Icon name="chevron-left" size={13} />
                Back to proposals
              </Button>
            }
          />
        </div>
      </PageTransition>
    );
  }

  const num = proposalNumber(proposal.id);
  const enabled = proposal.sections.filter((s) => s.enabled);
  const retainer = pricingModel?.mode === "retainer";
  const monthlyPrice = pricingModel?.tiers.find(
    (t) => t.key === proposal.tierSelected
  )?.price;
  const scheduleLine = pricingModel
    ? pricingModel.schedule
        .map((s) => `${s.pct}% ${s.trigger.toLowerCase()}`)
        .join("  ·  ")
    : `${TIER_LABELS[proposal.tierSelected]} tier — schedule confirmed at signature`;

  const accept = () => {
    setProposalStatus(proposal.id, "accepted");
    toast.success(
      "Accepted — onboarding flow is ready to generate",
      `${lead?.company ?? "The client"} signed at ${money(proposal.amount)}.`
    );
  };

  const decline = () => {
    setProposalStatus(proposal.id, "declined");
    toast.info(
      "Declined — logged for the loss review",
      "The lead stays on the board; schedule a re-engagement check-in from follow-ups."
    );
  };

  return (
    <PageTransition className="mx-auto max-w-3xl">
      {/* slim top bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href={`/proposals/${proposal.id}`}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12.5px] text-ink-mute transition-colors duration-150 hover:bg-overlay hover:text-ink"
        >
          <Icon name="chevron-left" size={13} />
          Back to studio
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="microlabel hidden sm:block">{num}</span>
          <ProposalStatusBadge status={proposal.status} views={proposal.views} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.info(
                "Export queued — check your email",
                "The PDF render lands in your inbox within a minute."
              )
            }
          >
            <Icon name="download" size={13} />
            Download PDF
          </Button>
        </div>
      </div>

      {/* the document */}
      <article className="doc-page doc-serif rounded-xl px-7 py-10 sm:px-12 sm:py-14 print:rounded-none print:border-0 print:shadow-none">
        {/* cover */}
        <header>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-2.5">
              <p className="font-display text-[14px] font-semibold tracking-tight text-ink">
                Atelier North
              </p>
              <span className="microlabel">Copenhagen</span>
            </div>
            <p className="microlabel">Proposal Nº {num}</p>
          </div>

          <h1 className="mt-10 font-display text-[34px] leading-[1.15] font-medium tracking-tight text-ink">
            {proposal.title}
          </h1>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="microlabel">Prepared for</p>
              <p className="mt-1 text-[15px] font-medium text-ink">
                {lead?.company ?? "Client"}
              </p>
              {lead && (
                <p className="text-[12.5px] text-ink-mute">
                  {lead.contact.name} — {lead.contact.role}
                </p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="microlabel">Issued</p>
              <p className="tnum mt-1 font-mono text-[12.5px] text-ink">
                {fullDate(proposal.sentAt ?? proposal.updatedAt)}
              </p>
              <p className="tnum font-mono text-[10.5px] text-ink-faint">
                valid until {fullDate(proposal.validUntil)}
              </p>
            </div>
          </div>

          {/* amount band */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-5">
            <div>
              <p className="microlabel">Total investment</p>
              <p className="tnum mt-1 font-display text-[26px] font-medium tracking-tight text-ink">
                {money(proposal.amount)}
                {retainer && monthlyPrice !== undefined && (
                  <span className="text-[13px] font-normal text-ink-mute">
                    {" "}
                    / year · {money(monthlyPrice)} per month
                  </span>
                )}
              </p>
            </div>
            <div className="max-w-[320px] sm:text-right">
              <p className="microlabel">Payment schedule</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-mute">
                {scheduleLine}
              </p>
            </div>
          </div>
        </header>

        {/* sections */}
        <motion.div variants={listVariants} initial="initial" animate="animate">
          {enabled.map((sec, i) => (
            <motion.section key={sec.id} variants={itemVariants} className="mt-11">
              <div className="flex items-baseline gap-3">
                <span className="tnum font-mono text-[11px] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-[20px] font-medium tracking-tight text-ink">
                  {sec.title}
                </h2>
              </div>
              {sec.body.map((para, j) => (
                <p key={j} className="mt-3.5 text-[15px] leading-relaxed text-ink-mute">
                  {para}
                </p>
              ))}
              {sec.kind === "pricing" && pricingModel && (
                <TierTable
                  model={pricingModel}
                  selected={proposal.tierSelected}
                  className="mt-6"
                />
              )}
            </motion.section>
          ))}
          {enabled.length === 0 && (
            <p className="mt-11 text-[14px] leading-relaxed text-ink-faint">
              Every section of this document is currently disabled in the studio —
              re-enable at least one to give the client something to read.
            </p>
          )}
        </motion.div>

        {/* document footer */}
        <footer className="mt-14 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
          <p className="microlabel">Atelier North · ateliernorth.dk</p>
          <p className="microlabel">
            {num} · valid until {fullDate(proposal.validUntil)}
          </p>
        </footer>
      </article>

      {/* acceptance block */}
      <div className="mt-5 mb-2 print:hidden">
        {proposal.status === "accepted" ? (
          <div className="flex items-start gap-3 rounded-lg border border-ok/25 bg-ok-soft px-4 py-3.5">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-ok" />
            <div>
              <p className="text-[13px] font-medium text-ink">
                Accepted{proposal.decidedAt ? ` on ${fullDate(proposal.decidedAt)}` : ""}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-mute">
                The client has signed at {money(proposal.amount)}. Generate the onboarding
                flow from the studio to start delivery.
              </p>
            </div>
          </div>
        ) : proposal.status === "declined" ? (
          <div className="flex items-start gap-3 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3.5">
            <Icon name="x" size={16} className="mt-0.5 shrink-0 text-danger" />
            <div>
              <p className="text-[13px] font-medium text-ink">
                Declined{proposal.decidedAt ? ` on ${fullDate(proposal.decidedAt)}` : ""}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-mute">
                Logged for the win/loss review. A re-engagement check-in can be scheduled
                from follow-ups.
              </p>
            </div>
          </div>
        ) : (
          <div className="panel px-4 py-4">
            <p className="microlabel">Client view simulation</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">
              This is the end of the document as{" "}
              {lead?.contact.name ?? "the client"} sees it. The actions below behave
              exactly as the client&apos;s would — accepting flips the deal to won and
              readies onboarding.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={accept}>
                <Icon name="check" size={14} />
                Accept proposal
              </Button>
              <Button variant="ghost" onClick={decline}>
                Decline
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
