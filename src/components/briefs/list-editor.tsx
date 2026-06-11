"use client";

/* ================================================================
   ListEditor — bullet-list editing for success metrics,
   constraints, and dependencies. Rows show a remove (×) on
   hover; the input at the bottom adds on Enter.
   ================================================================ */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { Input } from "@/components/ui/fields";

export function ListEditor({
  title,
  items,
  onAdd,
  onRemove,
  addPlaceholder,
  emptyHint,
  marker = "check",
  className,
}: {
  title: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  addPlaceholder: string;
  emptyHint: string;
  /** "check" = CheckItem-style tick (success metrics), "dot" = neutral bullet */
  marker?: "check" | "dot";
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const next = draft.trim();
    if (!next) return;
    onAdd(next);
    setDraft("");
  };

  return (
    <div className={cx("panel flex flex-col px-4 py-3.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="microlabel">{title}</p>
        <span className="tnum font-mono text-[10.5px] text-ink-faint">{items.length}</span>
      </div>

      <ul className="mt-2 flex-1 space-y-0.5">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.li
              key={`${i}-${item}`}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } }}
              exit={{ opacity: 0, x: -8, transition: { duration: DUR.fast, ease: EASE } }}
              className="group flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-overlay"
            >
              {marker === "check" ? (
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-accent-line bg-accent-soft text-accent">
                  <Icon name="check" size={10} strokeWidth={2.4} />
                </span>
              ) : (
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" />
              )}
              <span className="flex-1 text-[13px] leading-snug text-ink">{item}</span>
              <button
                type="button"
                aria-label={`Remove "${item}"`}
                onClick={() => onRemove(i)}
                className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm text-ink-faint opacity-0 transition-[opacity,color,background-color] duration-150 group-hover:opacity-100 hover:bg-inset hover:text-danger focus-visible:opacity-100"
              >
                <Icon name="x" size={11} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <li className="px-2 py-1.5 text-[12.5px] leading-snug text-ink-faint">{emptyHint}</li>
        )}
      </ul>

      <div className="mt-2.5 flex items-center gap-2">
        <Input
          value={draft}
          placeholder={addPlaceholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          className="text-[12.5px]"
        />
        <button
          type="button"
          aria-label={`Add to ${title.toLowerCase()}`}
          onClick={add}
          disabled={!draft.trim()}
          className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-ink-mute transition-colors duration-150 hover:border-line-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon name="plus" size={13} />
        </button>
      </div>
    </div>
  );
}
