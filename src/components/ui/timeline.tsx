"use client";

/* Activity timeline — hairline spine, mono timestamps. */

import { motion } from "framer-motion";
import { cx, timeAgo } from "@/lib/format";
import type { ActivityEvent } from "@/lib/types";
import { teamById } from "@/lib/demo-data";
import { Avatar } from "./primitives";
import { Icon, type IconName } from "./icons";
import { itemVariants, listVariants } from "@/lib/motion";

const kindIcons: Partial<Record<ActivityEvent["kind"], IconName>> = {
  lead_created: "leads",
  intake_analyzed: "sparkle",
  brief_updated: "brief",
  scope_updated: "scope",
  proposal_sent: "send",
  proposal_viewed: "eye",
  proposal_accepted: "check",
  follow_up_sent: "follow-up",
  onboarding_started: "onboarding",
  change_order: "change-order",
  comment: "pen",
  stage_change: "arrow-right",
};

export function Timeline({
  events,
  limit,
  className,
}: {
  events: ActivityEvent[];
  limit?: number;
  className?: string;
}) {
  const shown = limit ? events.slice(0, limit) : events;
  return (
    <motion.ol
      variants={listVariants}
      initial="initial"
      animate="animate"
      className={cx("relative", className)}
    >
      {/* spine */}
      <span aria-hidden className="absolute top-2 bottom-2 left-[11px] w-px bg-line" />
      {shown.map((ev) => {
        const actor = teamById[ev.actorId];
        return (
          <motion.li key={ev.id} variants={itemVariants} className="relative flex gap-3 py-2 pl-0">
            <span className="relative z-10 mt-0.5 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border border-line bg-raised">
              <Icon
                name={kindIcons[ev.kind] ?? "activity"}
                size={11}
                className={cx(
                  ev.kind === "proposal_accepted" && "text-ok",
                  ev.kind === "change_order" && "text-warn",
                  ev.kind === "intake_analyzed" && "text-accent",
                  !["proposal_accepted", "change_order", "intake_analyzed"].includes(ev.kind) &&
                    "text-ink-faint"
                )}
              />
            </span>
            <div className="min-w-0 flex-1 pb-1.5">
              <p className="text-[13px] leading-snug text-ink">{ev.text}</p>
              <div className="mt-1 flex items-center gap-2">
                {actor && <Avatar initials={actor.initials} size={16} title={actor.name} />}
                <span className="font-mono text-[10.5px] tracking-wide text-ink-faint">
                  {actor?.name.split(" ")[0] ?? "System"} · {timeAgo(ev.at)}
                </span>
              </div>
            </div>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
