"use client";

/* ================================================================
   Integration activity log — every connection, grant, import, and
   revocation, with who and when. Filterable by provider.
   ================================================================ */

import { motion } from "framer-motion";
import { timeAgo } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { PROVIDER_META, type IntegrationEventKind, type IntegrationProvider } from "@/lib/integrations";
import { useIntegrations } from "@/lib/integrations-store";
import { teamById } from "@/lib/demo-data";
import { Section } from "@/components/ui/page";
import { Segmented } from "@/components/ui/tabs";
import { Avatar, Badge, Button } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Icon, type IconName } from "@/components/ui/icons";

export type ProviderFilter = "all" | IntegrationProvider;

const KIND_ICON: Record<IntegrationEventKind, IconName> = {
  connected: "plug",
  consent_screen_opened: "lock",
  scope_granted: "key",
  scope_declined: "x",
  import_completed: "download",
  import_partial: "alert-triangle",
  send_completed: "send",
  refresh_failed: "alert-triangle",
  reconnected: "refresh",
  admin_blocked: "shield",
  disconnected: "x",
  data_purged: "trash",
};

const KIND_TONE: Partial<Record<IntegrationEventKind, string>> = {
  refresh_failed: "text-danger",
  import_partial: "text-warn",
  admin_blocked: "text-info",
  data_purged: "text-danger",
};

export function ActivityLog({
  filter,
  onFilterChange,
}: {
  filter: ProviderFilter;
  onFilterChange: (f: ProviderFilter) => void;
}) {
  const events = useIntegrations((s) => s.events);
  const filtered = filter === "all" ? events : events.filter((e) => e.provider === filter);

  return (
    <Section
      title="Activity log"
      description="Every connection, grant, import, and revocation — with who and when."
      actions={
        <Segmented<ProviderFilter>
          options={[
            { value: "all", label: "All" },
            { value: "google", label: "Google" },
            { value: "microsoft", label: "Microsoft" },
          ]}
          value={filter}
          onChange={onFilterChange}
        />
      }
    >
      {filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="activity"
            title="No activity for this provider yet"
            body="Connect a provider or run an import — every access lands here, visible to the whole workspace."
            action={
              filter !== "all" ? (
                <Button variant="secondary" size="sm" onClick={() => onFilterChange("all")}>
                  Show all providers
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <motion.ul
          key={filter}
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="panel overflow-hidden"
        >
          {filtered.map((e) => {
            const member = teamById[e.actorId];
            return (
              <motion.li
                key={e.id}
                variants={itemVariants}
                className="flex items-start gap-3 border-b border-line px-4 py-2.5 last:border-0"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-inset">
                  <Icon
                    name={KIND_ICON[e.kind]}
                    size={12}
                    className={KIND_TONE[e.kind] ?? "text-ink-faint"}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-snug text-ink">{e.text}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Avatar initials={member ? member.initials : "?"} size={16} title={member?.name} />
                    <span className="text-[11.5px] text-ink-mute">{member?.name ?? "Unknown"}</span>
                    <span className="tnum font-mono text-[11px] text-ink-faint">{timeAgo(e.at)}</span>
                  </div>
                </div>
                <Badge tone="neutral" className="shrink-0">
                  {PROVIDER_META[e.provider].short}
                </Badge>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </Section>
  );
}
