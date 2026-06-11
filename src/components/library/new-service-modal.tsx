"use client";

/* New service blueprint modal — name, category, pricing mode,
   base price. Appends a session-local blueprint. */

import { useState } from "react";
import type { ServiceBlueprint } from "@/lib/types";
import { money } from "@/lib/format";
import { Modal } from "@/components/ui/overlays";
import { Button } from "@/components/ui/primitives";
import { Field, Input, Select } from "@/components/ui/fields";
import { Segmented } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/feedback";
import { localId } from "./bits";

const CATEGORIES = ["Web", "Performance", "Brand", "Operations", "Content"];

type PricingMode = ServiceBlueprint["pricingMode"];

export function NewServiceModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (s: ServiceBlueprint) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [mode, setMode] = useState<PricingMode>("project");
  const [price, setPrice] = useState("");

  const priceNum = Number(price);
  const canSave = name.trim().length > 0 && Number.isFinite(priceNum) && priceNum > 0;

  const submit = () => {
    if (!canSave) return;
    const trimmed = name.trim();
    onCreate({
      id: localId("sv"),
      name: trimmed,
      category,
      description:
        "New blueprint — define deliverables and standard exclusions before quoting from it.",
      pricingMode: mode,
      basePrice: priceNum,
      targetMarginPct: 40,
      typicalTimelineWeeks: mode === "retainer" ? 26 : 8,
      deliverables: [],
      standardExclusions: [],
      revisionRounds: 2,
      usedCount: 0,
    });
    toast.success(
      "Blueprint added to the library",
      `"${trimmed}" starts at ${money(priceNum)}${mode === "retainer" ? "/mo" : ""} with a 40% target margin. Add deliverables and exclusions before first use.`
    );
    setName("");
    setCategory(CATEGORIES[0]);
    setMode("project");
    setPrice("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New service blueprint"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={!canSave} onClick={submit}>
            Add blueprint
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Service name" htmlFor="sv-name">
          <Input
            id="sv-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Conversion audit & roadmap"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="sv-category">
            <Select
              id="sv-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pricing mode">
            <Segmented<PricingMode>
              options={[
                { value: "project", label: "Fixed fee" },
                { value: "retainer", label: "Retainer" },
              ]}
              value={mode}
              onChange={setMode}
            />
          </Field>
        </div>
        <Field
          label={mode === "retainer" ? "Base price (EUR / month)" : "Base price (EUR)"}
          htmlFor="sv-price"
          hint="The anchor for the Standard tier — Lean and Premium are derived from it."
        >
          <Input
            id="sv-price"
            type="number"
            min={0}
            step={100}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={mode === "retainer" ? "2500" : "12000"}
            className="tnum font-mono"
          />
        </Field>
      </div>
    </Modal>
  );
}
