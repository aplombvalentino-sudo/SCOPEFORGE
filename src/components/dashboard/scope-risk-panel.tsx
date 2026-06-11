"use client";

/* Scope risk rail — open deals flagged medium/high, riskNote excerpts, deep links. */

import Link from "next/link";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { moneyCompact } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { RiskBadge } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { DashPanel } from "./panel";
import type { RiskLevel } from "@/lib/types";

const RISK_WEIGHT: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };

export function ScopeRiskPanel() {
  const leads = useApp((s) => s.leads);

  const risky = leads
    .filter(
      (l) =>
        l.stage !== "won" &&
        l.stage !== "lost" &&
        (l.risk === "high" || l.risk === "medium")
    )
    .sort((a, b) => RISK_WEIGHT[a.risk] - RISK_WEIGHT[b.risk] || b.value - a.value);

  const exposure = risky.reduce((sum, l) => sum + l.value, 0);

  return (
    <DashPanel
      title="Scope risk"
      caption={
        risky.length === 0
          ? "No flagged deals"
          : `${risky.length} flagged deals · ${moneyCompact(exposure)} exposed`
      }
      bodyClassName="px-1.5 py-1.5"
    >
      {risky.length === 0 ? (
        <EmptyState
          icon="shield"
          title="No scope risk flagged"
          body="When a deal picks up creep signals or delivery risk, it appears here with the risk note."
        />
      ) : (
        <motion.ul
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="divide-y divide-line/60"
        >
          {risky.map((l) => (
            <motion.li key={l.id} variants={itemVariants} layout>
              <Link
                href={`/leads/${l.id}`}
                className="group block rounded-md px-2.5 py-2.5 transition-colors duration-150 hover:bg-overlay/70"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium text-ink">
                      {l.company}
                    </span>
                    <Icon
                      name="arrow-up-right"
                      size={11}
                      className="shrink-0 text-ink-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    />
                  </span>
                  <RiskBadge level={l.risk} className="shrink-0" />
                </span>
                <span className="mt-1 line-clamp-2 block text-[12px] leading-snug text-ink-mute">
                  {l.riskNote ?? l.summary}
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </DashPanel>
  );
}
