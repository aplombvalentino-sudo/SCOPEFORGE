"use client";

/* Sticky right rail — contact card, next follow-up, quick actions. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { dueIn, initials } from "@/lib/format";
import { useApp } from "@/lib/store";
import type { Lead } from "@/lib/types";
import { Icon } from "@/components/ui/icons";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { SOURCE_LABELS } from "./lead-shared";

const CHANNEL_LABELS = { email: "Email", call: "Call", linkedin: "LinkedIn" } as const;

export function LeadRail({ lead }: { lead: Lead }) {
  const router = useRouter();
  const followUps = useApp((s) => s.followUps);

  const next = followUps
    .filter((f) => f.leadId === lead.id && (f.status === "due" || f.status === "scheduled"))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const due = next ? dueIn(next.dueAt) : null;

  return (
    <aside className="sticky top-20 hidden w-[300px] shrink-0 space-y-4 self-start xl:block">
      {/* contact */}
      <div className="panel px-4 py-3.5">
        <p className="microlabel mb-3">Contact</p>
        <div className="flex items-start gap-3">
          <Avatar initials={initials(lead.contact.name)} size={34} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">{lead.contact.name}</p>
            <p className="truncate text-[12px] text-ink-mute">{lead.contact.role}</p>
            {lead.contact.email && (
              <p className="mt-1 flex items-center gap-1.5 truncate font-mono text-[11px] text-ink-faint">
                <Icon name="mail" size={11} className="shrink-0" />
                {lead.contact.email}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
          <span className="microlabel">via</span>
          <Badge tone="neutral">{SOURCE_LABELS[lead.source]}</Badge>
        </div>
      </div>

      {/* next follow-up */}
      <div className="panel px-4 py-3.5">
        <p className="microlabel mb-3">Next follow-up</p>
        {next && due ? (
          <>
            <div className="flex items-center gap-1.5">
              <Badge tone={due.overdue ? "danger" : "warn"}>{due.label}</Badge>
              <Badge tone="neutral">{CHANNEL_LABELS[next.channel]}</Badge>
              <span className="tnum ml-auto font-mono text-[10.5px] text-ink-faint">
                step {next.sequenceStep}
              </span>
            </div>
            <p className="mt-2.5 line-clamp-3 text-[12px] leading-snug text-ink-mute">
              {next.reason}
            </p>
            <Link
              href="/follow-ups"
              className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
            >
              Open in follow-ups
              <Icon name="arrow-right" size={12} />
            </Link>
          </>
        ) : (
          <p className="text-[12px] leading-snug text-ink-faint">
            Nothing armed for this lead. Sent proposals arm a follow-up sequence automatically.
          </p>
        )}
      </div>

      {/* quick actions */}
      <div className="panel px-4 py-3.5">
        <p className="microlabel mb-2">Quick actions</p>
        <div className="flex flex-col items-stretch gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="!justify-start"
            onClick={() => router.push("/follow-ups")}
          >
            <Icon name="send" size={13} />
            Draft follow-up
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="!justify-start"
            onClick={() => router.push("/change-orders")}
          >
            <Icon name="change-order" size={13} />
            New change order
          </Button>
        </div>
      </div>
    </aside>
  );
}
