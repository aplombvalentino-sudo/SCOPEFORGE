"use client";

/* ================================================================
   OpenQuestionsPanel — the right-rail blocker list. Unanswered
   questions take an inline answer; "Suggest clarifying questions"
   runs a short simulated pass over constraints + stakeholders.
   ================================================================ */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Brief } from "@/lib/types";
import { useApp } from "@/lib/store";
import { cx } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";
import { Badge, Button } from "@/components/ui/primitives";
import { Textarea } from "@/components/ui/fields";
import { Skeleton, useToast } from "@/components/ui/feedback";
import { suggestClarifyingQuestions, unansweredCount } from "./brief-meta";

const THINKING_STEPS = [
  "Reading constraints…",
  "Cross-checking stakeholder map…",
] as const;

export function OpenQuestionsPanel({
  brief,
  leadCompany,
  leadId,
}: {
  brief: Brief;
  leadCompany: string;
  leadId: string;
}) {
  const answerBriefQuestion = useApp((s) => s.answerBriefQuestion);
  const updateBrief = useApp((s) => s.updateBrief);
  const logActivity = useApp((s) => s.logActivity);
  const toast = useToast();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [suggesting, setSuggesting] = useState(false);
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const unanswered = unansweredCount(brief);

  const saveAnswer = (questionId: string) => {
    const answer = (drafts[questionId] ?? "").trim();
    if (!answer) return;
    answerBriefQuestion(brief.id, questionId, answer);
    setDrafts((d) => ({ ...d, [questionId]: "" }));
    const remaining = unanswered - 1;
    if (remaining === 0) {
      toast.success(
        "Question resolved — brief is clear to confirm",
        `Nothing blocks the ${leadCompany} brief now.`
      );
      logActivity(
        "brief_updated",
        `Last open question on the ${leadCompany} brief answered`,
        leadId
      );
    } else {
      toast.success(
        `Question resolved — ${remaining} remaining`,
        `Recorded on the ${leadCompany} brief.`
      );
    }
  };

  const suggest = () => {
    setSuggesting(true);
    setStep(0);
    timers.current.push(setTimeout(() => setStep(1), 650));
    timers.current.push(
      setTimeout(() => {
        const fresh =
          useApp.getState().briefs.find((b) => b.id === brief.id) ?? brief;
        const questions = suggestClarifyingQuestions(fresh);
        setSuggesting(false);
        if (questions.length === 0) {
          toast.info(
            "No new gaps detected",
            "Every suggested clarification is already on this brief's list."
          );
          return;
        }
        const stamp = Date.now();
        updateBrief(brief.id, {
          openQuestions: [
            ...fresh.openQuestions,
            ...questions.map((question, i) => ({
              id: `q-sg-${stamp}-${i}`,
              question,
              answered: false,
            })),
          ],
        });
        toast.info(
          `${questions.length} clarifying question${questions.length === 1 ? "" : "s"} drafted`,
          "Phrased from this brief's constraints and stakeholder map — edit before sending to the client."
        );
      }, 1200)
    );
  };

  return (
    <div className="panel px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="microlabel">Open questions</p>
        {brief.openQuestions.length > 0 &&
          (unanswered > 0 ? (
            <Badge tone="warn">{unanswered} open</Badge>
          ) : (
            <Badge tone="ok">all answered</Badge>
          ))}
      </div>

      <div className="mt-2.5 space-y-3">
        <AnimatePresence initial={false}>
          {brief.openQuestions.map((q) => (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: DUR.fast } }}
              className={cx(
                "rounded-md border px-3 py-2.5",
                q.answered ? "border-line bg-inset/40" : "border-warn/25 bg-surface"
              )}
            >
              {q.answered ? (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
                    <Icon name="check" size={10} strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] leading-snug text-ink-mute">{q.question}</p>
                    {q.answer && (
                      <p className="mt-1.5 border-l-2 border-line pl-2 text-[12.5px] leading-snug text-ink-faint">
                        {q.answer}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-warn-soft font-mono text-[10px] font-semibold text-warn">
                      ?
                    </span>
                    <p className="text-[13px] leading-snug font-medium text-ink">
                      {q.question}
                    </p>
                  </div>
                  <Textarea
                    value={drafts[q.id] ?? ""}
                    placeholder="Record the answer…"
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [q.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveAnswer(q.id);
                    }}
                    className="mt-2 !min-h-14 text-[12.5px]"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    disabled={!(drafts[q.id] ?? "").trim()}
                    onClick={() => saveAnswer(q.id)}
                  >
                    <Icon name="check" size={12} />
                    Save answer
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {brief.openQuestions.length === 0 && !suggesting && (
          <div className="flex items-start gap-2 rounded-md border border-line bg-inset/40 px-3 py-2.5">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
              <Icon name="check" size={10} strokeWidth={2.4} />
            </span>
            <p className="text-[12.5px] leading-snug text-ink-mute">
              No open questions — nothing blocks this brief.
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-line pt-3">
        {suggesting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: DUR.fast } }}
            className="rounded-md border border-line bg-inset/50 px-3 py-2.5"
          >
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-accent">
              <Icon name="sparkle" size={11} />
              {THINKING_STEPS[step]}
            </p>
            <div className="mt-2 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </motion.div>
        ) : (
          <Button variant="ghost" size="sm" className="w-full" onClick={suggest}>
            <Icon name="sparkle" size={13} />
            Suggest clarifying questions
          </Button>
        )}
      </div>
    </div>
  );
}
