"use client";

/* ================================================================
   Scope-creep prevention — a live change-order vignette built from
   the real Roastery Nord gifting request: inbound quote, scope
   classification, pre-priced reply.
   ================================================================ */

import { useState } from "react";
import { changeOrders } from "@/lib/demo-data";
import { money } from "@/lib/format";
import { Icon } from "@/components/ui/icons";
import { Badge, Button } from "@/components/ui/primitives";
import { MarketingSection, Reveal, StatChip } from "./shared";

export function CreepVignette() {
  const co = changeOrders.find((c) => c.id === "co-roastery-gifting");
  const [sent, setSent] = useState(false);
  if (!co) return null;

  return (
    <MarketingSection id="scope-control" className="border-y border-line bg-surface/50 py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
        <Reveal>
          <p className="microlabel">Scope control</p>
          <h2 className="mt-2.5 font-display text-[26px] leading-[1.12] font-medium tracking-tight sm:text-[30px]">
            Scope creep dies in the reply.
          </h2>
          <p className="mt-3.5 max-w-lg text-[14px] leading-relaxed text-ink-mute">
            Ida’s gifting request “feels small since the subscription logic is all there.” It
            isn’t — it’s a separate checkout flow and two weeks of work. That sentence is how
            agencies ship free sprints.
          </p>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-mute">
            Scopeforge classifies every request against the signed scope, cites the exact line
            it falls outside, and drafts the polite-but-firm reply with a price already
            attached. The email your delivery lead rewrites from scratch every time — done in
            seconds, on letterhead-grade copy.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
            <StatChip value="11" label="requests classified / qtr" />
            <StatChip value={money(14750)} label="re-quoted, not absorbed" />
            <StatChip value="100%" label="scope line cited" />
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="panel-raised overflow-hidden shadow-e2 transition-shadow duration-200 hover:shadow-e3">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="microlabel">Change order — Roastery Nord</span>
              {sent ? <Badge tone="ok">reply sent</Badge> : <Badge tone="warn">open</Badge>}
            </header>
            <div className="space-y-3.5 px-4 py-4">
              <div className="well px-3.5 py-3">
                <p className="microlabel">Inbound request · Ida Sørensen · 6 Jun</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mute">
                  “Subscribers keep asking to send a subscription as a gift. Could we add a
                  gifting option to the subscription flow? Feels small since the subscription
                  logic is all there?”
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warn">
                  <Icon name="alert-triangle" size={10} />
                  out of scope
                </Badge>
                <span className="font-mono text-[10.5px] tracking-wide text-ink-faint">
                  {co.scopeReference}
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-ink-mute">
                Gift subscriptions are a distinct commerce flow: separate purchaser/recipient
                records, scheduled start dates, renewal-consent handling. Classic “feels
                small” creep signal.
              </p>

              <div className="rounded-md border border-accent-line/35 bg-accent-soft/30 px-3.5 py-3">
                <p className="microlabel">Pre-priced reply — draft</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink">
                  “Gifting is a genuinely good idea — requests like this usually convert well.
                  It’s a separate checkout flow in Recharge rather than a toggle, so it sits
                  outside the original scope. We’d deliver it as a focused mini-project for{" "}
                  <span className="tnum font-mono">{money(co.price)}</span>, two weeks
                  end-to-end — before the holiday gifting season rather than during it.”
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <div className="flex items-baseline gap-3">
                  <span className="tnum font-display text-[20px] font-medium tracking-tight">
                    {money(co.price)}
                  </span>
                  <span className="tnum font-mono text-[10.5px] text-ink-faint">
                    {co.effortDays}D EFFORT · MINI-PROJECT
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={sent ? "secondary" : "primary"}
                  disabled={sent}
                  onClick={() => setSent(true)}
                >
                  {sent ? (
                    <>
                      <Icon name="check" size={12} />
                      Sent — awaiting Ida
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={12} />
                      Send pre-priced reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center font-mono text-[10.5px] tracking-wide text-ink-faint">
            REAL WORKFLOW FROM THE DEMO WORKSPACE — TRY IT IN{" "}
            <span className="text-ink-mute">/CHANGE-ORDERS</span>
          </p>
        </Reveal>
      </div>
    </MarketingSection>
  );
}
