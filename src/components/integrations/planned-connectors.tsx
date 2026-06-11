"use client";

/* ================================================================
   Planned connectors — roadmap chips. Honest: no fake Connect
   buttons, just a way to weigh in on priority.
   ================================================================ */

import { motion } from "framer-motion";
import { itemVariants, listVariants } from "@/lib/motion";
import { PLANNED_CONNECTORS } from "@/lib/integrations";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/feedback";

export function PlannedConnectors() {
  const toast = useToast();
  return (
    <motion.div
      variants={listVariants}
      initial="initial"
      animate="animate"
      className="flex flex-wrap gap-2"
    >
      {PLANNED_CONNECTORS.map((c) => (
        <motion.div
          key={c.name}
          variants={itemVariants}
          className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 opacity-80"
        >
          <div>
            <p className="text-[12.5px] font-medium text-ink-mute">{c.name}</p>
            <p className="microlabel">{c.area}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toast.info(`Noted — ${c.name} moved up the list for your workspace`)
            }
          >
            Request priority
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}
