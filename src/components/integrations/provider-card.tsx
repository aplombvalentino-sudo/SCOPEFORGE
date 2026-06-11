"use client";

/* ================================================================
   Provider card — the core of the hub. Fully status-driven from
   useIntegrations(); renders capability rows from the registry and
   footer actions per connection status. No hardcoded state.
   ================================================================ */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cx, timeAgo } from "@/lib/format";
import { itemVariants } from "@/lib/motion";
import {
  CAPABILITIES,
  PROVIDER_META,
  type CapabilityDef,
  type CapabilityKey,
  type ConnectionStatus,
  type IntegrationProvider,
} from "@/lib/integrations";
import { useIntegrations } from "@/lib/integrations-store";
import { teamById } from "@/lib/demo-data";
import { Badge, Button, Dot, type Tone } from "@/components/ui/primitives";
import { Menu } from "@/components/ui/overlays";
import { Icon, type IconName } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";

const STATUS_META: Record<ConnectionStatus, { label: string; tone: Tone }> = {
  connected: { label: "Connected", tone: "ok" },
  partial: { label: "Partial access", tone: "warn" },
  reconnect_required: { label: "Reconnect required", tone: "danger" },
  admin_required: { label: "Admin approval", tone: "info" },
  disconnected: { label: "Not connected", tone: "neutral" },
  error: { label: "Error", tone: "danger" },
};

const CALLOUT_STYLE: Partial<
  Record<ConnectionStatus, { frame: string; icon: IconName; iconColor: string }>
> = {
  partial: { frame: "border-warn/20 bg-warn-soft", icon: "alert-triangle", iconColor: "text-warn" },
  reconnect_required: {
    frame: "border-danger/20 bg-danger-soft",
    icon: "alert-triangle",
    iconColor: "text-danger",
  },
  admin_required: { frame: "border-info/20 bg-info-soft", icon: "shield", iconColor: "text-info" },
};

/** A complete, ready-to-forward approval request for the workspace admin. */
function approvalRequestEmail(provider: IntegrationProvider): string {
  const meta = PROVIDER_META[provider];
  const offered = CAPABILITIES.filter((c) => c.phase === 1 && c.scopes[provider] !== null);
  const scopeLines = offered
    .map((c) => {
      const scopes = (c.scopes[provider] ?? []).join(", ");
      return `- ${scopes}\n  What it allows: ${c.what}\n  Boundary: ${c.not}`;
    })
    .join("\n\n");
  return `Subject: Approval request — SCOPEFORGE access to ${meta.name}

Hi,

I'd like to connect SCOPEFORGE (our quote-to-scope tool) to my ${meta.name} work account. Our tenant requires admin approval for third-party apps, so this needs your sign-off.

SCOPEFORGE requests only the scopes below. Each one stays off until I enable its feature myself, and access is on demand — nothing runs in the background.

${scopeLines}

What applies to every scope:
- Tokens are encrypted at rest (AES-256-GCM) and deleted the moment we disconnect.
- Content is fetched only when a person clicks import; raw source text is purged after 90 days.
- Every access is written to a workspace-visible audit log.
- Disconnecting revokes access at ${meta.consentHost} immediately.

Approval takes about two minutes from the ${meta.short} admin console. Happy to walk through it together.

Thanks,
Maya Lindqvist
maya@ateliernorth.dk`;
}

/** Toggle-shaped "Enable" affordance — opens the consent screen, never flips silently. */
function EnableSwitch({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 rounded-md border border-line bg-inset px-2 py-1 text-[12px] font-medium text-ink-mute transition-colors duration-150 hover:border-accent-line hover:text-ink"
    >
      <span className="relative h-[14px] w-6 shrink-0 rounded-full border border-line-strong bg-inset transition-colors duration-150 group-hover:border-accent-line">
        <span className="absolute top-1/2 left-0.5 h-2 w-2 -translate-y-1/2 rounded-full bg-ink-faint" />
      </span>
      Enable
    </button>
  );
}

function CapabilityRow({
  def,
  enabled,
  granted,
  actionable,
  onRequest,
}: {
  def: CapabilityDef;
  enabled: boolean;
  granted: boolean;
  actionable: boolean;
  onRequest: (key: CapabilityKey) => void;
}) {
  const phase2 = def.phase >= 2;

  let state: ReactNode;
  if (phase2) {
    state = <span className="text-[12px] text-ink-faint">Later</span>;
  } else if (granted) {
    state = (
      <span className="flex items-center gap-1.5 text-[12.5px] text-ok">
        <Icon name="check" size={13} strokeWidth={2.2} />
        Active
      </span>
    );
  } else if (enabled) {
    state = (
      <>
        <span className="flex items-center gap-1.5 text-[12.5px] text-warn">
          <Icon name="alert-triangle" size={13} />
          Declined at consent
        </span>
        {actionable && (
          <Button variant="ghost" size="sm" onClick={() => onRequest(def.key)}>
            Request again
          </Button>
        )}
      </>
    );
  } else {
    state = actionable ? (
      <EnableSwitch onClick={() => onRequest(def.key)} />
    ) : (
      <span className="text-[12px] text-ink-faint">Off</span>
    );
  }

  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line py-2.5 last:border-0",
        phase2 && "opacity-55"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-ink">{def.label}</span>
          <Badge tone="neutral">{def.access}</Badge>
          {phase2 && <Badge tone="neutral">Phase 2</Badge>}
        </div>
        <p className="microlabel mt-0.5">{def.sensitivity} scope</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{state}</div>
    </div>
  );
}

export function ProviderCard({
  provider,
  onEnableCapability,
  onOpenAccess,
  onDisconnect,
  onViewActivity,
}: {
  provider: IntegrationProvider;
  onEnableCapability: (key: CapabilityKey) => void;
  onOpenAccess: () => void;
  onDisconnect: () => void;
  onViewActivity: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const connection = useIntegrations((s) => s.connections.find((c) => c.provider === provider));
  const reconnect = useIntegrations((s) => s.reconnect);

  const [checking, setChecking] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    },
    []
  );

  if (!connection) return null;

  const meta = PROVIDER_META[provider];
  const status = connection.status;
  const statusMeta = STATUS_META[status];
  const actionable = status === "connected" || status === "partial";
  const connectedBy = connection.connectedById ? teamById[connection.connectedById] : undefined;

  const offered = [...CAPABILITIES]
    .filter((c) => c.scopes[provider] !== null)
    .sort((a, b) => a.phase - b.phase);

  const handleReconnect = () => {
    reconnect(provider);
    toast.success("Re-authorized — existing grants restored");
  };

  const copyApproval = () => {
    void navigator.clipboard.writeText(approvalRequestEmail(provider)).then(
      () =>
        toast.success(
          "Approval request copied",
          `Ready to forward to your ${meta.short} admin — exact scopes and their boundaries included.`
        ),
      () => toast.error("Copy failed", "Your browser blocked clipboard access — try once more.")
    );
  };

  const checkApproval = () => {
    setChecking(true);
    checkTimer.current = setTimeout(() => {
      setChecking(false);
      toast.info("Still pending — we'll keep the connection ready");
    }, 1000);
  };

  const callout = connection.statusDetail
    ? (CALLOUT_STYLE[status] ?? {
        frame: "border-line bg-inset",
        icon: "lock" as IconName,
        iconColor: "text-ink-faint",
      })
    : null;

  return (
    <motion.article variants={itemVariants} className="panel flex flex-col">
      <header className="border-b border-line px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-[15px] font-medium tracking-tight text-ink">
            {meta.name}
          </h3>
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          {connection.sandbox && <Badge tone="neutral">Sandbox</Badge>}
        </div>
        <p className="microlabel mt-1">{meta.domainHint}</p>
        {connection.accountEmail && (
          <p className="mt-1.5 flex flex-wrap items-center text-[12px] text-ink-mute">
            <span className="font-mono text-ink">{connection.accountEmail}</span>
            {connectedBy && connection.connectedAt && (
              <>
                <Dot />
                <span>
                  Connected by {connectedBy.name} {timeAgo(connection.connectedAt)}
                </span>
              </>
            )}
            {connection.lastUsedAt && (
              <>
                <Dot />
                <span>Last used {timeAgo(connection.lastUsedAt)}</span>
              </>
            )}
          </p>
        )}
      </header>

      {connection.statusDetail && callout && (
        <div
          className={cx(
            "mx-4 mt-3 flex items-start gap-2 rounded-md border px-3 py-2.5",
            callout.frame
          )}
        >
          <Icon name={callout.icon} size={13} className={cx("mt-0.5 shrink-0", callout.iconColor)} />
          <p className="text-[12.5px] leading-relaxed text-ink">{connection.statusDetail}</p>
        </div>
      )}

      <div className="flex-1 px-4 py-1.5">
        {offered.map((def) => {
          const state = connection.capabilities.find((x) => x.key === def.key);
          return (
            <CapabilityRow
              key={def.key}
              def={def}
              enabled={state?.enabled ?? false}
              granted={state?.granted ?? false}
              actionable={actionable}
              onRequest={onEnableCapability}
            />
          );
        })}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
        {status === "disconnected" && (
          <>
            <p className="text-[12px] text-ink-faint">
              Nothing is requested until you enable a capability.
            </p>
            <Button variant="primary" onClick={() => router.push(`/integrations/connect/${provider}`)}>
              Connect {meta.name}
            </Button>
          </>
        )}

        {actionable && (
          <>
            <Button variant="secondary" onClick={onOpenAccess}>
              <Icon name="eye" size={13} />
              What we access &amp; why
            </Button>
            <Menu
              align="end"
              trigger={
                <Button variant="ghost" aria-label={`More actions for ${meta.name}`}>
                  <Icon name="more" size={14} />
                </Button>
              }
              items={[
                { label: "Reconnect", onSelect: handleReconnect },
                { label: "View activity", onSelect: onViewActivity },
                { label: "Disconnect…", danger: true, onSelect: onDisconnect },
              ]}
            />
          </>
        )}

        {status === "reconnect_required" && (
          <>
            <p className="text-[12px] text-ink-faint">
              Restores the existing grants — no new scopes requested.
            </p>
            <Button variant="primary" onClick={handleReconnect}>
              <Icon name="refresh" size={13} />
              Re-authorize
            </Button>
          </>
        )}

        {status === "admin_required" && (
          <>
            <Button variant="secondary" onClick={copyApproval}>
              <Icon name="copy" size={13} />
              Copy approval request
            </Button>
            <Button variant="ghost" loading={checking} onClick={checkApproval}>
              Check approval status
            </Button>
          </>
        )}
      </footer>
    </motion.article>
  );
}
