"use client";

/* Template library card — kind badge, name, tags, usage stats. */

import { motion } from "framer-motion";
import type { Template } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { itemVariants } from "@/lib/motion";
import { Badge } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { TEMPLATE_KIND_META, TagChip } from "./bits";

export function TemplateCard({
  template,
  isLocal,
  onOpen,
}: {
  template: Template;
  /** created or duplicated in this session — not part of the seed library */
  isLocal?: boolean;
  onOpen: () => void;
}) {
  const meta = TEMPLATE_KIND_META[template.kind];
  return (
    <motion.button
      type="button"
      variants={itemVariants}
      layout
      onClick={onOpen}
      className="panel group flex h-full flex-col px-4 py-3.5 text-left transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-e1"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <Badge>
          <Icon name={meta.icon} size={10} />
          {meta.label}
        </Badge>
        {isLocal ? (
          <Badge tone="accent">this session</Badge>
        ) : (
          <Icon
            name="chevron-right"
            size={13}
            className="text-ink-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          />
        )}
      </div>

      <div className="w-full flex-1">
        <h3 className="mt-2.5 font-display text-[14px] leading-snug font-medium tracking-tight text-ink">
          {template.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-mute">
          {template.description}
        </p>
        {template.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {template.tags.map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex w-full items-center justify-between border-t border-line pt-2.5">
        <span className="tnum font-mono text-[11px] text-ink-mute">
          Used {template.usedCount}×
        </span>
        <span className="font-mono text-[11px] text-ink-faint">
          {timeAgo(template.updatedAt)}
        </span>
      </div>
    </motion.button>
  );
}
