"use client";

/* /proposals/[id] — the proposal studio. Three zones:
   section rail · document editor · settings rail. */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  proposalNumber,
  isOpenStatus,
  SECTION_KIND_LABELS,
} from "@/components/proposals/meta";
import {
  ProposalStatusBadge,
  ValidUntilChip,
} from "@/components/proposals/status-badge";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icons";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Badge, Button } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/tabs";
import { cx, fullDate, money, timeAgo } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { TIER_LABELS, type TierKey } from "@/lib/types";

const TIER_KEYS: TierKey[] = ["lean", "standard", "premium"];

export default function ProposalStudioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const proposal = useApp((s) => s.proposals.find((p) => p.id === params.id));
  const lead = useApp((s) => s.leads.find((l) => l.id === proposal?.leadId));
  const scope = useApp((s) => s.scopes.find((sc) => sc.id === lead?.scopeId));
  const pricingModel = useApp((s) =>
    s.pricingModels.find((m) => m.leadId === proposal?.leadId)
  );
  const updateProposal = useApp((s) => s.updateProposal);
  const setProposalStatus = useApp((s) => s.setProposalStatus);
  const moveProposalSection = useApp((s) => s.moveProposalSection);
  const toggleProposalSection = useApp((s) => s.toggleProposalSection);

  /* title click-to-edit */
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const cancelTitleRef = useRef(false);

  /* section selection + editor drafts */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState<string[]>([]);

  const sections = proposal?.sections ?? [];
  const selected = sections.find((s) => s.id === selectedId) ?? sections[0] ?? null;
  const selectedKey = selected?.id ?? null;

  useEffect(() => {
    if (!selectedKey) return;
    const sec = sections.find((s) => s.id === selectedKey);
    if (sec) {
      setDraftTitle(sec.title);
      setDraftBody(sec.body);
    }
    // re-seed drafts only when the selected section changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  if (!proposal) {
    return (
      <PageTransition>
        <PageHeader overline="BUILD / PROPOSALS" title="Proposal not found" />
        <div className="panel">
          <EmptyState
            icon="proposal"
            title="No proposal with this id"
            body="The link may be stale, or the document was removed. Every live document is on the proposals board."
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
  const enabledCount = sections.filter((s) => s.enabled).length;
  const selectedIndex = selected
    ? sections.findIndex((s) => s.id === selected.id)
    : -1;
  const dirty =
    selected !== null &&
    (draftTitle !== selected.title ||
      draftBody.length !== selected.body.length ||
      draftBody.some((b, i) => b !== selected.body[i]));

  /* ---- actions ---- */

  const commitTitle = () => {
    setEditingTitle(false);
    if (cancelTitleRef.current) {
      cancelTitleRef.current = false;
      return;
    }
    const next = titleDraft.trim();
    if (!next || next === proposal.title) return;
    updateProposal(proposal.id, { title: next });
    toast.success("Title updated", "The client document header now carries the new title.");
  };

  const sendProposal = () => {
    setProposalStatus(proposal.id, "sent");
    toast.success(
      "Proposal sent — follow-up armed for +3 days",
      `${lead?.contact.name ?? "The client"} receives a tracked link; the first nudge drafts itself.`
    );
  };

  const markAccepted = () => {
    setProposalStatus(proposal.id, "accepted");
    toast.success(
      "Marked accepted",
      `${money(proposal.amount)} moves to won — generate the onboarding flow to start delivery.`
    );
  };

  const markDeclined = () => {
    setProposalStatus(proposal.id, "declined");
    toast.info(
      "Marked declined",
      "Logged for the win/loss review — the lead stays on the board."
    );
  };

  const saveSection = () => {
    if (!selected) return;
    const body = draftBody.map((b) => b.trim()).filter(Boolean);
    const title = draftTitle.trim() || selected.title;
    updateProposal(proposal.id, {
      sections: proposal.sections.map((sec) =>
        sec.id === selected.id ? { ...sec, title, body } : sec
      ),
    });
    setDraftTitle(title);
    setDraftBody(body);
    toast.success("Section saved", `"${title}" updated — the client preview reflects it immediately.`);
  };

  const onTierChange = (key: TierKey) => {
    const tier = pricingModel?.tiers.find((t) => t.key === key);
    if (tier && pricingModel) {
      const amount =
        pricingModel.mode === "retainer" ? tier.price * 12 : tier.price;
      updateProposal(proposal.id, { tierSelected: key, amount });
      toast.success(
        `${tier.name} tier applied`,
        pricingModel.mode === "retainer"
          ? `Amount updated to ${money(amount)} (12 × ${money(tier.price)}/mo).`
          : `Amount updated to ${money(amount)} — payment schedule unchanged.`
      );
    } else {
      updateProposal(proposal.id, { tierSelected: key });
      toast.info(
        `${TIER_LABELS[key]} tier stored`,
        "No pricing model is linked to this lead, so the amount was left as-is."
      );
    }
  };

  const onToggleSection = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;
    toggleProposalSection(proposal.id, sectionId);
    toast.info(
      sec.enabled
        ? `"${sec.title}" hidden from the client document`
        : `"${sec.title}" restored to the client document`
    );
  };

  /* status-appropriate primary actions */
  const statusActions =
    proposal.status === "draft" || proposal.status === "internal_review" ? (
      <Button variant="primary" onClick={sendProposal}>
        <Icon name="send" size={14} />
        Send proposal
      </Button>
    ) : proposal.status === "sent" || proposal.status === "viewed" ? (
      <>
        <Button variant="ghost" onClick={markDeclined}>
          Mark declined
        </Button>
        <Button variant="primary" onClick={markAccepted}>
          <Icon name="check" size={14} />
          Mark accepted
        </Button>
      </>
    ) : proposal.status === "accepted" ? (
      <Button
        variant="primary"
        onClick={() =>
          router.push(
            lead?.onboardingId ? `/onboarding/${lead.onboardingId}` : "/onboarding"
          )
        }
      >
        Generate onboarding
        <Icon name="arrow-right" size={14} />
      </Button>
    ) : null;

  return (
    <PageTransition>
      <PageHeader
        overline={`BUILD / PROPOSALS / ${num}`}
        title="Proposal studio"
        className="mb-4"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => router.push(`/proposals/${proposal.id}/preview`)}
            >
              <Icon name="eye" size={14} />
              Preview client view
            </Button>
            {statusActions}
          </>
        }
      />

      {/* document top bar: editable title · company · amount · status */}
      <div className="panel mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <Input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  cancelTitleRef.current = true;
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="h-8 max-w-xl font-display text-[14px] font-medium"
              aria-label="Proposal title"
            />
          ) : (
            <button
              type="button"
              title="Click to rename"
              onClick={() => {
                setTitleDraft(proposal.title);
                setEditingTitle(true);
              }}
              className="group flex min-w-0 max-w-full items-center gap-2 text-left"
            >
              <span className="truncate font-display text-[16px] font-medium tracking-tight text-ink">
                {proposal.title}
              </span>
              <Icon
                name="pen"
                size={12}
                className="shrink-0 text-ink-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              />
            </button>
          )}
        </div>
        {lead && (
          <Link
            href={`/leads/${lead.id}`}
            className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-ink-mute transition-colors duration-150 hover:text-accent"
          >
            <Icon name="building" size={13} />
            {lead.company}
          </Link>
        )}
        <span className="tnum shrink-0 font-mono text-[13px] font-medium text-ink">
          {money(proposal.amount)}
        </span>
        <ProposalStatusBadge status={proposal.status} views={proposal.views} />
      </div>

      {/* three-zone editor */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[252px_minmax(0,1fr)] xl:grid-cols-[252px_minmax(0,1fr)_284px]">
        {/* left rail — section list */}
        <aside className="panel self-start px-2.5 py-3 lg:sticky lg:top-16">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="microlabel">Sections</p>
            <span className="tnum font-mono text-[10.5px] text-ink-faint">
              {enabledCount}/{sections.length} live
            </span>
          </div>
          <ul className="space-y-0.5">
            {sections.map((sec, i) => {
              const active = selected?.id === sec.id;
              return (
                <motion.li
                  key={sec.id}
                  layout
                  transition={{ duration: DUR.base, ease: EASE }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(sec.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedId(sec.id);
                    }}
                    className={cx(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition-colors duration-100",
                      active
                        ? "border-accent-line bg-accent-soft/60"
                        : "border-transparent hover:bg-overlay"
                    )}
                  >
                    <Icon name="grip" size={12} className="shrink-0 text-ink-faint" />
                    <div className="min-w-0 flex-1">
                      <p className="microlabel !text-[8.5px]">
                        {SECTION_KIND_LABELS[sec.kind]}
                      </p>
                      <p
                        className={cx(
                          "truncate text-[12.5px] leading-snug",
                          sec.enabled
                            ? "text-ink"
                            : "text-ink-faint line-through decoration-line-strong"
                        )}
                      >
                        {sec.title}
                      </p>
                    </div>
                    <span className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        aria-label={`Move ${sec.title} up`}
                        disabled={i === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveProposalSection(proposal.id, sec.id, -1);
                        }}
                        className="flex h-3.5 w-4 items-center justify-center rounded-sm text-ink-faint transition-colors duration-100 hover:text-ink disabled:pointer-events-none disabled:opacity-25"
                      >
                        <Icon name="chevron-up" size={10} strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${sec.title} down`}
                        disabled={i === sections.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveProposalSection(proposal.id, sec.id, 1);
                        }}
                        className="flex h-3.5 w-4 items-center justify-center rounded-sm text-ink-faint transition-colors duration-100 hover:text-ink disabled:pointer-events-none disabled:opacity-25"
                      >
                        <Icon name="chevron-down" size={10} strokeWidth={2.2} />
                      </button>
                    </span>
                    <span
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Toggle
                        checked={sec.enabled}
                        onChange={() => onToggleSection(sec.id)}
                        label={`Include "${sec.title}" in the client document`}
                      />
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
          <p className="mt-2.5 border-t border-line px-2 pt-2.5 text-[11px] leading-relaxed text-ink-faint">
            Disabled sections stay drafted but never render for the client.
          </p>
        </aside>

        {/* center — section editor */}
        <section className="panel px-5 py-6 sm:px-7">
          {selected ? (
            <div className="mx-auto max-w-[640px]">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="tnum font-mono text-[11px] text-accent">
                  {String(selectedIndex + 1).padStart(2, "0")}
                </span>
                <span className="microlabel">{SECTION_KIND_LABELS[selected.kind]}</span>
                {!selected.enabled && (
                  <Badge tone="neutral">Hidden from client</Badge>
                )}
                <span className="flex-1" />
                <span
                  className={cx(
                    "microlabel transition-colors duration-150",
                    dirty ? "!text-warn" : ""
                  )}
                >
                  {dirty ? "Unsaved changes" : "Saved"}
                </span>
              </div>

              <Field label="Section title" htmlFor="section-title">
                <Input
                  id="section-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="font-display text-[15px] font-medium"
                />
              </Field>

              <div className="mt-4 space-y-3">
                {draftBody.map((para, i) => (
                  <div key={i} className="group relative">
                    <Textarea
                      value={para}
                      onChange={(e) =>
                        setDraftBody((b) =>
                          b.map((x, j) => (j === i ? e.target.value : x))
                        )
                      }
                      rows={Math.max(
                        3,
                        Math.ceil(para.length / 85) + para.split("\n").length - 1
                      )}
                      className="resize-none pr-9 text-[13.5px]"
                      aria-label={`Paragraph ${i + 1}`}
                    />
                    <button
                      type="button"
                      aria-label={`Remove paragraph ${i + 1}`}
                      onClick={() =>
                        setDraftBody((b) => b.filter((_, j) => j !== i))
                      }
                      className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-sm text-ink-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-danger-soft hover:text-danger"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                ))}
                {draftBody.length === 0 && (
                  <p className="well px-3.5 py-3 text-[12.5px] text-ink-faint">
                    No paragraphs yet — this section renders as a heading only until you
                    add body copy.
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraftBody((b) => [...b, ""])}
                >
                  <Icon name="plus" size={13} />
                  Add paragraph
                </Button>
                <Button variant="primary" size="sm" disabled={!dirty} onClick={saveSection}>
                  <Icon name="check" size={13} />
                  Save section
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="doc"
              title="No section selected"
              body="Pick a section from the rail to edit its title and body copy."
            />
          )}
        </section>

        {/* right rail — document settings */}
        <aside className="panel space-y-4 self-start px-4 py-4 lg:col-span-2 lg:sticky lg:top-16 xl:col-span-1">
          <p className="microlabel">Document settings</p>

          <Field
            label="Style"
            hint={
              proposal.style === "concise"
                ? "Tight executive read — short sections, no appendix sprawl."
                : "Full operational detail — timelines, change control, appendix."
            }
          >
            <Segmented
              options={[
                { value: "concise", label: "Concise" },
                { value: "detailed", label: "Detailed" },
              ]}
              value={proposal.style}
              onChange={(v) => {
                updateProposal(proposal.id, { style: v });
                toast.info(
                  `Style set to ${v}`,
                  v === "concise"
                    ? "Sections render tighter — good for committee pre-reads."
                    : "Sections render with full body copy and operational detail."
                );
              }}
            />
          </Field>

          <Field
            label="Pricing tier"
            hint={
              pricingModel
                ? "Amount follows the selected tier price."
                : "No pricing model linked — tier is stored without repricing."
            }
          >
            <Select
              value={proposal.tierSelected}
              onChange={(e) => onTierChange(e.target.value as TierKey)}
              aria-label="Pricing tier"
            >
              {TIER_KEYS.map((key) => {
                const tier = pricingModel?.tiers.find((t) => t.key === key);
                return (
                  <option key={key} value={key}>
                    {tier
                      ? `${tier.name} — ${money(tier.price)}${
                          pricingModel?.mode === "retainer" ? "/mo" : ""
                        }`
                      : TIER_LABELS[key]}
                  </option>
                );
              })}
            </Select>
          </Field>

          <div className="space-y-3 border-t border-line pt-3.5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="microlabel">Valid until</span>
                {isOpenStatus(proposal.status) && (
                  <ValidUntilChip iso={proposal.validUntil} />
                )}
              </div>
              <p className="tnum mt-1 font-mono text-[12px] text-ink">
                {fullDate(proposal.validUntil)}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="microlabel">Views</span>
                <span className="tnum flex items-center gap-1.5 font-mono text-[12px] text-ink">
                  <Icon name="eye" size={12} className="text-ink-faint" />
                  {proposal.views}
                </span>
              </div>
              {proposal.viewedAt && (
                <p className="mt-0.5 text-right font-mono text-[10.5px] text-ink-faint">
                  last read {timeAgo(proposal.viewedAt)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="microlabel">Sent</span>
              <span className="tnum font-mono text-[11.5px] text-ink-mute">
                {proposal.sentAt ? fullDate(proposal.sentAt) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="microlabel">First viewed</span>
              <span className="tnum font-mono text-[11.5px] text-ink-mute">
                {proposal.viewedAt ? fullDate(proposal.viewedAt) : "—"}
              </span>
            </div>
            {proposal.decidedAt && (
              <div className="flex items-center justify-between gap-2">
                <span className="microlabel">Decided</span>
                <span className="tnum font-mono text-[11.5px] text-ink-mute">
                  {fullDate(proposal.decidedAt)}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-line pt-3.5">
            <p className="microlabel mb-1.5">Linked records</p>
            {lead ? (
              <Link
                href={`/leads/${lead.id}`}
                className="group -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-100 hover:bg-overlay"
              >
                <Icon name="building" size={13} className="text-ink-faint" />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                  {lead.company}
                </span>
                <span className="microlabel !text-[8.5px]">Lead</span>
                <Icon
                  name="chevron-right"
                  size={12}
                  className="text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            ) : (
              <p className="px-2 py-1.5 text-[12px] text-ink-faint">
                No lead linked to this document.
              </p>
            )}
            {scope && (
              <Link
                href={`/scopes/${scope.id}`}
                className="group -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-100 hover:bg-overlay"
              >
                <Icon name="scope" size={13} className="text-ink-faint" />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                  Scope document
                </span>
                <span className="microlabel !text-[8.5px]">
                  {scope.status.replace(/_/g, " ")}
                </span>
                <Icon
                  name="chevron-right"
                  size={12}
                  className="text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            )}
            {pricingModel && (
              <p className="px-2 pt-1.5 text-[11px] leading-relaxed text-ink-faint">
                Pricing model linked — {pricingModel.tiers.length} tiers,{" "}
                {pricingModel.mode === "retainer" ? "monthly retainer" : "fixed project"},{" "}
                {pricingModel.depositPct > 0
                  ? `${pricingModel.depositPct}% deposit.`
                  : "invoiced monthly."}
              </p>
            )}
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}
