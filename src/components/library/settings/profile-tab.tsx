"use client";

/* Settings → Profile: Maya's identity block + notification routing. */

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";
import { PrefToggle, SettingsPanel } from "./bits";

export function ProfileTab() {
  const toast = useToast();
  const team = useApp((s) => s.team);
  const me = team.find((m) => m.id === "tm-maya") ?? team[0];

  const [name, setName] = useState(me?.name ?? "Maya Lindqvist");
  const [email, setEmail] = useState(me?.email ?? "maya@ateliernorth.dk");

  const [proposalViewed, setProposalViewed] = useState(true);
  const [followUpReminders, setFollowUpReminders] = useState(true);
  const [scopeRisk, setScopeRisk] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div className="max-w-2xl space-y-5">
      <SettingsPanel title="Identity">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar initials={me?.initials ?? "ML"} size={52} title={name} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium text-ink">{name}</p>
            <p className="mt-0.5 font-mono text-[11.5px] text-ink-mute">{email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toast.info(
                "Avatar uploads are disabled in the demo",
                "The monogram stays — it suits you."
              )
            }
          >
            <Icon name="upload" size={12} />
            Upload
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="pf-name">
            <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="pf-email">
            <Input
              id="pf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <p className="microlabel mb-1.5">Role</p>
          <div className="well flex items-center justify-between px-3 py-2">
            <span className="text-[13px] text-ink">
              {me?.role ?? "Founder & Managing Director"}
            </span>
            <Badge tone="accent">
              <Icon name="shield" size={9} />
              owner
            </Badge>
          </div>
          <p className="mt-1.5 text-[12px] text-ink-faint">
            Owners hold billing, margin rules, and workspace deletion. Transferring ownership
            requires another active seat.
          </p>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Notifications"
        description="Routed to email and the in-app bell. Buying signals on, noise off."
      >
        <PrefToggle
          title="Proposal viewed alerts"
          description="Real-time ping when a client opens a proposal, with dwell time per section."
          checked={proposalViewed}
          onChange={setProposalViewed}
        />
        <PrefToggle
          title="Follow-up reminders"
          description="Morning summary of follow-ups due today, plus overdue escalations."
          checked={followUpReminders}
          onChange={setFollowUpReminders}
        />
        <PrefToggle
          title="Scope risk alerts"
          description="Immediate alert when a request is classified borderline or out-of-scope."
          checked={scopeRisk}
          onChange={setScopeRisk}
        />
        <PrefToggle
          title="Weekly digest"
          description="Monday recap: pipeline movement, win rate, margin drift. Skippable if you live in the dashboard."
          checked={weeklyDigest}
          onChange={setWeeklyDigest}
        />
      </SettingsPanel>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() =>
            toast.success("Profile saved", `Notification routing updated for ${email}.`)
          }
        >
          Save profile
        </Button>
      </div>
    </div>
  );
}
