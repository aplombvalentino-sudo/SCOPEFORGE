"use client";

/* ================================================================
   Pricing builder — three tiers with live margin gauges against
   the 35% workspace floor, margin-engine guidance, add-ons, and
   the payment schedule. Price edits are local drafts: there is no
   store action for pricing, and the UI says so.
   ================================================================ */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { cx, marginPct, money, moneyCompact, pct, timeAgo } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import type { PricingTier, ScopeDoc, TierKey } from "@/lib/types";
import { Icon } from "@/components/ui/icons";
import { Badge, Button } from "@/components/ui/primitives";
import { Input } from "@/components/ui/fields";
import { Segmented } from "@/components/ui/tabs";
import { RingGauge } from "@/components/ui/charts";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { EmptyState, useToast } from "@/components/ui/feedback";

function marginTone(m: number): "ok" | "accent" | "warn" | "danger" {
  if (m >= 40) return "ok";
  if (m >= 35) return "accent";
  if (m >= 30) return "warn";
  return "danger";
}

export function PricingTab({ scope }: { scope: ScopeDoc }) {
  const router = useRouter();
  const toast = useToast();
  const model = useApp((s) => s.pricingModels).find((pm) => pm.leadId === scope.leadId);

  /* local price drafts — no store action for pricing, edits stay here */
  const [drafts, setDrafts] = useState<Partial<Record<TierKey, number>>>({});
  const [editing, setEditing] = useState<TierKey | null>(null);
  const [editValue, setEditValue] = useState("");
  const cancelRef = useRef(false);

  if (!model) {
    return (
      <EmptyState
        icon="euro"
        title="No pricing model yet"
        body="Tiers are assembled from this scope's deliverables against the 35% workspace margin floor. Start from a service blueprint to inherit base price, target margin, and standard exclusions."
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push("/services")}>
            Start from service blueprint
            <Icon name="arrow-right" size={13} />
          </Button>
        }
      />
    );
  }

  const isRetainer = model.mode === "retainer";
  const dirty = Object.keys(drafts).length > 0;
  const priceOf = (t: PricingTier) => drafts[t.key] ?? t.price;
  const anchorTier = model.tiers.find((t) => t.recommended) ?? model.tiers[0];
  const perMo = isRetainer ? "/mo" : "";

  function startEdit(t: PricingTier) {
    setEditing(t.key);
    setEditValue(String(priceOf(t)));
  }

  function commitEdit(t: PricingTier, raw: string) {
    const v = Math.round(Number(raw));
    if (!Number.isFinite(v) || v <= 0) {
      toast.error("Price not saved", "Enter a positive amount in euros.");
      return;
    }
    if (v === t.price) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[t.key];
        return next;
      });
      return;
    }
    setDrafts((prev) => ({ ...prev, [t.key]: v }));
    const m = marginPct(v, t.cost);
    toast.success(
      `${t.name} repriced to ${money(v)}${perMo}`,
      `Margin ${pct(m)} against ${money(t.cost)} cost — ${m >= 35 ? "clears" : "breaches"} the 35% floor. Draft only, kept local.`
    );
  }

  function discardDrafts() {
    setDrafts({});
    toast.info("Local pricing drafts discarded", "All tiers are back to the saved model.");
  }

  return (
    <motion.div variants={listVariants} initial="initial" animate="animate">
      {/* mode + draft status */}
      <motion.div
        variants={itemVariants}
        className="mb-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<"project" | "retainer">
            options={[
              { value: "project", label: "Project" },
              { value: "retainer", label: "Retainer" },
            ]}
            value={model.mode}
            onChange={(v) => {
              if (v !== model.mode)
                toast.info(
                  "Pricing mode is set by the blueprint",
                  `Duplicate this model from Services to quote it as a ${v} instead.`
                );
            }}
          />
          <span className="tnum font-mono text-[11px] text-ink-faint">
            {model.tiers.length} tiers · updated {timeAgo(model.updatedAt)}
          </span>
        </div>
        {dirty && (
          <div className="flex items-center gap-2">
            <Badge tone="neutral">
              <Icon name="pen" size={9} />
              Draft — local changes
            </Badge>
            <Button variant="ghost" size="sm" onClick={discardDrafts}>
              Discard
            </Button>
          </div>
        )}
      </motion.div>

      {/* tier columns */}
      <div className="grid gap-4 md:grid-cols-3">
        {model.tiers.map((tier) => {
          const price = priceOf(tier);
          const m = marginPct(price, tier.cost);
          const tone = marginTone(m);
          const edited = drafts[tier.key] !== undefined;
          return (
            <motion.article
              key={tier.key}
              variants={itemVariants}
              className={cx(
                "panel flex flex-col px-4 py-4 transition-[border-color,box-shadow] duration-200",
                tier.recommended
                  ? "border-accent-line shadow-e1"
                  : "hover:border-line-strong"
              )}
            >
              <header className="flex items-center justify-between gap-2">
                <h3 className="font-display text-[15px] font-medium tracking-tight text-ink">
                  {tier.name}
                </h3>
                {tier.recommended && <Badge tone="accent">Recommended</Badge>}
                {edited && !tier.recommended && <Badge tone="neutral">edited</Badge>}
              </header>

              {/* click-to-edit price */}
              <div className="mt-2.5">
                {editing === tier.key ? (
                  <Input
                    autoFocus
                    type="number"
                    min={1}
                    step={100}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        cancelRef.current = true;
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={(e) => {
                      const cancelled = cancelRef.current;
                      cancelRef.current = false;
                      setEditing(null);
                      if (!cancelled) commitEdit(tier, e.target.value);
                    }}
                    aria-label={`${tier.name} price`}
                    className="h-9 w-36 font-mono"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(tier)}
                    title="Click to edit price (draft only)"
                    className="group flex items-baseline gap-1.5 rounded-md transition-colors duration-100 hover:bg-overlay/60 -mx-1 px-1"
                  >
                    <span className="tnum font-display text-[24px] leading-none font-medium tracking-tight text-ink">
                      {money(price)}
                    </span>
                    {isRetainer && (
                      <span className="font-mono text-[11px] text-ink-faint">/mo</span>
                    )}
                    <Icon
                      name="pen"
                      size={11}
                      className="self-center text-ink-faint opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                    />
                  </button>
                )}
              </div>

              {/* margin gauge */}
              <div className="mt-3 flex items-center gap-3.5">
                <RingGauge value={m} size={72} display={pct(m)} label="margin" tone={tone} />
                <div className="tnum space-y-1 font-mono text-[11px] text-ink-faint">
                  <p>
                    cost <span className="text-ink-mute">{money(tier.cost)}</span>
                  </p>
                  <p>
                    margin{" "}
                    <span className="text-ink-mute">{money(price - tier.cost)}</span>
                  </p>
                  <p>floor 35%</p>
                </div>
              </div>

              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-mute">
                {tier.summary}
              </p>

              <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                {tier.inclusions.map((inc) => (
                  <li key={inc} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink">
                    <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
                    {inc}
                  </li>
                ))}
              </ul>
            </motion.article>
          );
        })}
      </div>

      {/* margin guidance — verbatim from the margin engine */}
      <motion.div variants={itemVariants} className="well mt-4 flex items-start gap-3 px-4 py-3.5">
        <Icon name="sparkle" size={15} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="microlabel">Margin guidance</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
            {model.marginGuidance}
          </p>
        </div>
      </motion.div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {/* add-ons */}
        <motion.section variants={itemVariants}>
          <header className="mb-2.5">
            <h3 className="font-display text-[13.5px] font-medium tracking-tight text-ink">
              Add-ons
            </h3>
            <p className="mt-0.5 text-[12px] text-ink-mute">
              Pre-priced extras — quoted on top, never absorbed into a tier.
            </p>
          </header>
          {model.addOns.length === 0 ? (
            <p className="rounded-md border border-dashed border-line px-3 py-2.5 text-[12px] text-ink-faint">
              No add-ons priced for this model.
            </p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Add-on</TH>
                  <TH numeric>Price</TH>
                </tr>
              </THead>
              <TBody>
                {model.addOns.map((ao) => (
                  <TR key={ao.id}>
                    <TD>
                      <p className="text-[13px] font-medium text-ink">{ao.name}</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-ink-mute">
                        {ao.description}
                      </p>
                    </TD>
                    <TD numeric>{money(ao.price)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </motion.section>

        {/* payment schedule */}
        <motion.section variants={itemVariants}>
          <header className="mb-2.5 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-[13.5px] font-medium tracking-tight text-ink">
                Payment schedule
              </h3>
              <p className="mt-0.5 text-[12px] text-ink-mute">
                Sized against the {anchorTier.name} tier at {money(priceOf(anchorTier))}
                {perMo}.
              </p>
            </div>
            {model.depositPct > 0 ? (
              <Badge tone="accent">{model.depositPct}% deposit</Badge>
            ) : (
              <Badge tone="neutral">No deposit · monthly billing</Badge>
            )}
          </header>

          <div className="flex h-11 w-full overflow-hidden rounded-md border border-line">
            {model.schedule.map((term, i) => {
              const amount = (priceOf(anchorTier) * term.pct) / 100;
              return (
                <div
                  key={term.label}
                  style={{ width: `${term.pct}%` }}
                  title={`${term.label} — ${term.pct}% · ${money(amount)}${perMo} · ${term.trigger}`}
                  className={cx(
                    "flex min-w-0 flex-col justify-center px-2.5 transition-colors duration-150",
                    i === 0
                      ? "bg-accent text-on-accent"
                      : i === 1
                        ? "border-l border-line bg-accent-soft text-accent"
                        : "border-l border-line bg-inset text-ink"
                  )}
                >
                  <span className="truncate text-[11px] leading-tight font-medium">
                    {term.label}
                  </span>
                  <span className="tnum truncate font-mono text-[10px] leading-tight opacity-80">
                    {term.pct}% · {moneyCompact(amount)}
                    {perMo}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex w-full">
            {model.schedule.map((term) => (
              <div key={term.label} style={{ width: `${term.pct}%` }} className="min-w-0 px-2.5">
                <p className="truncate font-mono text-[10px] text-ink-faint" title={term.trigger}>
                  {term.trigger}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
