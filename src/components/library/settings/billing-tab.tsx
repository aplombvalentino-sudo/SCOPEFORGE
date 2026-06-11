"use client";

/* Settings → Billing: plan panel, seat usage, invoices, change-plan
   modal mirroring the marketing tiers. */

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { cx, fullDate, money } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";
import { Badge, Button, Progress } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlays";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";
import { SettingsPanel } from "./bits";

const SEAT_LIMIT = 15;
const SEAT_PRICE = 79;

/** 6 monthly invoices, newest first — €79 × 14 seats = €1,106. */
const INVOICES = Array.from({ length: 6 }, (_, i) => {
  const month = 6 - i; // Jun back to Jan 2026
  return {
    number: `SF-INV-2026-${String(month).padStart(3, "0")}`,
    date: `2026-${String(month).padStart(2, "0")}-01T09:00:00Z`,
    amount: 1106,
  };
});

interface PlanTier {
  key: string;
  name: string;
  price: string;
  per: string;
  audience: string;
  features: string[];
  current?: boolean;
  action: string;
}

const PLAN_TIERS: PlanTier[] = [
  {
    key: "studio",
    name: "Studio",
    price: "€49",
    per: "/user/mo",
    audience: "2–6 person studios",
    features: ["25 intake analyses /mo", "15 proposal sends /mo", "Standard template library"],
    action: "Downgrade",
  },
  {
    key: "agency",
    name: "Agency",
    price: "€79",
    per: "/user/mo",
    audience: "6–25 person agencies",
    features: [
      "Margin rules + floor alerts",
      "Change-order engine",
      "Automated follow-up sequences",
    ],
    current: true,
    action: "Current plan",
  },
  {
    key: "scale",
    name: "Scale",
    price: "Custom",
    per: "",
    audience: "Groups & 25+ teams",
    features: ["SSO / SAML + SCIM", "Audit log + full API", "Margin policy per service line"],
    action: "Talk to us",
  },
];

export function BillingTab() {
  const toast = useToast();
  const workspace = useApp((s) => s.workspace);
  const [planOpen, setPlanOpen] = useState(false);

  const seatPct = (workspace.seats / SEAT_LIMIT) * 100;

  const pickPlan = (tier: PlanTier) => {
    setPlanOpen(false);
    if (tier.key === "studio") {
      toast.info(
        "Downgrade scheduled for renewal",
        "Studio takes effect 1 Jul 2026 — margin rules and the change-order engine switch off then."
      );
    } else if (tier.key === "scale") {
      toast.success(
        "Request sent to sales",
        "Concierge replies within one business day — usually faster."
      );
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <section className="panel px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="microlabel mb-1.5">Current plan</p>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[20px] leading-none font-medium tracking-tight text-ink">
                {workspace.plan}
              </h2>
              <Badge tone="accent">active</Badge>
            </div>
            <p className="tnum mt-1.5 text-[12.5px] text-ink-mute">
              {money(SEAT_PRICE)}/user/month · billed monthly · {workspace.seats} active seats
            </p>
          </div>
          <Button variant="secondary" onClick={() => setPlanOpen(true)}>
            Change plan
          </Button>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3">
          <span className="tnum flex items-center gap-1.5 font-mono text-[11.5px] text-ink-mute">
            <Icon name="calendar" size={12} className="text-ink-faint" />
            renews 1 Jul 2026
          </span>
          <span className="tnum flex items-center gap-1.5 font-mono text-[11.5px] text-ink-mute">
            <Icon name="euro" size={12} className="text-ink-faint" />
            next charge {money(1106)}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-ink-mute">
            Visa ·· 4421
            <button
              type="button"
              aria-label="Update payment method"
              onClick={() =>
                toast.info(
                  "Card update is disabled in the demo",
                  "Billing stays on Visa ·· 4421 — expiry 09/27, if you were wondering."
                )
              }
              className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-sm text-ink-faint transition-colors duration-150 hover:bg-overlay hover:text-ink"
            >
              <Icon name="pen" size={11} />
            </button>
          </span>
        </div>
      </section>

      <SettingsPanel
        title="Seat usage"
        description="One seat left — the next invite past the limit moves billing to the 25-seat band."
      >
        <div className="flex items-center gap-4">
          <Progress value={seatPct} tone="warn" className="flex-1" />
          <span className="tnum shrink-0 font-mono text-[12px] text-ink">
            {workspace.seats} / {SEAT_LIMIT} seats
          </span>
        </div>
      </SettingsPanel>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[15px] font-medium tracking-tight text-ink">
            Invoices
          </h2>
          <span className="tnum font-mono text-[11px] text-ink-faint">
            sent to billing@ateliernorth.dk
          </span>
        </div>
        <motion.div variants={listVariants} initial="initial" animate="animate">
          <Table>
            <THead>
              <tr>
                <TH>Invoice</TH>
                <TH>Date</TH>
                <TH numeric>Amount</TH>
                <TH>Status</TH>
                <TH aria-label="Download" />
              </tr>
            </THead>
            <TBody>
              {INVOICES.map((inv) => (
                <motion.tr
                  key={inv.number}
                  variants={itemVariants}
                  className="transition-colors duration-100 hover:bg-overlay/40"
                >
                  <TD>
                    <span className="tnum font-mono text-[12px] text-ink">{inv.number}</span>
                  </TD>
                  <TD>
                    <span className="tnum font-mono text-[11.5px] text-ink-mute">
                      {fullDate(inv.date)}
                    </span>
                  </TD>
                  <TD numeric>{money(inv.amount)}</TD>
                  <TD>
                    <Badge tone="ok">paid</Badge>
                  </TD>
                  <TD className="w-10 text-right">
                    <button
                      type="button"
                      aria-label={`Download ${inv.number}`}
                      onClick={() =>
                        toast.success(
                          `${inv.number} downloaded`,
                          "PDF saved — the same copy went to billing@ateliernorth.dk on issue."
                        )
                      }
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors duration-150 hover:bg-overlay hover:text-ink"
                    >
                      <Icon name="download" size={13} />
                    </button>
                  </TD>
                </motion.tr>
              ))}
            </TBody>
          </Table>
        </motion.div>
      </section>

      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title="Change plan" width={680}>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLAN_TIERS.map((tier) => (
            <div
              key={tier.key}
              className={cx(
                "flex flex-col rounded-lg border px-3.5 py-3.5 transition-colors duration-150",
                tier.current
                  ? "border-accent-line bg-accent-soft/30"
                  : "border-line bg-surface hover:border-line-strong"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-[14px] font-medium tracking-tight text-ink">
                  {tier.name}
                </h3>
                {tier.current && <Badge tone="accent">current</Badge>}
              </div>
              <p className="tnum mt-1.5 font-display text-[19px] leading-none font-medium tracking-tight text-ink">
                {tier.price}
                {tier.per && (
                  <span className="font-mono text-[10.5px] font-normal text-ink-mute">
                    {tier.per}
                  </span>
                )}
              </p>
              <p className="mt-1 text-[11.5px] text-ink-faint">{tier.audience}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[12px] leading-snug text-ink-mute">
                    <Icon name="check" size={10} className="mt-0.5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3.5 w-full"
                disabled={tier.current}
                onClick={() => pickPlan(tier)}
              >
                {tier.action}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
          Plan changes apply at the next renewal (1 Jul 2026). Downgrades keep your data —
          features above the new plan go read-only.
        </p>
      </Modal>
    </div>
  );
}
