"use client";

/* /onboarding — every won deal's kickoff flow, active first. */

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { listVariants } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { FlowCard } from "@/components/delivery/flow-card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Button } from "@/components/ui/primitives";

export default function OnboardingPage() {
  const router = useRouter();
  const flows = useApp((s) => s.onboardingFlows);

  const sorted = [...flows].sort((a, b) => {
    const doneA = a.tasks.length > 0 && a.tasks.every((t) => t.done) ? 1 : 0;
    const doneB = b.tasks.length > 0 && b.tasks.every((t) => t.done) ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB; // active flows first
    return +new Date(b.kickoffDate) - +new Date(a.kickoffDate);
  });
  const active = sorted.filter((f) => f.tasks.some((t) => !t.done)).length;

  return (
    <PageTransition>
      <PageHeader
        overline="DELIVERY / ONBOARDING"
        title="Onboarding"
        description="Won is not done. Standardized kickoff turns a signature into momentum."
        actions={
          flows.length > 0 ? (
            <span className="tnum font-mono text-[11px] text-ink-faint">
              {active} active · {flows.length - active} delivered
            </span>
          ) : undefined
        }
      />

      {flows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="onboarding"
            title="No onboarding flows yet"
            body="Accepted proposals generate onboarding flows — accept one to see it here."
            action={
              <Button variant="primary" onClick={() => router.push("/proposals")}>
                Review proposals
              </Button>
            }
          />
        </div>
      ) : (
        <motion.div
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="grid items-stretch gap-3 md:grid-cols-2"
        >
          {sorted.map((flow) => (
            <FlowCard key={flow.id} flow={flow} />
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
}
