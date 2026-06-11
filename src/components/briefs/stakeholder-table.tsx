"use client";

/* ================================================================
   StakeholderEditor — the brief's decision map. Table-style rows
   (name, role, influence badge) with an inline add row.
   ================================================================ */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Brief } from "@/lib/types";
import { DUR, EASE } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/primitives";
import { Input, Select } from "@/components/ui/fields";
import { INFLUENCE_TONE } from "./brief-meta";

type Stakeholder = Brief["stakeholders"][number];
type Influence = Stakeholder["influence"];

export function StakeholderEditor({
  stakeholders,
  onAdd,
  onRemove,
}: {
  stakeholders: Stakeholder[];
  onAdd: (s: Stakeholder) => void;
  onRemove: (index: number) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [influence, setInfluence] = useState<Influence>("input");

  const valid = name.trim().length > 0 && role.trim().length > 0;

  const add = () => {
    if (!valid) return;
    onAdd({ name: name.trim(), role: role.trim(), influence });
    setName("");
    setRole("");
    setInfluence("input");
  };

  return (
    <div className="panel px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="microlabel">Stakeholders</p>
        <span className="tnum font-mono text-[10.5px] text-ink-faint">
          {stakeholders.length}
        </span>
      </div>

      <div className="mt-2 divide-y divide-line">
        <AnimatePresence initial={false}>
          {stakeholders.map((s, i) => (
            <motion.div
              key={`${s.name}-${i}`}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } }}
              exit={{ opacity: 0, x: -8, transition: { duration: DUR.fast, ease: EASE } }}
              className="group flex items-center gap-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{s.name}</p>
                <p className="truncate text-[12px] text-ink-mute">{s.role}</p>
              </div>
              <Badge tone={INFLUENCE_TONE[s.influence]}>{s.influence}</Badge>
              <button
                type="button"
                aria-label={`Remove ${s.name}`}
                onClick={() => onRemove(i)}
                className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm text-ink-faint opacity-0 transition-[opacity,color,background-color] duration-150 group-hover:opacity-100 hover:bg-inset hover:text-danger focus-visible:opacity-100"
              >
                <Icon name="x" size={11} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {stakeholders.length === 0 && (
          <p className="py-2 text-[12.5px] text-ink-faint">
            No stakeholders mapped — every unmapped approver is a late-stage revision waiting
            to happen.
          </p>
        )}
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2 border-t border-line pt-3 sm:grid-cols-[1fr_1.3fr_auto_auto]">
        <Input
          value={name}
          placeholder="Name"
          aria-label="Stakeholder name"
          onChange={(e) => setName(e.target.value)}
          className="text-[12.5px]"
        />
        <Input
          value={role}
          placeholder="Role — e.g. CFO, final sign-off"
          aria-label="Stakeholder role"
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          className="text-[12.5px]"
        />
        <Select
          value={influence}
          aria-label="Influence"
          onChange={(e) => setInfluence(e.target.value as Influence)}
          className="text-[12.5px]"
        >
          <option value="decision">decision</option>
          <option value="input">input</option>
          <option value="informed">informed</option>
        </Select>
        <button
          type="button"
          aria-label="Add stakeholder"
          onClick={add}
          disabled={!valid}
          className="flex h-8.5 w-8.5 items-center justify-center justify-self-end rounded-md border border-line bg-raised text-ink-mute transition-colors duration-150 hover:border-line-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40 sm:justify-self-auto"
        >
          <Icon name="plus" size={13} />
        </button>
      </div>
    </div>
  );
}
