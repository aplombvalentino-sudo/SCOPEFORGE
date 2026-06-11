"use client";

/* Settings → Margin rules: the opinionated guardrails every new
   scope inherits — floor, revisions, validity, follow-up cadence. */

import { useState } from "react";
import { analytics } from "@/lib/demo-data";
import { cx, money } from "@/lib/format";
import { Button } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";
import { PrefToggle, SettingsPanel } from "./bits";

const CADENCE_OPTIONS = [2, 3, 5, 7, 10, 14];

export function MarginTab() {
  const toast = useToast();
  const [floor, setFloor] = useState("35");
  const [rounds, setRounds] = useState("2");
  const [validity, setValidity] = useState("21");
  const [cadence, setCadence] = useState<Set<number>>(new Set([3, 7, 14]));
  const [guidance, setGuidance] = useState(true);

  const floorNum = Number(floor) || 0;
  const exampleCostCeiling = Math.round(24000 * (1 - floorNum / 100));
  const headroom = (analytics.avgMarginPct - floorNum).toFixed(1);

  const toggleCadence = (d: number) =>
    setCadence((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  return (
    <div className="max-w-2xl space-y-5">
      <SettingsPanel
        title="Margin floor"
        description="Pricing below the floor shows a warning in every pricing builder."
      >
        <div className="flex items-center gap-2">
          <Input
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            inputMode="numeric"
            className="tnum w-24 font-mono"
            aria-label="Margin floor percentage"
          />
          <span className="font-mono text-[13px] text-ink-mute">%</span>
        </div>
        <div className="well mt-3 flex items-start gap-2.5 px-3 py-2.5">
          <Icon name="target" size={14} className="mt-0.5 shrink-0 text-ink-faint" />
          <p className="tnum text-[12px] leading-relaxed text-ink-mute">
            At a {floorNum}% floor, a {money(24000)} website build must keep internal cost
            under <span className="font-medium text-ink">{money(exampleCostCeiling)}</span>.
            Trailing average across the workspace: {analytics.avgMarginPct}% — {headroom}pts of
            headroom. The floor is a warning, not a lock: price below it for a strategic logo,
            but on purpose.
          </p>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Scope defaults"
        description="Written into every new scope and proposal — override per document, not per memory."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Default revision rounds"
            htmlFor="mr-rounds"
            hint="Extra rounds become pre-priced change orders, not absorbed goodwill."
          >
            <Input
              id="mr-rounds"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
              inputMode="numeric"
              className="tnum w-24 font-mono"
            />
          </Field>
          <Field
            label="Proposal validity (days)"
            htmlFor="mr-validity"
            hint="Proposals expire automatically — the date is visible to the client too."
          >
            <Input
              id="mr-validity"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              inputMode="numeric"
              className="tnum w-24 font-mono"
            />
          </Field>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Follow-up cadence"
        description="Days after send when a follow-up is armed. Three nudges is the sweet spot — more reads as pressure."
      >
        <div className="flex flex-wrap gap-1.5">
          {CADENCE_OPTIONS.map((d) => {
            const active = cadence.has(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCadence(d)}
                className={cx(
                  "tnum rounded-sm border px-2.5 py-1 font-mono text-[11.5px] transition-colors duration-150",
                  active
                    ? "border-accent-line bg-accent-soft text-accent"
                    : "border-line bg-inset text-ink-mute hover:border-line-strong hover:text-ink"
                )}
              >
                +{d}d
              </button>
            );
          })}
        </div>
        <p className="tnum mt-2 font-mono text-[11px] text-ink-faint">
          {cadence.size === 0
            ? "No nudges armed — proposals will go quiet after send."
            : `${cadence.size} nudge${cadence.size === 1 ? "" : "s"} armed: ${[...cadence]
                .sort((a, b) => a - b)
                .map((d) => `+${d}d`)
                .join(", ")} after send`}
        </p>
      </SettingsPanel>

      <SettingsPanel title="Guidance">
        <PrefToggle
          title="Margin guidance"
          description="Inline notes in the pricing builder: where each tier sits against the floor, and what the recommended tier actually earns after estimated cost."
          checked={guidance}
          onChange={setGuidance}
        />
      </SettingsPanel>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() =>
            toast.success(
              "Guardrails updated — applies to new scopes",
              "Existing scopes keep the rules they were approved with."
            )
          }
        >
          Save guardrails
        </Button>
      </div>
    </div>
  );
}
