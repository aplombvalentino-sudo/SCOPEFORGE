"use client";

/* /change-orders — the scope-control register. Every "quick addition"
   gets classified against the signed scope, priced, and answered in
   writing before it eats the margin. */

import { useState } from "react";
import { motion } from "framer-motion";
import { analytics } from "@/lib/demo-data";
import { money } from "@/lib/format";
import { listVariants } from "@/lib/motion";
import { useApp } from "@/lib/store";
import {
  ChangeOrderCard,
  ClassificationLegend,
} from "@/components/delivery/change-order-card";
import { NewChangeRequest } from "@/components/delivery/new-change-request";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { KpiCard } from "@/components/ui/kpi";
import { PageHeader, PageTransition, Section } from "@/components/ui/page";
import { Button } from "@/components/ui/primitives";

export default function ChangeOrdersPage() {
  const changeOrders = useApp((s) => s.changeOrders);
  const [requestOpen, setRequestOpen] = useState(false);

  const sorted = [...changeOrders].sort(
    (a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt)
  );
  const openCount = changeOrders.filter((c) => c.status === "open").length;

  return (
    <PageTransition>
      <PageHeader
        overline="DELIVERY / CHANGE ORDERS"
        title="Change orders"
        description='Every "quick addition" gets classified, priced, and answered in writing — before it eats the margin.'
        actions={
          <Button variant="primary" onClick={() => setRequestOpen(true)}>
            <Icon name="plus" size={14} />
            New change request
          </Button>
        }
      />

      {/* KPI band */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Open requests"
          value={openCount}
          icon="change-order"
          footer={
            <span className="text-[11px] text-ink-faint">awaiting a written answer</span>
          }
        />
        <KpiCard
          label="Recovered value YTD"
          value={analytics.scopeCreepRecoveredValue}
          render={(v) => money(v)}
          icon="euro"
          footer={
            <span className="text-[11px] text-ink-faint">
              billed work that used to be absorbed
            </span>
          }
        />
        <KpiCard
          label="Creep caught YTD"
          value={analytics.scopeCreepCaught}
          icon="shield"
          footer={
            <span className="text-[11px] text-ink-faint">
              requests intercepted before build
            </span>
          }
        />
      </div>

      {/* classification legend */}
      <ClassificationLegend className="mb-5" />

      {sorted.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="change-order"
            title="No change requests logged"
            body="When a client asks for 'one quick thing', log it here — it gets classified against the scope doc, priced, and answered in writing."
            action={
              <Button variant="primary" onClick={() => setRequestOpen(true)}>
                <Icon name="plus" size={14} />
                New change request
              </Button>
            }
          />
        </div>
      ) : (
        <Section
          title="Request log"
          description="Most recent first — every request gets an answer in writing."
        >
          <motion.div
            variants={listVariants}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            {sorted.map((order) => (
              <ChangeOrderCard key={order.id} order={order} />
            ))}
          </motion.div>
        </Section>
      )}

      <NewChangeRequest open={requestOpen} onClose={() => setRequestOpen(false)} />
    </PageTransition>
  );
}
