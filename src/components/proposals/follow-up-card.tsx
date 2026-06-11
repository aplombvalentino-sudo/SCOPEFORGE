"use client";

/* Follow-up queue card: reason intelligence, draft message well, send/skip actions.
   Plus the compact history row used inside the Done/Skipped accordion. */

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/fields";
import { useToast } from "@/components/ui/feedback";
import { Icon, type IconName } from "@/components/ui/icons";
import { Badge, Button, type Tone } from "@/components/ui/primitives";
import { dueIn } from "@/lib/format";
import { useIntegrations } from "@/lib/integrations-store";
import { itemVariants } from "@/lib/motion";
import { useApp } from "@/lib/store";
import type { FollowUp, Lead } from "@/lib/types";

const CHANNEL_ICONS: Record<FollowUp["channel"], IconName> = {
  email: "mail",
  call: "phone",
  linkedin: "link",
};

const CHANNEL_LABELS: Record<FollowUp["channel"], string> = {
  email: "Email",
  call: "Call",
  linkedin: "LinkedIn",
};

export function FollowUpCard({
  followUp: f,
  lead,
  urgency,
}: {
  followUp: FollowUp;
  lead?: Lead;
  /** which section this card renders in — drives the dueIn chip tone */
  urgency: "due" | "scheduled";
}) {
  const setFollowUpStatus = useApp((s) => s.setFollowUpStatus);
  const logActivity = useApp((s) => s.logActivity);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(f.draftMessage);

  /* capability awareness — email sends can go through the connected account */
  const sendGranted = useIntegrations((s) => s.capabilityGranted("google", "send_followups"));
  const googleConn = useIntegrations((s) =>
    s.connections.find((c) => c.provider === "google")
  );
  const googleLive =
    !!googleConn && (googleConn.status === "connected" || googleConn.status === "partial");
  const isEmail = f.channel === "email";
  const viaGmail = isEmail && sendGranted;
  const showSendUpsell = isEmail && googleLive && !sendGranted;

  const company = lead?.company ?? "Unknown lead";
  const d = dueIn(f.dueAt);
  const chipTone: Tone = d.overdue ? "danger" : urgency === "due" ? "warn" : "neutral";

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success(
        "Message copied",
        `Ready for ${CHANNEL_LABELS[f.channel].toLowerCase()} — ${
          lead?.contact.name ?? "the contact"
        } is the recipient.`
      );
    } catch {
      toast.error("Copy failed", "Clipboard unavailable — select the draft text manually.");
    }
  };

  const markSent = () => {
    setFollowUpStatus(f.id, "done");
    logActivity(
      "follow_up_sent",
      `Follow-up #${f.sequenceStep} sent to ${company} via ${CHANNEL_LABELS[
        f.channel
      ].toLowerCase()}`,
      f.leadId
    );
    toast.success(
      viaGmail
        ? `Sent from ${googleConn?.accountEmail ?? "your address"} — reply tracking active`
        : "Follow-up sent — next touch suggested in 4 days"
    );
  };

  const skip = () => {
    setFollowUpStatus(f.id, "skipped");
    toast.info(
      "Follow-up skipped",
      `${company} keeps its place in the pipeline — no further nudges queued for this step.`
    );
  };

  return (
    <motion.div
      variants={itemVariants}
      layout
      exit={{ opacity: 0, y: -4 }}
      className="panel px-4 py-3.5 transition-[border-color] duration-150 hover:border-line-strong"
    >
      {/* header: company · sequence · channel · due chip */}
      <div className="flex flex-wrap items-center gap-2">
        <Icon
          name={CHANNEL_ICONS[f.channel]}
          size={14}
          className="shrink-0 text-ink-faint"
          aria-label={CHANNEL_LABELS[f.channel]}
        />
        {lead ? (
          <Link
            href={`/leads/${lead.id}`}
            className="truncate text-[13.5px] font-medium text-ink transition-colors duration-150 hover:text-accent"
          >
            {company}
          </Link>
        ) : (
          <span className="truncate text-[13.5px] font-medium text-ink">{company}</span>
        )}
        <Badge tone="neutral" className="tnum">
          Nudge #{f.sequenceStep}
        </Badge>
        {f.proposalId && (
          <Link
            href={`/proposals/${f.proposalId}`}
            className="microlabel flex items-center gap-0.5 transition-colors duration-150 hover:text-accent"
          >
            proposal
            <Icon name="arrow-up-right" size={10} />
          </Link>
        )}
        <span className="flex-1" />
        <Badge tone={chipTone} className="tnum">
          {d.label}
        </Badge>
      </div>

      {/* the intelligence — why this touch, why now */}
      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-mute">
        <span className="microlabel mr-2 !text-[9.5px]">Why now</span>
        {f.reason}
      </p>

      {/* draft message */}
      {editing ? (
        <div className="mt-3">
          <Textarea
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={Math.max(6, message.split("\n").length + 1)}
            className="text-[12.5px]"
            aria-label="Edit draft message"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              <Icon name="check" size={12} />
              Done editing
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMessage(f.draftMessage)}
              disabled={message === f.draftMessage}
            >
              Reset to drafted version
            </Button>
          </div>
        </div>
      ) : (
        <div className="well mt-3 max-h-44 overflow-y-auto px-3.5 py-3">
          <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink">
            {message}
          </p>
        </div>
      )}

      {/* actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={copyMessage}>
          <Icon name="copy" size={12} />
          Copy message
        </Button>
        {!editing && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Icon name="pen" size={12} />
            Edit
          </Button>
        )}
        <span className="flex-1" />
        <Button size="sm" variant="ghost" onClick={skip}>
          Skip
        </Button>
        <Button size="sm" variant="primary" onClick={markSent}>
          <Icon name="send" size={12} />
          {viaGmail ? "Send via Gmail" : "Mark sent"}
        </Button>
      </div>

      {/* quiet capability upsell — connected, but send-from-address not granted */}
      {showSendUpsell && (
        <p className="microlabel mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-line pt-2.5">
          <Icon name="key" size={11} className="shrink-0" />
          <span>Sends use your email app —</span>
          <Link
            href="/integrations"
            className="inline-flex items-center gap-0.5 text-accent transition-colors duration-150 hover:underline"
          >
            enable send-from-your-address
            <Icon name="arrow-up-right" size={10} />
          </Link>
          <span>to send directly</span>
        </p>
      )}
    </motion.div>
  );
}

/** Compact row for the Done / Skipped accordion. */
export function FollowUpHistoryRow({
  followUp: f,
  lead,
}: {
  followUp: FollowUp;
  lead?: Lead;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-100 hover:bg-overlay/60">
      <Icon name={CHANNEL_ICONS[f.channel]} size={13} className="shrink-0 text-ink-faint" />
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-mute">
        <span className="font-medium text-ink">{lead?.company ?? "Unknown lead"}</span>
        <span className="text-ink-faint"> — {f.reason}</span>
      </span>
      <Badge tone="neutral" className="tnum shrink-0">
        Nudge #{f.sequenceStep}
      </Badge>
      <Badge tone={f.status === "done" ? "ok" : "neutral"} className="shrink-0">
        {f.status === "done" ? "Sent" : "Skipped"}
      </Badge>
    </div>
  );
}
