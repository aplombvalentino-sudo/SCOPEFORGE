"use client";

/* ================================================================
   EditableSection — the brief builder's core editing pattern.
   View: panel with microlabel title + pen button.
   Edit: textarea with local state, Save / Cancel, ⌘↵ shortcut.
   ================================================================ */

import { useState } from "react";
import { motion } from "framer-motion";
import { cx } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { Button, Kbd } from "@/components/ui/primitives";
import { Textarea } from "@/components/ui/fields";

export function EditableSection({
  title,
  value,
  placeholder,
  emptyHint,
  compact = false,
  onSave,
  className,
}: {
  /** microlabel above the body, e.g. "Client context" */
  title: string;
  value: string;
  placeholder: string;
  /** shown in faint ink when the section is empty */
  emptyHint: string;
  /** smaller textarea for one-liner notes (budget, timeline) */
  compact?: boolean;
  onSave: (next: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const empty = value.trim().length === 0;

  const begin = () => {
    setDraft(value);
    setEditing(true);
  };

  const save = () => {
    const next = draft.trim();
    setEditing(false);
    if (next !== value.trim()) onSave(next);
  };

  return (
    <motion.div
      layout
      transition={{ duration: DUR.base, ease: EASE }}
      className={cx("panel group px-4 py-3.5", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="microlabel">{title}</p>
        {!editing && (
          <button
            type="button"
            aria-label={`Edit ${title.toLowerCase()}`}
            onClick={begin}
            className={cx(
              "flex h-6 w-6 items-center justify-center rounded-sm text-ink-faint transition-[opacity,color,background-color] duration-150 hover:bg-overlay hover:text-ink focus-visible:opacity-100",
              empty ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            <Icon name="pen" size={13} />
          </button>
        )}
      </div>

      {editing ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: DUR.fast } }}
          className="mt-2.5"
        >
          <Textarea
            autoFocus
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(false);
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
            }}
            className={compact ? "!min-h-14" : "min-h-24"}
          />
          <div className="mt-2.5 flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={save}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <span className="ml-auto hidden items-center gap-1 sm:flex">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
              <span className="font-mono text-[10px] text-ink-faint">to save</span>
            </span>
          </div>
        </motion.div>
      ) : (
        <p
          className={cx(
            "mt-2 text-[13px] leading-relaxed whitespace-pre-line",
            empty ? "text-ink-faint" : "text-ink"
          )}
        >
          {empty ? emptyHint : value}
        </p>
      )}
    </motion.div>
  );
}
