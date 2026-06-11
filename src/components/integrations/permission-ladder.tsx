"use client";

/* ================================================================
   Permission ladder — the three access modes of the workspace.
   Manual import is a feature, not a fallback; Connected assist is
   the current mode; Advanced sync is explicitly "later".
   ================================================================ */

import { motion } from "framer-motion";
import { cx } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { Badge, type Tone } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icons";

interface LadderMode {
  key: string;
  icon: IconName;
  title: string;
  badgeTone: Tone;
  badgeLabel: string;
  body: string;
  current?: boolean;
  muted?: boolean;
}

const MODES: LadderMode[] = [
  {
    key: "manual",
    icon: "upload",
    title: "Manual import",
    badgeTone: "ok",
    badgeLabel: "Always available",
    body: "Paste emails, upload briefs and transcripts by hand. Works with zero connections — and always will.",
  },
  {
    key: "assist",
    icon: "plug",
    title: "Connected assist",
    badgeTone: "accent",
    badgeLabel: "Current mode",
    current: true,
    body: "Import only the threads and files you pick, at the moment you click. Nothing syncs in the background.",
  },
  {
    key: "sync",
    icon: "refresh",
    title: "Advanced sync",
    badgeTone: "neutral",
    badgeLabel: "Later — admin-approved",
    muted: true,
    body: "Continuous mailbox and calendar sync for teams that want it. Ships later, gated behind workspace-admin approval.",
  },
];

export function PermissionLadder() {
  return (
    <motion.div
      variants={listVariants}
      initial="initial"
      animate="animate"
      className="grid gap-3 md:grid-cols-3"
    >
      {MODES.map((mode) => (
        <motion.div
          key={mode.key}
          variants={itemVariants}
          className={cx(
            "panel px-4 py-3.5",
            mode.current && "border-accent-line bg-accent-soft/30",
            mode.muted && "opacity-60"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon
                name={mode.icon}
                size={14}
                className={mode.current ? "text-accent" : "text-ink-faint"}
              />
              <h3 className="text-[13px] font-medium text-ink">{mode.title}</h3>
            </div>
            <Badge tone={mode.badgeTone}>{mode.badgeLabel}</Badge>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mute">{mode.body}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
