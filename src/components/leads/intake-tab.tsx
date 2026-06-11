"use client";

/* Intake tab — raw source material on the left, analysis (or run state) on the right. */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIntegrations } from "@/lib/integrations-store";
import { useApp } from "@/lib/store";
import type { Lead } from "@/lib/types";
import { DUR, EASE } from "@/lib/motion";
import { DrivePickerModal } from "@/components/leads/drive-picker";
import { ProvenanceChip } from "@/components/leads/provenance-chip";
import { RingGauge } from "@/components/ui/charts";
import { EmptyState, Skeleton, useToast } from "@/components/ui/feedback";
import { Icon, type IconName } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";

const WORKING_STEPS = [
  "Reading intake…",
  "Extracting goals and constraints…",
  "Scanning for budget and timeline signals…",
  "Drafting clarification questions…",
];

function WorkingPanel() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % WORKING_STEPS.length), 600);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="panel px-4 py-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft">
          <Icon name="sparkle" size={14} className="text-accent" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink">Intake analysis running</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: DUR.fast, ease: EASE }}
              className="font-mono text-[11px] text-ink-faint"
            >
              {WORKING_STEPS[step]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <div className="pt-2" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3.5 w-4/5" />
        <div className="pt-2" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
    </div>
  );
}

function SignalChips({ label, icon, clues }: { label: string; icon: IconName; clues: string[] }) {
  return (
    <div>
      <p className="microlabel mb-1.5 flex items-center gap-1.5">
        <Icon name={icon} size={11} />
        {label}
      </p>
      {clues.length === 0 ? (
        <p className="text-[12px] text-ink-faint italic">No signal detected in the raw intake.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {clues.map((clue) => (
            <span
              key={clue}
              className="rounded-sm border border-line bg-inset px-1.5 py-1 font-mono text-[11px] leading-snug text-ink-mute"
            >
              {clue}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalysisList({
  title,
  icon,
  iconClass,
  items,
}: {
  title: string;
  icon: IconName;
  iconClass: string;
  items: string[];
}) {
  return (
    <div>
      <p className="microlabel mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink">
            <Icon name={icon} size={12} className={`mt-0.5 shrink-0 ${iconClass}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IntakeTab({ lead }: { lead: Lead }) {
  const toast = useToast();
  const runIntakeAnalysis = useApp((s) => s.runIntakeAnalysis);
  const analyzing = useApp((s) => s.analyzingLeadId) === lead.id;
  const driveGranted = useIntegrations((s) => s.capabilityGranted("google", "drive_files"));
  const [driveOpen, setDriveOpen] = useState(false);
  const analysis = lead.intakeAnalysis;

  async function copyQuestion(q: string) {
    try {
      await navigator.clipboard.writeText(q);
      toast.success("Question copied", "Paste it into your next email or call agenda.");
    } catch {
      toast.error("Couldn't copy", "Clipboard access was blocked by the browser.");
    }
  }

  const confidenceTone =
    analysis && analysis.confidence >= 70 ? "accent" : analysis && analysis.confidence >= 50 ? "warn" : "danger";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* raw intake */}
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="microlabel">
            Raw intake · {lead.rawIntake ? `${lead.rawIntake.length} chars` : "none"}
          </p>
          {driveGranted && (
            <Button size="sm" variant="secondary" onClick={() => setDriveOpen(true)}>
              <Icon name="doc" size={12} />
              Attach from Drive
            </Button>
          )}
        </div>
        {lead.provenance && <ProvenanceChip provenance={lead.provenance} />}
        {lead.rawIntake ? (
          <div className="well max-h-[520px] overflow-y-auto px-4 py-3.5">
            <pre className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-ink-mute">
              {lead.rawIntake}
            </pre>
          </div>
        ) : (
          <div className="well">
            <EmptyState
              icon="inbox"
              title="No source material on file"
              body="This lead was added manually. Paste the original email, call notes, or transcript via Import lead to give the analysis something to read."
            />
          </div>
        )}
      </div>

      {/* analysis */}
      <div className="min-w-0">
        <p className="microlabel mb-2">Intake analysis</p>
        <AnimatePresence mode="wait" initial={false}>
          {analysis ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.slow, ease: EASE }}
              className="panel space-y-5 px-4 py-4"
            >
              <div className="flex items-start gap-4">
                <RingGauge
                  value={analysis.confidence}
                  size={72}
                  label="complete"
                  tone={confidenceTone}
                />
                <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink">
                  {analysis.summary}
                </p>
              </div>

              <AnalysisList
                title="Extracted goals"
                icon="target"
                iconClass="text-accent"
                items={analysis.goals}
              />
              <AnalysisList
                title="Missing information"
                icon="search"
                iconClass="text-warn"
                items={analysis.missingInfo}
              />
              <AnalysisList
                title="Risks"
                icon="alert-triangle"
                iconClass="text-danger"
                items={analysis.risks}
              />

              <div className="grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <SignalChips label="Timeline signals" icon="clock" clues={analysis.timelineClues} />
                <SignalChips label="Budget signals" icon="euro" clues={analysis.budgetClues} />
              </div>

              <div className="border-t border-line pt-4">
                <p className="microlabel mb-2">Suggested clarification questions</p>
                <ul className="space-y-1.5">
                  {analysis.suggestedQuestions.map((q) => (
                    <li
                      key={q}
                      className="group flex items-start gap-2 rounded-md border border-line bg-inset/60 px-2.5 py-2"
                    >
                      <span className="flex-1 text-[12.5px] leading-snug text-ink">{q}</span>
                      <button
                        onClick={() => copyQuestion(q)}
                        aria-label="Copy question"
                        title="Copy to clipboard"
                        className="mt-0.5 shrink-0 rounded-sm p-1 text-ink-faint opacity-0 transition-[opacity,color,background-color] duration-150 group-hover:opacity-100 hover:bg-overlay hover:text-accent focus-visible:opacity-100"
                      >
                        <Icon name="copy" size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : analyzing ? (
            <motion.div
              key="working"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.fast }}
            >
              <WorkingPanel />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.fast }}
              className="panel blueprint blueprint-fade"
            >
              <EmptyState
                icon="sparkle"
                title="Not analyzed yet"
                body="Intake analysis reads the raw material and extracts goals, missing information, risks, budget and timeline signals, plus the clarification questions worth asking before you scope."
                action={
                  <Button
                    variant="primary"
                    disabled={!lead.rawIntake}
                    onClick={() => runIntakeAnalysis(lead.id)}
                  >
                    <Icon name="sparkle" size={14} />
                    Run intake analysis
                  </Button>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DrivePickerModal open={driveOpen} onClose={() => setDriveOpen(false)} lead={lead} />
    </div>
  );
}
