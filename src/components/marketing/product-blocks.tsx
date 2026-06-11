"use client";

/* ================================================================
   /product — module-by-module tour. Each block: explanation of the
   pains solved + a live-feeling vignette built from the real UI
   primitives and the demo workspace's actual records.
   ================================================================ */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { changeOrders, pricingModels, proposals, scopes } from "@/lib/demo-data";
import { cx, marginPct, money, moneyCompact, pct, shortDate } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/icons";
import { Badge, Button, Progress } from "@/components/ui/primitives";
import { DemoCta } from "@/components/shell/marketing-shell";
import { LinkButton, MarketingSection, Reveal } from "./shared";

/* ---------------- shared block layout ---------------- */

const MODULE_NAV: { id: string; label: string }[] = [
  { id: "intake", label: "Intake" },
  { id: "brief", label: "Brief" },
  { id: "scope", label: "Scope" },
  { id: "pricing", label: "Pricing" },
  { id: "proposals", label: "Proposal studio" },
  { id: "follow-ups", label: "Follow-ups" },
  { id: "onboarding", label: "Onboarding" },
  { id: "change-orders", label: "Change orders" },
];

export function ProductHero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="blueprint blueprint-fade absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-12 lg:pt-20">
        <p className="microlabel">Product tour</p>
        <h1 className="mt-3 max-w-2xl font-display text-[32px] leading-[1.08] font-medium tracking-tight sm:text-[38px]">
          Eight modules. One chain. Nothing re-typed.
        </h1>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-ink-mute">
          Every module below hands a structured artifact to the next — so the change order in
          week nine can cite the exclusion line written in week one. All vignettes are live
          records from the Atelier North demo workspace.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <DemoCta>Book a demo</DemoCta>
          <LinkButton href="/dashboard">
            Open the live demo
            <Icon name="arrow-up-right" size={13} />
          </LinkButton>
        </div>
        <nav aria-label="Modules" className="mt-8 flex flex-wrap gap-1.5">
          {MODULE_NAV.map((m, i) => (
            <a
              key={m.id}
              href={`#${m.id}`}
              className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-ink-mute uppercase transition-colors duration-150 hover:border-accent-line hover:text-ink"
            >
              <span className="tnum text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
              {m.label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

function ModuleSection({
  index,
  id,
  icon,
  name,
  title,
  paras,
  bullets,
  vignette,
  flip,
}: {
  index: number;
  id: string;
  icon: IconName;
  name: string;
  title: string;
  paras: string[];
  bullets: string[];
  vignette: ReactNode;
  flip?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-line py-16 last:border-b-0">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2 lg:gap-14">
        <Reveal className={cx(flip && "lg:order-2")}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface">
              <Icon name={icon} size={14} className="text-accent" />
            </span>
            <span className="microlabel">
              Module {String(index).padStart(2, "0")} · {name}
            </span>
          </div>
          <h2 className="mt-3.5 font-display text-[24px] leading-[1.14] font-medium tracking-tight sm:text-[28px]">
            {title}
          </h2>
          {paras.map((p) => (
            <p key={p.slice(0, 24)} className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-ink-mute">
              {p}
            </p>
          ))}
          <ul className="mt-5 space-y-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13px] text-ink">
                <Icon name="check" size={13} className="mt-0.5 shrink-0 text-accent" />
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.08} className={cx(flip && "lg:order-1")}>
          {vignette}
        </Reveal>
      </div>
    </section>
  );
}

function VignetteFrame({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="panel-raised overflow-hidden shadow-e2 transition-shadow duration-200 hover:shadow-e3">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <span className="microlabel truncate">{label}</span>
        {badge}
      </header>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

/* ---------------- vignettes ---------------- */

function IntakeVignette() {
  return (
    <VignetteFrame label="Intake · Harbor & Fern" badge={<Badge tone="info">email · 07:04</Badge>}>
      <div className="well px-3.5 py-3">
        <p className="font-mono text-[11px] leading-relaxed text-ink-mute">
          Subject: Paid ads help — running out of runway on Meta
          <br />
          …our CAC has nearly doubled since January (€31 → €58). Our agency before just kept
          raising budgets… We can spend a few thousand a month on this if the numbers make
          sense.
        </p>
      </div>
      <div className="my-3 flex items-center gap-2">
        <Icon name="sparkle" size={12} className="text-accent" />
        <span className="microlabel">Analyzed in 90 seconds</span>
        <span className="h-px flex-1 bg-line" aria-hidden />
      </div>
      <div className="flex items-center gap-2.5">
        <Progress value={81} className="flex-1" />
        <span className="tnum shrink-0 font-mono text-[10.5px] text-ink-mute">81% confidence</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="neutral">4 goals</Badge>
        <Badge tone="warn">4 gaps</Badge>
        <Badge tone="danger">4 risks</Badge>
        <Badge tone="accent">3 questions drafted</Badge>
      </div>
      <p className="mt-3 border-l-2 border-accent-line pl-3 text-[12px] leading-relaxed text-ink-mute">
        Suggested question: “What's your current monthly Meta spend, and what blended CAC
        makes Q4 work at your margins?”
      </p>
    </VignetteFrame>
  );
}

function BriefVignette() {
  const questions = [
    {
      q: "Who arbitrates if the three approvers disagree — is Beatriz's decision final and binding?",
      answered: false,
    },
    { q: "Is “Aurelia Casas” locked as the name, or is naming genuinely open?", answered: false },
  ];
  return (
    <VignetteFrame
      label="Brief · Aurelia Casas identity"
      badge={<Badge tone="warn">needs clarification</Badge>}
    >
      <p className="text-[12.5px] leading-relaxed text-ink-mute">
        Three-property guesthouse line launching spring 2027. Identity must relate to — but
        stand apart from — the mother brand. Three stakeholders hold sign-off.
      </p>
      <div className="mt-3.5 space-y-2">
        {questions.map((item) => (
          <div
            key={item.q}
            className="flex items-start gap-2.5 rounded-md border border-line bg-surface px-3 py-2.5"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden />
            <div className="min-w-0">
              <p className="text-[12.5px] leading-snug text-ink">{item.q}</p>
              <p className="microlabel mt-1">Unanswered · 2 days · blocks scoping</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-[11.5px] text-ink-faint">
        <Icon name="clock" size={12} />
        Naming sprint blocked until answered — nudge drafted for Friday, in Tom's voice.
      </p>
    </VignetteFrame>
  );
}

function ScopeVignette() {
  const scope = scopes.find((s) => s.id === "sc-vey");
  if (!scope) return null;
  const shown = scope.deliverables.slice(1, 4);
  const totalEffort = scope.deliverables.reduce((sum, d) => sum + d.effortDays, 0);
  return (
    <VignetteFrame label="Scope · Maison Vey redesign" badge={<Badge tone="info">in review</Badge>}>
      <div className="space-y-1.5">
        {shown.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 transition-colors duration-150 hover:border-line-strong"
          >
            <span className="truncate text-[12.5px] text-ink">{d.title}</span>
            <span className="tnum shrink-0 font-mono text-[10.5px] text-ink-faint">
              {d.effortDays}d
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3.5">
        <p className="microlabel mb-1.5">Exclusions — the lines that matter later</p>
        {[
          "Product copywriting in any language",
          "Ongoing maintenance after the 2-week hypercare window",
        ].map((e) => (
          <p key={e} className="flex items-start gap-2 py-0.5 text-[12px] text-ink-mute">
            <Icon name="x" size={11} className="mt-1 shrink-0 text-ink-faint" />
            {e}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2.5 rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5">
        <Icon name="alert-triangle" size={13} className="mt-0.5 shrink-0 text-danger" />
        <p className="text-[11.5px] leading-snug text-ink-mute">
          <span className="font-medium text-ink">Copy delivery slippage (high).</span> History
          of 6-week delays — copy deadline in contract (wk 6) with phased-launch fallback.
        </p>
      </div>
      <p className="tnum mt-3 font-mono text-[10px] tracking-wide text-ink-faint">
        8 DELIVERABLES · {totalEffort} EFFORT DAYS · 2 REVISION ROUNDS · {scope.timelineWeeks}{" "}
        WEEKS
      </p>
    </VignetteFrame>
  );
}

function PricingVignette() {
  const model = pricingModels.find((m) => m.id === "pm-vey");
  if (!model) return null;
  return (
    <VignetteFrame label="Pricing · Maison Vey" badge={<Badge tone="neutral">project · 3 tiers</Badge>}>
      <div className="grid grid-cols-3 gap-2">
        {model.tiers.map((t) => (
          <div
            key={t.key}
            className={cx(
              "rounded-md border px-2.5 py-2.5 text-center transition-colors duration-150",
              t.recommended
                ? "border-accent-line bg-accent-soft/40"
                : "border-line bg-surface hover:border-line-strong"
            )}
          >
            <p className="microlabel">{t.name}</p>
            <p className="tnum mt-1 font-display text-[15px] font-medium tracking-tight">
              {moneyCompact(t.price)}
            </p>
            <p className="tnum mt-0.5 font-mono text-[9.5px] text-ink-faint">
              {pct(marginPct(t.price, t.cost))} margin
            </p>
            {t.recommended && (
              <Badge tone="accent" className="mt-1.5">
                rec
              </Badge>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-accent-line/35 bg-accent-soft/25 px-3.5 py-3">
        <p className="microlabel flex items-center gap-1.5">
          <Icon name="shield" size={11} className="text-accent" />
          Margin guidance
        </p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-mute">{model.marginGuidance}</p>
      </div>
      <p className="tnum mt-3 font-mono text-[10px] tracking-wide text-ink-faint">
        DEPOSIT 40% · DESIGN APPROVAL 30% · LAUNCH 30%
      </p>
    </VignetteFrame>
  );
}

function ProposalVignette() {
  const proposal = proposals.find((p) => p.id === "pp-northgate");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  if (!proposal) return null;
  const shown = proposal.sections.slice(0, 5);
  const isOn = (id: string) => enabled[id] ?? true;
  return (
    <VignetteFrame
      label="Proposal studio · Northgate Dental"
      badge={
        <Badge tone="info">
          <Icon name="eye" size={10} />
          viewed ×{proposal.views}
        </Badge>
      }
    >
      <div className="space-y-1.5">
        {shown.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setEnabled((prev) => ({ ...prev, [s.id]: !isOn(s.id) }))}
            className={cx(
              "flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-all duration-150",
              isOn(s.id)
                ? "border-line bg-surface hover:border-line-strong"
                : "border-line bg-inset opacity-50"
            )}
          >
            <Icon name="grip" size={12} className="shrink-0 text-ink-faint" />
            <span className="tnum w-4 shrink-0 font-mono text-[10px] text-ink-faint">
              {i + 1}
            </span>
            <span
              className={cx(
                "flex-1 truncate text-[12.5px]",
                isOn(s.id) ? "text-ink" : "text-ink-faint line-through"
              )}
            >
              {s.title}
            </span>
            <span
              className={cx(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors duration-150",
                isOn(s.id)
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line-strong bg-inset"
              )}
            >
              {isOn(s.id) && <Icon name="check" size={10} strokeWidth={2.4} />}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <span className="tnum font-mono text-[10.5px] text-ink-faint">
          £3,300/MO PROGRAMME TIER · VALID UNTIL {shortDate(proposal.validUntil).toUpperCase()}
        </span>
        <span className="text-[11px] text-ink-mute">Sections toggle — try it</span>
      </div>
    </VignetteFrame>
  );
}

function FollowUpVignette() {
  const [sent, setSent] = useState(false);
  return (
    <VignetteFrame
      label="Follow-up #2 · Northgate Dental"
      badge={sent ? <Badge tone="ok">sent</Badge> : <Badge tone="warn">due today 14:00</Badge>}
    >
      <p className="flex items-start gap-2 text-[11.5px] leading-snug text-ink-faint">
        <Icon name="eye" size={12} className="mt-0.5 shrink-0" />
        Proposal viewed 4× including yesterday 16:40 — Daniel is re-reading the pricing
        section. Decision momentum is warm; nudge before the weekend.
      </p>
      <div className="well mt-3 px-3.5 py-3">
        <p className="text-[12px] leading-relaxed text-ink-mute">
          Hi Daniel,
          <br />
          <br />
          When we spoke you mentioned wanting movement before the autumn intake period — I've
          held kickoff capacity for the week of 22 June to protect that.
          <br />
          <br />
          One thing worth flagging: GBP recovery for the three profiles owned by your former
          employee takes 2–3 weeks through Google's process, and it gates the map-pack work…
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="microlabel">Drafted from the view trail — not “just checking in”</span>
        <Button
          size="sm"
          variant={sent ? "secondary" : "primary"}
          disabled={sent}
          onClick={() => setSent(true)}
        >
          {sent ? (
            <>
              <Icon name="check" size={12} />
              Sent
            </>
          ) : (
            <>
              <Icon name="send" size={12} />
              Send
            </>
          )}
        </Button>
      </div>
    </VignetteFrame>
  );
}

function OnboardingVignette() {
  const tasks = [
    { title: "Countersigned agreement filed", done: true },
    { title: "Moneybird API token received & tested", done: true },
    { title: "Price book v2 confirmed as final", done: false },
    { title: "Two engineer champions nominated", done: false },
  ];
  const done = tasks.filter((t) => t.done).length;
  return (
    <VignetteFrame
      label="Onboarding · Stratus HVAC"
      badge={<Badge tone="ok">kickoff held · day 6</Badge>}
    >
      <div className="flex items-center gap-2.5">
        <Progress value={(5 / 11) * 100} className="flex-1" />
        <span className="tnum shrink-0 font-mono text-[10.5px] text-ink-mute">5/11 tasks</span>
      </div>
      <div className="mt-3 space-y-1">
        {tasks.map((t) => (
          <div key={t.title} className="flex items-center gap-2.5 px-1 py-1">
            <span
              className={cx(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                t.done ? "border-accent bg-accent text-on-accent" : "border-line-strong bg-inset"
              )}
            >
              {t.done && <Icon name="check" size={10} strokeWidth={2.4} />}
            </span>
            <span
              className={cx(
                "text-[12.5px]",
                t.done ? "text-ink-faint line-through decoration-line-strong" : "text-ink"
              )}
            >
              {t.title}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-line pt-3">
        <p className="microlabel mb-1.5">First 14 days</p>
        {[
          { day: "D1", action: "Kickoff: milestones + triage rules draft" },
          { day: "D7", action: "Quoting engine vs 5 historical jobs" },
          { day: "D14", action: "Intake → quote end-to-end on staging" },
        ].map((p) => (
          <p key={p.day} className="flex items-baseline gap-3 py-0.5 text-[12px]">
            <span className="tnum w-7 shrink-0 font-mono text-[10px] text-accent">{p.day}</span>
            <span className="text-ink-mute">{p.action}</span>
          </p>
        ))}
      </div>
      <p className="tnum mt-2 font-mono text-[10px] tracking-wide text-ink-faint">
        {done} OF {tasks.length} SHOWN DONE · CLIENT SEES THE SAME PAGE
      </p>
    </VignetteFrame>
  );
}

function ChangeOrderVignette() {
  const co = changeOrders.find((c) => c.id === "co-stratus-sms");
  if (!co) return null;
  return (
    <VignetteFrame label="Change order · Stratus HVAC" badge={<Badge tone="warn">open</Badge>}>
      <div className="well px-3.5 py-3">
        <p className="microlabel">Pieter · call · 9 Jun</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mute">
          “Can customers get an SMS when the engineer is en route? And maybe a reminder the day
          before? WhatsApp would be even better.”
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="warn">
          <Icon name="alert-triangle" size={10} />
          out of scope
        </Badge>
        <span className="font-mono text-[10.5px] tracking-wide text-ink-faint">
          {co.scopeReference}
        </span>
      </div>
      <p className="mt-2.5 text-[12px] leading-relaxed text-ink-mute">
        SMS notifications are explicitly listed in the exclusions — “available as change
        order.” New capability, not refinement. And it was anticipated:
      </p>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-accent-line/35 bg-accent-soft/30 px-3.5 py-3">
        <div>
          <p className="text-[12px] font-medium text-ink">Pre-priced add-on, ready to send</p>
          <p className="tnum mt-0.5 font-mono text-[10px] text-ink-faint">
            BUILD + TWILIO SETUP · {co.effortDays}D EFFORT
          </p>
        </div>
        <span className="tnum font-display text-[20px] font-medium tracking-tight">
          {money(co.price)}
        </span>
      </div>
    </VignetteFrame>
  );
}

/* ---------------- the tour ---------------- */

export function ProductTour() {
  return (
    <div>
      <ModuleSection
        index={1}
        id="intake"
        icon="inbox"
        name="Intake"
        title="The 47-minute transcript becomes a decision in 90 seconds."
        paras={[
          "Briefs arrive as emails, Looms, call recordings, and PDFs — and someone senior has to turn that soup into a project. Usually your most expensive person, usually three days later.",
          "Paste anything. Intake analysis extracts goals, missing information, budget and timeline signals, and risks — with a confidence score that tells you whether to scope or to qualify first.",
        ]}
        bullets={[
          "Budget clues surfaced (“a few thousand a month” ≈ €2.5–4k/mo)",
          "Clarifying questions drafted for the first call",
          "Risks flagged before they become assumptions",
        ]}
        vignette={<IntakeVignette />}
      />
      <ModuleSection
        index={2}
        id="brief"
        icon="brief"
        name="Brief"
        flip
        title="A brief the client confirms — not a vague summary nobody signed."
        paras={[
          "Aurelia has three stakeholders with veto power and no tie-break rule. That single unanswered question doubles revision cycles on identity projects — so Scopeforge blocks scoping on it.",
          "Open questions are tracked to answers, stakeholders carry influence labels, and constraints are written down where the whole team can cite them.",
        ]}
        bullets={[
          "Open questions tracked until answered — with nudges drafted",
          "Stakeholder map: decision, input, informed",
          "Brief status gates the scope: no scoping on sand",
        ]}
        vignette={<BriefVignette />}
      />
      <ModuleSection
        index={3}
        id="scope"
        icon="scope"
        name="Scope"
        title="Exclusions are where the margin lives."
        paras={[
          "Everyone lists deliverables. The documents that survive week nine are the ones that also list what's not included, what's assumed, and how many revision rounds the price covers.",
          "The scope engine assembles deliverables from your service blueprints, attaches effort days per tier, and forces the uncomfortable lists: exclusions, assumptions, acceptance criteria, risk flags with mitigations.",
        ]}
        bullets={[
          "Effort days per deliverable, rolled into tier costing",
          "Risk flags with mitigations written into milestones",
          "Every exclusion line is citable by the change-order engine",
        ]}
        vignette={<ScopeVignette />}
      />
      <ModuleSection
        index={4}
        id="pricing"
        icon="euro"
        name="Pricing"
        flip
        title="Three tiers, costed — and a floor nobody crosses by accident."
        paras={[
          "Anchor with Premium, recommend Standard, keep Lean honest. Each tier carries estimated internal cost, so margin is computed — not felt.",
          "Margin guidance reads like a colleague who did the math: where the floor is, what to remove before discounting, and which tier to lead with.",
        ]}
        bullets={[
          "Workspace margin floor (35%) checked on every tier",
          "Add-ons pre-priced — the change-order engine reuses them",
          "Payment schedules attached: deposit, approval, launch",
        ]}
        vignette={<PricingVignette />}
      />
      <ModuleSection
        index={5}
        id="proposals"
        icon="proposal"
        name="Proposal studio"
        title="Assembled from the scope. Tracked after the send."
        paras={[
          "Sections inherit from the approved scope and pricing model — reorder them, toggle them off, pick concise or detailed. Numbers can't drift because they're never re-typed.",
          "After send: view tracking, expiry dates, and a status trail from sent to viewed to decided. Northgate read the pricing section four times — and the follow-up knew.",
        ]}
        bullets={[
          "Executive summaries that lead with the client's problem",
          "View counts and dwell signals feed the follow-up engine",
          "Validity dates enforced — stale quotes expire themselves",
        ]}
        vignette={<ProposalVignette />}
      />
      <ModuleSection
        index={6}
        id="follow-ups"
        icon="follow-up"
        name="Follow-ups"
        flip
        title="Never send “just checking in” again."
        paras={[
          "Sequences arm at send. Each draft cites something real — the view trail, a held kickoff slot, an operational detail from the proposal — because that's what gets replies.",
          "Drafts wait in your queue with the reason attached. You read, edit, send. Nothing goes out on its own.",
        ]}
        bullets={[
          "Drafted from proposal activity, in your team's voice",
          "Due dates with reasons, not generic 3-day timers",
          "Lost-deal re-engagement scheduled months out (it works)",
        ]}
        vignette={<FollowUpVignette />}
      />
      <ModuleSection
        index={7}
        id="onboarding"
        icon="onboarding"
        name="Onboarding"
        title="The first week of every engagement, standardized."
        paras={[
          "Accepting a proposal generates the flow: kickoff checklist grouped by owner, asset requests as one list, a stakeholder map, and a 14-day plan with real dates.",
          "The client sees the same page you do — which is why Stratus confirmed API access in two days instead of three weeks.",
        ]}
        bullets={[
          "Checklist groups: kickoff, access, assets, internal, client",
          "Welcome note drafted in your voice, not boilerplate",
          "Sales → delivery handoff summary written automatically",
        ]}
        vignette={<OnboardingVignette />}
      />
      <ModuleSection
        index={8}
        id="change-orders"
        icon="change-order"
        name="Change orders"
        flip
        title="“Feels small” gets a classification, a citation, and a price."
        paras={[
          "Every mid-project request is classified against the signed scope: in scope, borderline, or out. Out-of-scope requests get the exact scope line cited and a reply drafted with a price attached.",
          "If the add-on was anticipated at pricing time, the reply reuses the pre-priced number — €1,150 for SMS notifications, agreed before anyone got annoyed.",
        ]}
        bullets={[
          "Classification with rationale, citing the scope reference",
          "Polite-but-firm reply drafted — your team just hits send",
          "Goodwill items flagged too: some requests should be free",
        ]}
        vignette={<ChangeOrderVignette />}
      />
      <div className="mx-auto max-w-6xl px-5 pt-12 pb-2 text-center">
        <p className="text-[13px] text-ink-mute">
          Prefer to poke at it yourself?{" "}
          <Link
            href="/dashboard"
            className="font-medium text-accent transition-colors hover:text-accent-hover"
          >
            The live demo workspace is one click away
          </Link>{" "}
          — Atelier North's pipeline, briefs, scopes, and change orders, fully navigable.
        </p>
      </div>
    </div>
  );
}
