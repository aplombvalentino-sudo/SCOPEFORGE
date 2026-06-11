"use client";

/* ================================================================
   /services — productised offers: price, target margin, timeline,
   deliverables, and the exclusions that protect the margin.
   ================================================================ */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import type { ServiceBlueprint } from "@/lib/types";
import { listVariants } from "@/lib/motion";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/feedback";
import { ServiceCard } from "@/components/library/service-card";
import { ServiceDrawer } from "@/components/library/service-drawer";
import { NewServiceModal } from "@/components/library/new-service-modal";

export default function ServicesPage() {
  const storeServices = useApp((s) => s.services);
  const [localServices, setLocalServices] = useState<ServiceBlueprint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const all = useMemo(
    () => [...localServices, ...storeServices],
    [localServices, storeServices]
  );
  const localIds = useMemo(
    () => new Set(localServices.map((s) => s.id)),
    [localServices]
  );
  const selected = all.find((s) => s.id === selectedId) ?? null;

  return (
    <PageTransition>
      <PageHeader
        overline="LIBRARY / SERVICES"
        title="Service blueprints"
        description="Offers priced once, sold many times — deliverables, target margin, and standard exclusions agreed before any client asks."
        actions={
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={13} />
            New blueprint
          </Button>
        }
      />

      {all.length === 0 ? (
        <EmptyState
          icon="service"
          title="No service blueprints yet"
          body="A blueprint is an offer you never re-invent: base price, target margin, deliverables, and the standard exclusions. Scopes built from blueprints quote in minutes, not afternoons."
          action={
            <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
              <Icon name="plus" size={13} />
              New blueprint
            </Button>
          }
        />
      ) : (
        <>
          <motion.div
            variants={listVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3"
          >
            {all.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                isLocal={localIds.has(s.id)}
                onOpen={() => {
                  setSelectedId(s.id);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </motion.div>
          <p className="tnum mt-3 font-mono text-[11px] text-ink-faint">
            {all.length} blueprints
            {localServices.length > 0 && ` · ${localServices.length} added this session`}
            {" · used "}
            {all.reduce((sum, s) => sum + s.usedCount, 0)}× across all scopes
          </p>
        </>
      )}

      <ServiceDrawer
        service={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <NewServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(s) => setLocalServices((prev) => [s, ...prev])}
      />
    </PageTransition>
  );
}
