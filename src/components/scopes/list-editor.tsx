"use client";

/* ================================================================
   Guardrail list editor — the shared add/remove pattern for
   exclusions, assumptions, acceptance criteria, and dependencies.
   Tone drives the bullet tint; copy comes from the parent.
   ================================================================ */

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { cx } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { Icon, type IconName } from "@/components/ui/icons";
import { Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/primitives";

export type EditorTone = "danger" | "info" | "ok" | "neutral";

const markerClasses: Record<EditorTone, string> = {
  danger: "bg-danger",
  info: "bg-info",
  ok: "bg-ok",
  neutral: "bg-ink-faint",
};

const headerIconClasses: Record<EditorTone, string> = {
  danger: "text-danger",
  info: "text-info",
  ok: "text-ok",
  neutral: "text-ink-faint",
};

export function ListEditor({
  title,
  microcopy,
  icon,
  tone = "neutral",
  itemIcon,
  items,
  onAdd,
  onRemove,
  placeholder,
  emptyHint,
  className,
}: {
  title: string;
  /** one-line editorial framing under the title */
  microcopy: string;
  icon: IconName;
  tone?: EditorTone;
  /** when set, items get this icon instead of a tinted bullet */
  itemIcon?: IconName;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  emptyHint: string;
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  }

  return (
    <section className={cx("panel px-4 py-3.5", className)}>
      <header className="flex items-center gap-2">
        <Icon name={icon} size={14} className={headerIconClasses[tone]} />
        <h3 className="font-display text-[13.5px] font-medium tracking-tight text-ink">
          {title}
        </h3>
        <span className="tnum ml-auto font-mono text-[10.5px] text-ink-faint">
          {items.length}
        </span>
      </header>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-mute">{microcopy}</p>

      {items.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-line px-3 py-2.5 text-[12px] leading-relaxed text-ink-faint">
          {emptyHint}
        </p>
      ) : (
        <motion.ul
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="-mx-2 mt-2.5 space-y-0.5"
        >
          {items.map((item, i) => (
            <motion.li
              key={`${i}-${item.slice(0, 32)}`}
              layout
              variants={itemVariants}
              className="group flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-100 hover:bg-overlay/60"
            >
              {itemIcon ? (
                <Icon
                  name={itemIcon}
                  size={13}
                  className={cx("mt-0.5 shrink-0", headerIconClasses[tone])}
                />
              ) : (
                <span
                  className={cx(
                    "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full",
                    markerClasses[tone]
                  )}
                />
              )}
              <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink">
                {item}
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove "${item}"`}
                className="mt-0.5 shrink-0 text-ink-faint opacity-0 transition-[opacity,color] duration-100 group-hover:opacity-100 hover:text-danger"
              >
                <Icon name="x" size={12} />
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}

      <form onSubmit={submit} className="mt-3 flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={`Add to ${title.toLowerCase()}`}
          className="h-7.5 text-[12.5px]"
        />
        <Button type="submit" variant="ghost" size="sm" disabled={!draft.trim()}>
          <Icon name="plus" size={13} />
          Add
        </Button>
      </form>
    </section>
  );
}
