"use client";

/* ================================================================
   Deliverables tab — the commitment list. Each card carries effort
   and tier inclusion (L/S/P chips toggle live); the footer strip
   recomputes effort per tier on every change.
   ================================================================ */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { cx } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { TIER_LABELS, type Deliverable, type ScopeDoc, type TierKey } from "@/lib/types";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";
import { Field, Input, Textarea, CheckItem } from "@/components/ui/fields";
import { Modal, Menu } from "@/components/ui/overlays";
import { EmptyState, useToast } from "@/components/ui/feedback";

const TIER_ORDER: TierKey[] = ["lean", "standard", "premium"];

export function DeliverablesTab({ scope }: { scope: ScopeDoc }) {
  const updateScope = useApp((s) => s.updateScope);
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effort, setEffort] = useState("3");
  const [draftTiers, setDraftTiers] = useState<TierKey[]>(["lean", "standard", "premium"]);

  const totals = useMemo(() => {
    const t: Record<TierKey, { days: number; count: number }> = {
      lean: { days: 0, count: 0 },
      standard: { days: 0, count: 0 },
      premium: { days: 0, count: 0 },
    };
    for (const d of scope.deliverables) {
      for (const k of d.tiers) {
        t[k].days += d.effortDays;
        t[k].count += 1;
      }
    }
    return t;
  }, [scope.deliverables]);

  function toggleTier(d: Deliverable, tier: TierKey) {
    const included = d.tiers.includes(tier);
    const nextTiers = included
      ? d.tiers.filter((t) => t !== tier)
      : TIER_ORDER.filter((k) => d.tiers.includes(k) || k === tier);
    updateScope(scope.id, {
      deliverables: scope.deliverables.map((x) =>
        x.id === d.id ? { ...x, tiers: nextTiers } : x
      ),
    });
    if (included) {
      toast.info(
        `Removed from ${TIER_LABELS[tier]}`,
        `"${d.title}" no longer ships in ${TIER_LABELS[tier]} — tier effort drops to ${totals[tier].days - d.effortDays} days.`
      );
    } else {
      toast.success(
        `Included in ${TIER_LABELS[tier]}`,
        `"${d.title}" adds ${d.effortDays} days — ${TIER_LABELS[tier]} now carries ${totals[tier].days + d.effortDays} days.`
      );
    }
  }

  function removeDeliverable(d: Deliverable) {
    updateScope(scope.id, {
      deliverables: scope.deliverables.filter((x) => x.id !== d.id),
    });
    toast.info(
      `"${d.title}" removed from scope`,
      `${d.effortDays} effort days off the plan across ${d.tiers.length} tier${d.tiers.length === 1 ? "" : "s"}.`
    );
  }

  function toggleDraftTier(tier: TierKey) {
    setDraftTiers((prev) =>
      prev.includes(tier)
        ? prev.filter((t) => t !== tier)
        : TIER_ORDER.filter((k) => prev.includes(k) || k === tier)
    );
  }

  const effortNum = Number(effort);
  const canAdd = title.trim().length > 0 && Number.isFinite(effortNum) && effortNum > 0 && draftTiers.length > 0;

  function addDeliverable() {
    if (!canAdd) return;
    const d: Deliverable = {
      id: `dl-${scope.id}-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || "No description yet — write one before this scope leaves review.",
      effortDays: effortNum,
      tiers: draftTiers,
    };
    updateScope(scope.id, { deliverables: [...scope.deliverables, d] });
    toast.success(
      `"${d.title}" added to scope`,
      `${d.effortDays} days of effort, ships in ${d.tiers.map((t) => TIER_LABELS[t]).join(" + ")}.`
    );
    setOpen(false);
    setTitle("");
    setDescription("");
    setEffort("3");
    setDraftTiers(["lean", "standard", "premium"]);
  }

  if (scope.deliverables.length === 0) {
    return (
      <>
        <EmptyState
          icon="scope"
          title="No deliverables in this scope"
          body="A scope with no deliverables is a promise with no edges. Add the first one, or pull a set from a service blueprint."
          action={
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              <Icon name="plus" size={13} />
              Add deliverable
            </Button>
          }
        />
        <AddDeliverableModal
          open={open}
          onClose={() => setOpen(false)}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          effort={effort}
          setEffort={setEffort}
          draftTiers={draftTiers}
          toggleDraftTier={toggleDraftTier}
          canAdd={canAdd}
          onSubmit={addDeliverable}
        />
      </>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[12.5px] leading-relaxed text-ink-mute">
          Each card carries its effort and which pricing tiers ship it. The tier
          letters toggle inclusion — the effort totals below update live.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Icon name="plus" size={13} />
          Add deliverable
        </Button>
      </div>

      <motion.div
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="space-y-2"
      >
        <AnimatePresence initial={false}>
          {scope.deliverables.map((d) => (
            <motion.article
              key={d.id}
              layout
              variants={itemVariants}
              exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.16 } }}
              className="panel flex items-start gap-3 px-4 py-3.5 transition-colors duration-150 hover:border-line-strong"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-[13.5px] font-medium text-ink">{d.title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-mute">
                  {d.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className="tnum font-mono text-[12px] text-ink-mute"
                  title="Estimated effort"
                >
                  {d.effortDays} days
                </span>
                <div className="flex items-center gap-1" role="group" aria-label="Tier inclusion">
                  {TIER_ORDER.map((tier) => {
                    const included = d.tiers.includes(tier);
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => toggleTier(d, tier)}
                        aria-pressed={included}
                        title={`${TIER_LABELS[tier]} — ${included ? "included, click to pull" : "not included, click to add"}`}
                        className={cx(
                          "flex h-6 w-6 items-center justify-center rounded-sm border font-mono text-[10.5px] font-medium transition-colors duration-100",
                          included
                            ? "border-accent-line bg-accent-soft text-accent"
                            : "border-line bg-inset text-ink-faint hover:border-line-strong hover:text-ink-mute"
                        )}
                      >
                        {TIER_LABELS[tier][0]}
                      </button>
                    );
                  })}
                </div>
                <Menu
                  align="end"
                  items={[
                    {
                      label: "Remove from scope",
                      danger: true,
                      onSelect: () => removeDeliverable(d),
                    },
                  ]}
                  trigger={
                    <button
                      type="button"
                      aria-label={`Actions for ${d.title}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors duration-100 hover:bg-overlay hover:text-ink"
                    >
                      <Icon name="more" size={14} />
                    </button>
                  }
                />
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* effort-by-tier footer strip */}
      <motion.div
        layout
        className="mt-4 grid grid-cols-3 divide-x divide-line overflow-hidden rounded-lg border border-line bg-inset/50"
      >
        {TIER_ORDER.map((tier) => (
          <div key={tier} className="px-4 py-3">
            <p className="microlabel">{TIER_LABELS[tier]} effort</p>
            <p className="tnum mt-1 font-display text-[18px] leading-none font-medium text-ink">
              {totals[tier].days}
              <span className="ml-1 font-mono text-[11px] font-normal text-ink-faint">
                days
              </span>
            </p>
            <p className="tnum mt-1 font-mono text-[10.5px] text-ink-faint">
              {totals[tier].count} of {scope.deliverables.length} deliverables
            </p>
          </div>
        ))}
      </motion.div>

      <AddDeliverableModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        effort={effort}
        setEffort={setEffort}
        draftTiers={draftTiers}
        toggleDraftTier={toggleDraftTier}
        canAdd={canAdd}
        onSubmit={addDeliverable}
      />
    </div>
  );
}

function AddDeliverableModal({
  open,
  onClose,
  title,
  setTitle,
  description,
  setDescription,
  effort,
  setEffort,
  draftTiers,
  toggleDraftTier,
  canAdd,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  effort: string;
  setEffort: (v: string) => void;
  draftTiers: TierKey[];
  toggleDraftTier: (t: TierKey) => void;
  canAdd: boolean;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add deliverable"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={!canAdd} onClick={onSubmit}>
            Add to scope
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" htmlFor="dl-title">
          <Input
            id="dl-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Post-launch performance audit"
            autoFocus
          />
        </Field>
        <Field
          label="Description"
          htmlFor="dl-desc"
          hint="Write it the way the client will read it — concrete output, not activity."
        >
          <Textarea
            id="dl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What ships, in what form, validated how."
            rows={3}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Effort (days)" htmlFor="dl-effort">
            <Input
              id="dl-effort"
              type="number"
              min={0.5}
              step={0.5}
              value={effort}
              onChange={(e) => setEffort(e.target.value)}
            />
          </Field>
          <Field label="Included in tiers" hint="At least one tier must ship it.">
            <div className="-mx-2 flex flex-col">
              {(["lean", "standard", "premium"] as TierKey[]).map((t) => (
                <CheckItem
                  key={t}
                  checked={draftTiers.includes(t)}
                  onChange={() => toggleDraftTier(t)}
                >
                  {TIER_LABELS[t]}
                </CheckItem>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
