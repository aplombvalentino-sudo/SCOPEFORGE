"use client";

/* ================================================================
   FAQ accordion — real questions with real answers. The landing
   page shows all six; /pricing shows a subset.
   ================================================================ */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/format";
import { collapseVariants, DUR, EASE } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { MarketingSection, Reveal, SectionIntro } from "./shared";

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Where does our client data live?",
    a: "EU-hosted in Frankfurt, encrypted at rest and in transit, scoped to your workspace. Your intakes, scopes, and pricing are never used to train models — ours or anyone else's. Everything exports as JSON or CSV whenever you want it.",
  },
  {
    q: "What does the AI actually do?",
    a: "It drafts everything; you approve everything. Intake analysis extracts goals, gaps, and budget signals from raw text. The scope engine assembles deliverables and exclusions from your service blueprints. Margin guidance flags tiers below your floor. Follow-up drafts reference what the client re-read. Nothing leaves the building without a human click.",
  },
  {
    q: "Can we migrate our existing proposals and price lists?",
    a: "Yes. Service blueprints import from spreadsheets; proposal templates rebuild from Google Docs, Notion, or PandaDoc exports. Agency-plan workspaces get a concierge migration — most teams send their first Scopeforge proposal inside a week.",
  },
  {
    q: "Does Scopeforge replace our contracts?",
    a: "No — it produces the scope document and the proposal your contract references, with e-signature on the proposal itself. Your terms stay your terms. Our job is making sure the scope they point at is precise enough to defend when the “small favour” requests start.",
  },
  {
    q: "We're four people. Is this overkill?",
    a: "Scopeforge is built for 3–25 person teams. At four people the win is speed: intake to sent proposal in a day or two, with the pricing discipline you'd otherwise need an ops hire to enforce. The Studio plan exists precisely for this stage.",
  },
  {
    q: "What does the AI not do?",
    a: "It doesn't email clients on its own, doesn't change a price, doesn't accept or decline change orders, and doesn't move a deal stage. Every send, every price, every classification is a human decision — the system's job is to make that decision fast and well-informed.",
  },
];

export function FaqAccordion({
  items,
  className,
}: {
  items: FaqItem[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={cx("overflow-hidden rounded-lg border border-line bg-surface", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={cx(i > 0 && "border-t border-line")}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-overlay/60"
            >
              <span
                className={cx(
                  "text-[13.5px] font-medium transition-colors duration-150",
                  isOpen ? "text-ink" : "text-ink-mute"
                )}
              >
                {item.q}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: DUR.base, ease: EASE }}
                className={cx("shrink-0", isOpen ? "text-accent" : "text-ink-faint")}
              >
                <Icon name="chevron-down" size={14} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  variants={collapseVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-[13px] leading-relaxed text-ink-mute">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/** Landing-page FAQ section wrapper. */
export function FaqSection() {
  return (
    <MarketingSection className="border-t border-line py-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <SectionIntro
          overline="Questions agencies ask"
          title="The honest answers, before the demo."
          lede="Including the one everyone should ask about AI products: what does it not do."
        />
        <Reveal delay={0.08}>
          <FaqAccordion items={FAQ_ITEMS} />
        </Reveal>
      </div>
    </MarketingSection>
  );
}
