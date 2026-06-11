"use client";

/* ================================================================
   Onboarding standardization — the editorial full-width moment.
   Interactive kickoff checklist built from the real Stratus HVAC
   onboarding flow.
   ================================================================ */

import { useState } from "react";
import { CheckItem } from "@/components/ui/fields";
import { Progress } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { MarketingSection, Reveal } from "./shared";

const INITIAL_TASKS = [
  { id: "t1", group: "KICKOFF", title: "Countersigned agreement filed", done: true },
  { id: "t2", group: "KICKOFF", title: "40% deposit invoice paid", done: true },
  { id: "t3", group: "ACCESS", title: "Moneybird API token received & tested", done: true },
  { id: "t4", group: "ASSETS", title: "Price book v2 confirmed as final", done: false },
  { id: "t5", group: "CLIENT", title: "Two engineer champions nominated", done: false },
  { id: "t6", group: "KICKOFF", title: "Week-3 demo booked (intake + quoting)", done: false },
];

const PLAN_DAYS = [
  { day: "D1", action: "Kickoff call: walk milestones, confirm triage rules draft" },
  { day: "D4", action: "Intake form v1 on staging with real service categories" },
  { day: "D7", action: "Quoting engine tested against 5 historical jobs" },
  { day: "D14", action: "Intake → quote end-to-end demo prep on staging" },
];

export function OnboardingBand() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <section className="border-y border-line bg-surface/60">
      <MarketingSection className="py-20" inner="grid items-center gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-16">
        <Reveal>
          <p className="microlabel">After the yes</p>
          <h2 className="mt-3 max-w-xl font-display text-[30px] leading-[1.08] font-medium tracking-tight sm:text-[38px]">
            “Won” is a handoff, not a finish line.
          </h2>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-ink-mute">
            Stratus HVAC signed on 28 May. By day six: deposit collected, Moneybird API token
            tested, kickoff held, five of eleven tasks done — and the client could see all of
            it. The first week sets the tone for the whole engagement, and it should never be
            improvised at 9pm the night before kickoff.
          </p>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-ink-mute">
            Accepting a proposal generates the flow automatically from your template: kickoff
            checklist grouped by owner, asset requests, a stakeholder map, a welcome note in
            your voice, and a 14-day plan with dates on it.
          </p>
          <ul className="mt-6 space-y-2">
            {[
              "Checklist grouped: kickoff, access, assets, internal, client-side",
              "Asset requests sent as one list, not five emails",
              "Sales → delivery handoff summary written for you",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13px] text-ink-mute">
                <Icon name="check" size={13} className="mt-0.5 shrink-0 text-accent" />
                {b}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="panel-raised overflow-hidden shadow-e2">
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <p className="microlabel">Onboarding · Stratus HVAC</p>
                <p className="mt-0.5 text-[13px] font-medium text-ink">
                  Quote-to-Dispatch Automation
                </p>
              </div>
              <div className="text-right">
                <span className="tnum font-mono text-[11px] text-ink-mute">
                  {doneCount}/{tasks.length}
                </span>
                <p className="microlabel mt-0.5">this week</p>
              </div>
            </header>
            <div className="px-3 py-2.5">
              <Progress
                value={(doneCount / tasks.length) * 100}
                tone={doneCount === tasks.length ? "ok" : "accent"}
                className="mx-1 mb-2"
              />
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-1">
                  <CheckItem
                    checked={t.done}
                    onChange={() =>
                      setTasks((prev) =>
                        prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x))
                      )
                    }
                    className="flex-1"
                  >
                    {t.title}
                  </CheckItem>
                  <span className="microlabel hidden w-14 shrink-0 text-right sm:block">
                    {t.group}
                  </span>
                </div>
              ))}
              <p className="mt-1 px-2 font-mono text-[10px] tracking-wide text-ink-faint">
                6 OF 11 TASKS SHOWN · FULL FLOW IN THE LIVE DEMO
              </p>
            </div>
            <div className="border-t border-line bg-surface px-4 py-3.5">
              <p className="microlabel mb-2">First 14 days — issued to the client</p>
              <ul className="space-y-1.5">
                {PLAN_DAYS.map((p) => (
                  <li key={p.day} className="flex items-baseline gap-3 text-[12px]">
                    <span className="tnum w-7 shrink-0 font-mono text-[10.5px] text-accent">
                      {p.day}
                    </span>
                    <span className="text-ink-mute">{p.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </MarketingSection>
    </section>
  );
}
