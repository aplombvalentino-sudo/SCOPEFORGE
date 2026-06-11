"use client";

/* ================================================================
   /templates — the consistency engine. Seeded library merged with
   session-local creations; kind filters, card grid, inspect drawer.
   ================================================================ */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import type { Template, TemplateKind } from "@/lib/types";
import { daysFromNow } from "@/lib/format";
import { listVariants } from "@/lib/motion";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Tabs, type TabDef } from "@/components/ui/tabs";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { TEMPLATE_KIND_META, localId } from "@/components/library/bits";
import { TemplateCard } from "@/components/library/template-card";
import { TemplateDrawer } from "@/components/library/template-drawer";
import { NewTemplateModal } from "@/components/library/new-template-modal";

type Filter = "all" | TemplateKind;

const FILTER_ORDER: TemplateKind[] = ["proposal", "scope_module", "onboarding", "email"];

export default function TemplatesPage() {
  const toast = useToast();
  const storeTemplates = useApp((s) => s.templates);
  const [localTemplates, setLocalTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const all = useMemo(
    () => [...localTemplates, ...storeTemplates],
    [localTemplates, storeTemplates]
  );
  const localIds = useMemo(
    () => new Set(localTemplates.map((t) => t.id)),
    [localTemplates]
  );

  const counts = useMemo(() => {
    const c: Record<TemplateKind, number> = {
      proposal: 0,
      scope_module: 0,
      onboarding: 0,
      email: 0,
    };
    for (const t of all) c[t.kind] += 1;
    return c;
  }, [all]);

  const filtered = filter === "all" ? all : all.filter((t) => t.kind === filter);
  const selected = all.find((t) => t.id === selectedId) ?? null;

  const tabs: TabDef<Filter>[] = [
    { value: "all", label: "All", count: all.length },
    ...FILTER_ORDER.map((k) => ({
      value: k as Filter,
      label: TEMPLATE_KIND_META[k].plural,
      count: counts[k],
    })),
  ];

  const duplicate = (t: Template) => {
    const copy: Template = {
      ...t,
      id: localId("tp"),
      name: `${t.name} (copy)`,
      usedCount: 0,
      updatedAt: daysFromNow(0, 10),
    };
    setLocalTemplates((prev) => [copy, ...prev]);
    setDrawerOpen(false);
    toast.success(
      "Template duplicated",
      `"${copy.name}" added to the library — adjust it without touching the original.`
    );
  };

  return (
    <PageTransition>
      <PageHeader
        overline="LIBRARY / TEMPLATES"
        title="Templates"
        description="Codified judgement: what good scope and pricing look like, reusable. Every send tightens the library."
        actions={
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={13} />
            New template
          </Button>
        }
      />

      <Tabs tabs={tabs} value={filter} onChange={setFilter} className="mb-4" />

      {filtered.length === 0 ? (
        <EmptyState
          icon="template"
          title={
            filter === "all"
              ? "The library is empty"
              : `No ${TEMPLATE_KIND_META[filter as TemplateKind].plural.toLowerCase()} yet`
          }
          body={
            filter === "all"
              ? "Templates turn one good proposal into the house standard. Save the first one and stop rewriting the same nine sections."
              : "Nothing of this kind in the library. Save one from a record you're proud of, or start blank."
          }
          action={
            <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
              <Icon name="plus" size={13} />
              New template
            </Button>
          }
        />
      ) : (
        <>
          <motion.div
            key={filter}
            variants={listVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isLocal={localIds.has(t.id)}
                onOpen={() => {
                  setSelectedId(t.id);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </motion.div>
          <p className="tnum mt-3 font-mono text-[11px] text-ink-faint">
            {filtered.length} of {all.length} templates shown
            {localTemplates.length > 0 &&
              ` · ${localTemplates.length} created this session`}
          </p>
        </>
      )}

      <TemplateDrawer
        template={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onDuplicate={duplicate}
      />

      <NewTemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(t) => setLocalTemplates((prev) => [t, ...prev])}
      />
    </PageTransition>
  );
}
