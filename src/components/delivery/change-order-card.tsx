"use client";

/* Change order card — classification, quoted request, rationale,
   scope reference, suggested reply with copy, price/effort, and
   status-driven actions. */

import Link from "next/link";
import { motion } from "framer-motion";
import { cx, money, timeAgo } from "@/lib/format";
import { itemVariants } from "@/lib/motion";
import { useApp } from "@/lib/store";
import type { ChangeClassification, ChangeOrder } from "@/lib/types";
import { useToast } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { Badge, Button, Dot, type Tone } from "@/components/ui/primitives";

export const CLASSIFICATION_META: Record<
  ChangeClassification,
  { label: string; tone: Tone; hint: string }
> = {
  in_scope: { label: "In scope", tone: "ok", hint: "covered — do it" },
  borderline: { label: "Borderline", tone: "warn", hint: "clarify before building" },
  out_of_scope: { label: "Out of scope", tone: "danger", hint: "price it or decline it" },
};

const STATUS_META: Record<ChangeOrder["status"], { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "info" },
  sent: { label: "Awaiting reply", tone: "accent" },
  approved: { label: "Approved", tone: "ok" },
  declined: { label: "Declined", tone: "neutral" },
};

export function ChangeOrderCard({ order }: { order: ChangeOrder }) {
  const setChangeOrderStatus = useApp((s) => s.setChangeOrderStatus);
  const logActivity = useApp((s) => s.logActivity);
  const toast = useToast();
  const cls = CLASSIFICATION_META[order.classification];
  const status = STATUS_META[order.status];

  function copyReply() {
    navigator.clipboard.writeText(order.suggestedWording).catch(() => undefined);
    toast.success("Reply copied", "Suggested wording is on your clipboard — paste and send.");
  }

  function sendToClient() {
    setChangeOrderStatus(order.id, "sent");
    logActivity(
      "change_order",
      `Change order sent for ${order.projectName} — ${order.price > 0 ? money(order.price) : "goodwill"}, ${order.effortDays}d effort`,
      order.leadId
    );
    toast.success(
      "Change order sent — scope stays protected",
      `${order.requestedBy} gets the classification, the price, and the reply in writing.`
    );
  }

  function markApproved() {
    setChangeOrderStatus(order.id, "approved");
    logActivity(
      "change_order",
      `${order.projectName} change order approved${order.price > 0 ? ` — ${money(order.price)} recovered` : " — goodwill, no charge"}`,
      order.leadId
    );
    toast.success(
      order.price > 0
        ? `Approved — ${money(order.price)} recovered`
        : "Approved — goodwill closed out",
      order.price > 0
        ? "Billed as a change order instead of absorbed into the margin."
        : "Logged so the favour is visible, not invisible."
    );
  }

  function markDeclined() {
    setChangeOrderStatus(order.id, "declined");
    toast.info("Marked declined", "Answer logged in writing — the scope document stands.");
  }

  return (
    <motion.article
      variants={itemVariants}
      layout
      transition={{ layout: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      className="panel px-4 py-4 transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-e1"
    >
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center text-[13.5px] font-medium text-ink">
            <Link
              href={`/leads/${order.leadId}`}
              className="truncate transition-colors duration-150 hover:text-accent"
            >
              {order.projectName}
            </Link>
          </p>
          <p className="mt-0.5 flex items-center text-[11.5px] text-ink-faint">
            <span>Requested by {order.requestedBy}</span>
            <Dot />
            <span className="tnum font-mono">{timeAgo(order.receivedAt)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge tone={cls.tone}>{cls.label}</Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </div>

      {/* request, quoted */}
      <blockquote className="well mt-3 border-l-2 border-l-line-strong px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
        {order.requestText}
      </blockquote>

      {/* rationale + scope reference */}
      <div className="mt-3">
        <p className="microlabel mb-1">Why this classification</p>
        <p className="text-[12.5px] leading-relaxed text-ink-mute">{order.rationale}</p>
        <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-sm border border-line bg-inset px-2 py-0.5 font-mono text-[11px] text-ink-mute">
          <Icon name="scope" size={11} className="shrink-0 text-ink-faint" />
          <span className="truncate">{order.scopeReference}</span>
        </span>
      </div>

      {/* suggested reply */}
      <div className="mt-3 rounded-md border border-accent-line/50 border-l-2 border-l-accent bg-accent-soft/30 px-3.5 py-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="microlabel !text-accent">Suggested reply</span>
          <button
            onClick={copyReply}
            className="inline-flex h-6 items-center gap-1 rounded-sm px-1.5 font-mono text-[10.5px] tracking-wide text-accent uppercase transition-colors duration-150 hover:bg-accent-soft"
          >
            <Icon name="copy" size={11} />
            Copy reply
          </button>
        </div>
        <p className="text-[12.5px] leading-relaxed text-ink">{order.suggestedWording}</p>
      </div>

      {/* price, effort, actions */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex items-baseline gap-3">
          {order.price > 0 ? (
            <span className="tnum font-display text-[17px] font-medium tracking-tight text-ink">
              {money(order.price)}
            </span>
          ) : (
            <span className="text-[13px] text-ink-mute italic">Goodwill — no charge</span>
          )}
          <span className="tnum font-mono text-[11px] text-ink-faint">
            {order.effortDays}d effort
          </span>
        </div>
        <div className="flex items-center gap-2">
          {order.status === "open" && (
            <Button variant="primary" size="sm" onClick={sendToClient}>
              <Icon name="send" size={12} />
              Send to client
            </Button>
          )}
          {order.status === "sent" && (
            <>
              <Button variant="secondary" size="sm" onClick={markApproved}>
                <Icon name="check" size={12} />
                Mark approved
              </Button>
              <Button variant="ghost" size="sm" onClick={markDeclined}>
                Mark declined
              </Button>
            </>
          )}
          {order.status === "approved" && (
            <p className="flex items-center gap-1.5 text-[12px] text-ink-faint">
              <Icon name="check" size={12} className="text-ok" />
              Closed — approved in writing
              {order.price > 0 ? `; ${money(order.price)} recovered.` : "; goodwill, no charge."}
            </p>
          )}
          {order.status === "declined" && (
            <p className="flex items-center gap-1.5 text-[12px] text-ink-faint">
              <Icon name="x" size={12} />
              Closed — declined in writing; scope document stands.
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/** Legend chip used in the classification strip on /change-orders. */
export function ClassificationLegend({ className }: { className?: string }) {
  return (
    <div className={cx("panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5", className)}>
      {(Object.keys(CLASSIFICATION_META) as ChangeClassification[]).map((key) => {
        const meta = CLASSIFICATION_META[key];
        return (
          <div key={key} className="flex items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <span className="text-[12px] text-ink-mute">{meta.hint}</span>
          </div>
        );
      })}
    </div>
  );
}
