"use client";

/* Template inspect drawer — full description, send-order sections,
   stats, and the use/duplicate actions. */

import type { Template, TemplateKind } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { Drawer } from "@/components/ui/overlays";
import { Badge, Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/feedback";
import { TEMPLATE_KIND_META, TagChip } from "./bits";

const USE_COPY: Record<TemplateKind, string> = {
  proposal: "Section order and pricing structure copied — the draft is waiting under Proposals.",
  scope_module: "Module dropped into a fresh scope draft with its acceptance criteria intact.",
  onboarding: "Task groups and the 14-day plan skeleton copied into a new onboarding flow.",
  email: "Draft opened with merge fields for the recipient — review before sending.",
};

export function TemplateDrawer({
  template,
  open,
  onClose,
  onDuplicate,
}: {
  template: Template | null;
  open: boolean;
  onClose: () => void;
  onDuplicate: (t: Template) => void;
}) {
  const toast = useToast();
  if (!template) return null;
  const meta = TEMPLATE_KIND_META[template.kind];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={template.name}
      width={480}
      meta={
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{meta.label}</Badge>
          <span className="tnum font-mono text-[11px] text-ink-faint">
            Used {template.usedCount}× · updated {timeAgo(template.updatedAt)}
          </span>
        </div>
      }
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDuplicate(template)}
          >
            Duplicate
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              toast.success("Template applied to a new draft", USE_COPY[template.kind]);
              onClose();
            }}
          >
            Use template
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <p className="microlabel mb-1.5">What it codifies</p>
          <p className="text-[13px] leading-relaxed text-ink">{template.description}</p>
        </section>

        {template.sections && template.sections.length > 0 && (
          <section>
            <p className="microlabel mb-2">Sections — send order</p>
            <ol className="overflow-hidden rounded-md border border-line">
              {template.sections.map((s, i) => (
                <li
                  key={s}
                  className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2 transition-colors duration-100 last:border-b-0 hover:bg-overlay/50"
                >
                  <span className="tnum w-5 shrink-0 font-mono text-[10.5px] text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] text-ink">{s}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {template.tags.length > 0 && (
          <section>
            <p className="microlabel mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {template.tags.map((t) => (
                <TagChip key={t}>{t}</TagChip>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
          <div className="bg-inset px-3 py-2.5">
            <p className="microlabel">Times used</p>
            <p className="tnum mt-1 font-display text-[17px] font-medium">
              {template.usedCount}
            </p>
          </div>
          <div className="bg-inset px-3 py-2.5">
            <p className="microlabel">Sections</p>
            <p className="tnum mt-1 font-display text-[17px] font-medium">
              {template.sections?.length ?? "—"}
            </p>
          </div>
          <div className="bg-inset px-3 py-2.5">
            <p className="microlabel">Updated</p>
            <p className="tnum mt-1 font-mono text-[12px] font-medium text-ink">
              {timeAgo(template.updatedAt)}
            </p>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
