"use client";

/* Right rail for an onboarding flow: asset request checklist
   (copy-all to clipboard) and the two-sided stakeholder map. */

import { motion } from "framer-motion";
import { cx, initials } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import type { OnboardingFlow } from "@/lib/types";
import { useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/primitives";

export function AssetRequestsCard({ flow }: { flow: OnboardingFlow }) {
  const toast = useToast();

  function copyAll() {
    const text = flow.assetRequests.map((a, i) => `${i + 1}. ${a}`).join("\n");
    navigator.clipboard.writeText(text).catch(() => undefined);
    toast.success(
      "Asset list copied",
      `${flow.assetRequests.length} requests on your clipboard — paste into the kickoff email.`
    );
  }

  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon name="doc" size={13} className="text-ink-faint" />
          <h3 className="font-display text-[13.5px] font-medium tracking-tight text-ink">
            Asset requests
          </h3>
        </div>
        <button
          onClick={copyAll}
          className="inline-flex h-6 items-center gap-1 rounded-sm px-1.5 font-mono text-[10.5px] tracking-wide text-ink-faint uppercase transition-colors duration-150 hover:bg-accent-soft hover:text-accent"
        >
          <Icon name="copy" size={11} />
          Copy all
        </button>
      </header>
      <motion.ul
        variants={listVariants}
        initial="initial"
        animate="animate"
        className="divide-y divide-line"
      >
        {flow.assetRequests.map((asset) => (
          <motion.li
            key={asset}
            variants={itemVariants}
            className="flex items-start gap-2.5 px-4 py-2.5 transition-colors duration-150 hover:bg-overlay/60"
          >
            <span className="mt-[3px] h-2 w-2 shrink-0 rounded-sm border border-line-strong bg-inset" />
            <span className="text-[12.5px] leading-snug text-ink">{asset}</span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

export function StakeholderMapCard({ flow }: { flow: OnboardingFlow }) {
  const client = flow.stakeholders.filter((s) => s.side === "client");
  const agency = flow.stakeholders.filter((s) => s.side === "agency");

  const column = (label: string, people: typeof client, accentSide: boolean) => (
    <div className="min-w-0 flex-1">
      <p className={cx("microlabel mb-2", accentSide && "!text-accent")}>{label}</p>
      <ul className="space-y-2.5">
        {people.map((p) => (
          <li key={p.name} className="flex items-start gap-2">
            <Avatar initials={initials(p.name)} size={24} title={p.name} />
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-medium text-ink">{p.name}</p>
              <p className="text-[11px] leading-snug text-ink-faint">{p.role}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <Icon name="leads" size={13} className="text-ink-faint" />
        <h3 className="font-display text-[13.5px] font-medium tracking-tight text-ink">
          Stakeholder map
        </h3>
      </header>
      <div className="flex gap-4 px-4 py-3.5">
        {column("Client", client, false)}
        <span aria-hidden className="w-px self-stretch bg-line" />
        {column("Atelier North", agency, true)}
      </div>
    </section>
  );
}
