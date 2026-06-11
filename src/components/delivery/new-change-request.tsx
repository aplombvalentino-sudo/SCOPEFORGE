"use client";

/* "New change request" intake — modal with project/requester/request,
   a 1.4s simulated classification run (stepped copy), then a drawer
   with a canned borderline draft for the chosen project. Nothing is
   persisted: the draft carries a "Draft — not yet saved" chip. */

import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "@/lib/format";
import { useApp } from "@/lib/store";
import { Skeleton, useToast } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icons";
import { Drawer, Modal } from "@/components/ui/overlays";
import { Badge, Button, Dot } from "@/components/ui/primitives";

const STEPS = ["Comparing against scope…", "Checking exclusions…", "Drafting reply…"];

interface DraftResult {
  leadId: string;
  projectName: string;
  requester: string;
  requestText: string;
}

const CANNED: Record<string, { rationale: string; scopeReference: string }> = {
  "ld-stratus": {
    rationale:
      "Close to the dispatch and calendar work already delivered, but the approved scope is explicit about its edges: max three quote templates at launch, no historical data migration, no custom mobile app, SMS pre-priced separately. Whether this request lands inside depends on detail it doesn't give — get that in writing before anyone configures anything.",
    scopeReference: "sc-stratus → Assumptions + Exclusions",
  },
  "ld-roastery": {
    rationale:
      "The build covers subscription commerce for single-recipient flows, and the 60-day support window (closes 13 Jun) covers content-level fixes only. As written, this could be a settings change absorbed this week — or a checkout-logic change that's a priced mini-project. The wrong guess costs a margin point; clarify first.",
    scopeReference: "pp-roastery → Subscription commerce scope + support window",
  },
  "ld-meridian": {
    rationale:
      "The retainer's programme scope covers technical SEO, the monthly content allocation, and authority building — and excludes paid search, redesign work, and PR beyond citations. This could fold into next month's content slots, or it's a separate project wearing a retainer costume. With renewal due 31 Jul, classify it cleanly rather than set a precedent.",
    scopeReference: "Meridian retainer → Programme scope + exclusions",
  },
};

const FALLBACK = {
  rationale:
    "The request sits between refinement of an existing deliverable and new capability the scope never priced. The agreement's assumptions and exclusions don't settle it either way — which is exactly when unscoped work slips through. Pin the boundary down before anything gets built.",
  scopeReference: "scope doc → Assumptions + Exclusions",
};

function suggestedWording(projectName: string, requester: string): string {
  const first = requester.trim().split(/\s+/)[0];
  return `Thanks for raising this${first ? `, ${first}` : ""} — it's a fair ask, and it sits right on the edge of what we scoped for ${projectName}. Rather than guess, let's take 20 minutes this week to pin down exactly what's needed: if it's covered, we'll simply do it; if it's beyond the agreed scope, you'll have a one-page price in your inbox before anything gets built.`;
}

export function NewChangeRequest({ open, onClose }: { open: boolean; onClose: () => void }) {
  const leads = useApp((s) => s.leads);
  const onboardingFlows = useApp((s) => s.onboardingFlows);
  const toast = useToast();

  const wonLeads = useMemo(() => leads.filter((l) => l.stage === "won"), [leads]);
  const projectNameFor = (leadId: string) => {
    const flow = onboardingFlows.find((f) => f.leadId === leadId);
    if (flow) return flow.projectName;
    const lead = wonLeads.find((l) => l.id === leadId);
    return lead ? lead.projectType : "";
  };

  const [leadId, setLeadId] = useState("");
  const [requester, setRequester] = useState("");
  const [requestText, setRequestText] = useState("");
  const [working, setWorking] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const selectedId = leadId || wonLeads[0]?.id || "";
  const canSubmit = selectedId !== "" && requester.trim() !== "" && requestText.trim() !== "";

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  function handleClose() {
    if (working) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setWorking(false);
      setStep(0);
    }
    onClose();
  }

  function submit() {
    const lead = wonLeads.find((l) => l.id === selectedId);
    if (!lead || !canSubmit) return;
    setWorking(true);
    setStep(0);
    timers.current.push(setTimeout(() => setStep(1), 470));
    timers.current.push(setTimeout(() => setStep(2), 940));
    timers.current.push(
      setTimeout(() => {
        setWorking(false);
        setStep(0);
        setResult({
          leadId: lead.id,
          projectName: projectNameFor(lead.id) || lead.company,
          requester: requester.trim(),
          requestText: requestText.trim(),
        });
        setDrawerOpen(true);
        setRequester("");
        setRequestText("");
        onClose();
      }, 1400)
    );
  }

  const canned = result ? (CANNED[result.leadId] ?? FALLBACK) : FALLBACK;
  const reply = result ? suggestedWording(result.projectName, result.requester) : "";

  function copyDraftReply() {
    navigator.clipboard.writeText(reply).catch(() => undefined);
    toast.success(
      "Reply copied",
      "Scoping-call offer is on your clipboard — send it before the work starts itself."
    );
  }

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="New change request"
        footer={
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={!canSubmit} loading={working}>
              {!working && <Icon name="sparkle" size={13} />}
              Classify against scope
            </Button>
          </>
        }
      >
        {working ? (
          <div className="well px-4 py-4">
            <div className="space-y-2.5">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2.5">
                  {i < step ? (
                    <Icon name="check" size={12} className="shrink-0 text-ok" />
                  ) : i === step ? (
                    <span className="pulse-dot h-2 w-2 shrink-0 rounded-full bg-accent" />
                  ) : (
                    <span className="h-2 w-2 shrink-0 rounded-full border border-line bg-inset" />
                  )}
                  <span
                    className={cx(
                      "font-mono text-[11.5px] tracking-wide",
                      i <= step ? "text-ink" : "text-ink-faint"
                    )}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-4/5" />
              <Skeleton className="h-2.5 w-3/5" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Project" htmlFor="ncr-project">
              <Select
                id="ncr-project"
                value={selectedId}
                onChange={(e) => setLeadId(e.target.value)}
              >
                {wonLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.company} — {projectNameFor(l.id)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Requested by" htmlFor="ncr-requester">
              <Input
                id="ncr-requester"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                placeholder="e.g. Pieter Vandenberg, Operations Manager"
              />
            </Field>
            <Field
              label="Request"
              htmlFor="ncr-request"
              hint="Verbatim beats summary — the classifier compares the exact ask against the signed scope."
            >
              <Textarea
                id="ncr-request"
                rows={5}
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="Paste the ask as the client wrote it — email, call note, or Slack message."
              />
            </Field>
          </div>
        )}
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Draft classification"
        meta={
          <div className="flex items-center gap-1.5">
            <Badge tone="warn">Borderline</Badge>
            <Badge tone="neutral">Draft — not yet saved</Badge>
          </div>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={copyDraftReply}>
              <Icon name="copy" size={13} />
              Copy reply
            </Button>
          </>
        }
      >
        {result && (
          <div className="space-y-4">
            <div>
              <p className="text-[13.5px] font-medium text-ink">{result.projectName}</p>
              <p className="mt-0.5 flex items-center text-[11.5px] text-ink-faint">
                <span>Requested by {result.requester}</span>
                <Dot />
                <span className="font-mono">just now</span>
              </p>
            </div>

            <blockquote className="well border-l-2 border-l-line-strong px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
              “{result.requestText}”
            </blockquote>

            <div>
              <p className="microlabel mb-1">Why borderline</p>
              <p className="text-[12.5px] leading-relaxed text-ink-mute">{canned.rationale}</p>
              <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-sm border border-line bg-inset px-2 py-0.5 font-mono text-[11px] text-ink-mute">
                <Icon name="scope" size={11} className="shrink-0 text-ink-faint" />
                <span className="truncate">{canned.scopeReference}</span>
              </span>
            </div>

            <div className="rounded-md border border-accent-line/50 border-l-2 border-l-accent bg-accent-soft/30 px-3.5 py-3">
              <p className="microlabel mb-1.5 !text-accent">Suggested reply</p>
              <p className="text-[12.5px] leading-relaxed text-ink">{reply}</p>
            </div>

            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <span className="font-display text-[15px] font-medium tracking-tight text-ink">
                TBD after clarification
              </span>
              <span className="font-mono text-[11px] text-ink-faint">effort TBD</span>
            </div>
            <p className="text-[11.5px] leading-snug text-ink-faint">
              Book the scoping call, then price it — borderline requests get an answer in writing
              either way.
            </p>
          </div>
        )}
      </Drawer>
    </>
  );
}
