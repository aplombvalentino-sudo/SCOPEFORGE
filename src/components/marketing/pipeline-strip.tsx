"use client";

/* ================================================================
   The chain: intake → brief → scope → price → proposal → onboarding
   as a connected horizontal diagram. Hover brightens the detail
   line and the connector — a dense technical strip, not a feature
   grid.
   ================================================================ */

import { motion } from "framer-motion";
import { itemVariants, listVariants } from "@/lib/motion";
import { Icon, type IconName } from "@/components/ui/icons";
import { MarketingSection, SectionIntro, VIEWPORT } from "./shared";

const STAGES: {
  num: string;
  icon: IconName;
  name: string;
  sub: string;
  detail: string;
}[] = [
  {
    num: "01",
    icon: "inbox",
    name: "Intake",
    sub: "Paste anything",
    detail:
      "Email, call notes, Loom, transcript — parsed into goals, gaps, budget signals, and risks with a confidence score.",
  },
  {
    num: "02",
    icon: "brief",
    name: "Brief",
    sub: "Confirmable, not vague",
    detail:
      "Stakeholders, constraints, success metrics — with open questions tracked until the client actually answers them.",
  },
  {
    num: "03",
    icon: "scope",
    name: "Scope",
    sub: "Exclusions included",
    detail:
      "Deliverables, assumptions, revision rounds — and the exclusion lines your change orders will cite later.",
  },
  {
    num: "04",
    icon: "euro",
    name: "Price",
    sub: "Margin-checked",
    detail:
      "Three tiers costed against your floor. If Lean drops below 35%, you hear about it before the client does.",
  },
  {
    num: "05",
    icon: "proposal",
    name: "Proposal",
    sub: "Assembled, tracked",
    detail:
      "Built from the approved scope, sent with view tracking, follow-up sequence armed the moment you hit send.",
  },
  {
    num: "06",
    icon: "onboarding",
    name: "Onboarding",
    sub: "Day-1 ready",
    detail:
      "Won flips straight into the kickoff checklist, access requests, and a 14-day plan the client can see.",
  },
];

export function PipelineStrip() {
  return (
    <MarketingSection className="border-y border-line bg-surface/50 py-16">
      <SectionIntro
        overline="The chain"
        title="One chain from first email to kickoff. Nothing re-typed."
        lede="Each module hands a structured artifact to the next. The intake feeds the brief, the brief feeds the scope, the scope prices the proposal — and the signed proposal becomes the onboarding plan."
      />
      <motion.ol
        variants={listVariants}
        initial="initial"
        whileInView="animate"
        viewport={VIEWPORT}
        className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
      >
        {STAGES.map((s, i) => (
          <motion.li key={s.name} variants={itemVariants} className="group relative">
            {i < STAGES.length - 1 && (
              <span
                aria-hidden
                className="absolute top-[26px] -right-[13px] z-10 hidden text-ink-faint transition-colors duration-200 group-hover:text-accent lg:block"
              >
                <Icon name="arrow-right" size={12} />
              </span>
            )}
            <div className="panel h-full px-3.5 py-3.5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-line hover:shadow-e2">
              <div className="flex items-center justify-between">
                <Icon
                  name={s.icon}
                  size={15}
                  className="text-ink-mute transition-colors duration-200 group-hover:text-accent"
                />
                <span className="tnum font-mono text-[10px] text-ink-faint">{s.num}</span>
              </div>
              <p className="mt-2.5 font-display text-[14px] font-medium tracking-tight">
                {s.name}
              </p>
              <p className="microlabel mt-0.5">{s.sub}</p>
              <p className="mt-2 text-[11.5px] leading-snug text-ink-faint transition-colors duration-200 group-hover:text-ink-mute">
                {s.detail}
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ol>
      <p className="tnum mt-6 font-mono text-[11px] tracking-wide text-ink-faint">
        MEDIAN INTAKE→SENT: 2.1 DAYS · EVERY ARTIFACT CROSS-LINKED · THE CHANGE ORDER CITES THE
        SCOPE LINE
      </p>
    </MarketingSection>
  );
}
