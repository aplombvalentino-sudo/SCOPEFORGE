"use client";

/* Settings → Team: seat table, role/remove menu, invite flow.
   Invites and removals are session-local (no store mutation exists). */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import type { TeamMember } from "@/lib/types";
import { initials as toInitials } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { Menu, Modal } from "@/components/ui/overlays";
import { Field, Input, Select } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";
import { localId } from "../bits";

const ROLE_OPTIONS = [
  "Account Manager",
  "Designer",
  "Developer",
  "Strategist",
  "Producer",
  "Finance",
];

const SEAT_LIMIT = 15;

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "New member";
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

export function TeamTab() {
  const toast = useToast();
  const team = useApp((s) => s.team);
  const workspace = useApp((s) => s.workspace);

  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [invited, setInvited] = useState<TeamMember[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(ROLE_OPTIONS[0]);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  const rows = useMemo(
    () => [...team.filter((m) => !removedIds.has(m.id)), ...invited],
    [team, removedIds, invited]
  );

  /** workspace.seats counts billed seats beyond the listed sample. */
  const seatsInUse = workspace.seats - removedIds.size + invited.length;
  const canInvite = inviteEmail.includes("@") && inviteEmail.includes(".");

  const sendInvite = () => {
    if (!canInvite) return;
    const email = inviteEmail.trim().toLowerCase();
    const name = nameFromEmail(email);
    setInvited((prev) => [
      ...prev,
      {
        id: localId("tm"),
        name,
        role: inviteRole,
        email,
        initials: toInitials(name),
        seatStatus: "invited",
      },
    ]);
    toast.success(
      `Invite sent to ${email}`,
      `${name} joins as ${inviteRole} once they accept — the seat is reserved now.`
    );
    setInviteEmail("");
    setInviteRole(ROLE_OPTIONS[0]);
    setInviteOpen(false);
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    const m = removeTarget;
    if (invited.some((i) => i.id === m.id)) {
      setInvited((prev) => prev.filter((i) => i.id !== m.id));
    } else {
      setRemovedIds((prev) => new Set(prev).add(m.id));
    }
    setRemoveOpen(false);
    toast.success(
      `${m.name} removed from ${workspace.name}`,
      `Their open leads were reassigned to you. ${seatsInUse - 1} of ${SEAT_LIMIT} seats now in use.`
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[15px] font-medium tracking-tight text-ink">
            Members
          </h2>
          <p className="tnum mt-0.5 text-[12.5px] text-ink-mute">
            {seatsInUse} of {SEAT_LIMIT} seats in use · billed at €79/user/month on the{" "}
            {workspace.plan} plan
          </p>
        </div>
        <Button variant="primary" onClick={() => setInviteOpen(true)}>
          <Icon name="plus" size={13} />
          Invite member
        </Button>
      </div>

      <motion.div variants={listVariants} initial="initial" animate="animate">
        <Table>
          <THead>
            <tr>
              <TH>Member</TH>
              <TH>Role</TH>
              <TH>Email</TH>
              <TH>Seat</TH>
              <TH aria-label="Actions" />
            </tr>
          </THead>
          <TBody>
            {rows.map((m) => (
              <motion.tr
                key={m.id}
                variants={itemVariants}
                layout
                className="transition-colors duration-100 hover:bg-overlay/40"
              >
                <TD>
                  <span className="flex items-center gap-2.5">
                    <Avatar initials={m.initials} size={26} title={m.name} />
                    <span className="text-[13px] font-medium text-ink">{m.name}</span>
                  </span>
                </TD>
                <TD>
                  <span className="text-[12.5px] text-ink-mute">{m.role}</span>
                </TD>
                <TD>
                  <span className="font-mono text-[11.5px] text-ink-mute">{m.email}</span>
                </TD>
                <TD>
                  <Badge tone={m.seatStatus === "active" ? "ok" : "info"}>
                    {m.seatStatus}
                  </Badge>
                </TD>
                <TD className="w-10 text-right">
                  <Menu
                    align="end"
                    trigger={
                      <button
                        type="button"
                        aria-label={`Actions for ${m.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors duration-150 hover:bg-overlay hover:text-ink"
                      >
                        <Icon name="more" size={14} />
                      </button>
                    }
                    items={[
                      {
                        label: "Change role",
                        onSelect: () =>
                          toast.info(
                            `Role change drafted for ${m.name.split(" ")[0]}`,
                            `They'll confirm the move from ${m.role} by email — demo only, nothing was sent.`
                          ),
                      },
                      {
                        label:
                          m.seatStatus === "invited" ? "Revoke invite" : "Remove from workspace",
                        danger: true,
                        onSelect: () => {
                          setRemoveTarget(m);
                          setRemoveOpen(true);
                        },
                      },
                    ]}
                  />
                </TD>
              </motion.tr>
            ))}
          </TBody>
        </Table>
      </motion.div>

      <p className="tnum mt-3 font-mono text-[11px] text-ink-faint">
        {rows.length} members listed · {rows.filter((m) => m.seatStatus === "invited").length}{" "}
        pending invite{rows.filter((m) => m.seatStatus === "invited").length === 1 ? "" : "s"}
      </p>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a member"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={!canInvite} onClick={sendInvite}>
              <Icon name="send" size={12} />
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Email"
            htmlFor="invite-email"
            hint={`They'll get a join link for ${workspace.domain} — valid 7 days.`}
          >
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="anna.holm@ateliernorth.dk"
              autoFocus
            />
          </Field>
          <Field
            label="Role"
            htmlFor="invite-role"
            hint="Roles are labels, not permissions — everyone except the owner has the same access."
          >
            <Select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title={
          removeTarget?.seatStatus === "invited"
            ? `Revoke ${removeTarget.name}'s invite?`
            : `Remove ${removeTarget?.name ?? "member"}?`
        }
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmRemove}>
              {removeTarget?.seatStatus === "invited" ? "Revoke invite" : "Remove member"}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-mute">
          {removeTarget?.seatStatus === "invited"
            ? "The join link stops working immediately and the reserved seat is released."
            : `${removeTarget?.name ?? "They"} loses access immediately. Open leads and tasks they own are reassigned to you, and their seat frees on the next invoice.`}
        </p>
      </Modal>
    </div>
  );
}
