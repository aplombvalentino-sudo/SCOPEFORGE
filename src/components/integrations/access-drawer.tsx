"use client";

/* ================================================================
   "What we access & why" — the per-provider transparency drawer.
   One row per offered capability (granted state, what/not/why,
   exact scopes, access timing) plus the data-handling facts.
   ================================================================ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/format";
import {
  CAPABILITIES,
  PROVIDER_META,
  type CapabilityDef,
  type IntegrationProvider,
} from "@/lib/integrations";
import { useIntegrations } from "@/lib/integrations-store";
import { Drawer } from "@/components/ui/overlays";
import { Badge } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icons";

const ACCESS_TIMING: Record<CapabilityDef["access"], string> = {
  "on-demand": "On demand — runs only when you click, never on a schedule.",
  "send-only": "Send only — fires only when you explicitly send a reviewed draft.",
  "per-file": "Per file — touches only the files you pick, one at a time.",
};

function dataHandlingFacts(provider: IntegrationProvider): { icon: IconName; text: string }[] {
  return [
    {
      icon: "lock",
      text: "OAuth tokens are encrypted at rest with AES-256-GCM — they never reach the browser.",
    },
    {
      icon: "download",
      text: "Content is fetched on demand when you import; raw source text is purged after 90 days.",
    },
    {
      icon: "x",
      text: `Disconnecting revokes access at ${PROVIDER_META[provider].consentHost} and deletes the tokens immediately.`,
    },
    {
      icon: "activity",
      text: "Every access is written to the audit log on this page — visible to the whole workspace.",
    },
  ];
}

export function AccessDrawer({
  provider,
  onClose,
}: {
  provider: IntegrationProvider | null;
  onClose: () => void;
}) {
  const connections = useIntegrations((s) => s.connections);

  /* keep the last provider so the exit animation renders content */
  const [current, setCurrent] = useState<IntegrationProvider | null>(provider);
  useEffect(() => {
    if (provider) setCurrent(provider);
  }, [provider]);

  if (!current) return null;

  const meta = PROVIDER_META[current];
  const connection = connections.find((c) => c.provider === current);
  const offered = [...CAPABILITIES]
    .filter((c) => c.scopes[current] !== null)
    .sort((a, b) => a.phase - b.phase);

  return (
    <Drawer
      open={provider !== null}
      onClose={onClose}
      title="What we access & why"
      width={500}
      meta={
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-mute">
          <span>{meta.name}</span>
          {connection?.accountEmail && (
            <span className="font-mono text-ink-faint">{connection.accountEmail}</span>
          )}
        </p>
      }
    >
      <div>
        {offered.map((def) => {
          const state = connection?.capabilities.find((x) => x.key === def.key);
          const granted = state?.granted ?? false;
          const declined = (state?.enabled ?? false) && !granted;
          return (
            <div key={def.key} className="border-b border-line py-3.5 first:pt-1 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cx(
                    "h-2 w-2 shrink-0 rounded-full",
                    granted ? "bg-ok" : declined ? "bg-warn" : "border border-line-strong bg-inset"
                  )}
                  aria-hidden
                />
                <h3 className="text-[13px] font-medium text-ink">{def.label}</h3>
                <Badge tone="neutral">{def.access}</Badge>
                <span
                  className={cx(
                    "ml-auto text-[11.5px]",
                    granted ? "text-ok" : declined ? "text-warn" : "text-ink-faint"
                  )}
                >
                  {granted ? "Granted" : declined ? "Declined at consent" : "Not enabled"}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-[12px] leading-relaxed text-ink-mute">
                <p>
                  <span className="microlabel mr-1.5">What</span>
                  {def.what}
                </p>
                <p>
                  <span className="microlabel mr-1.5 text-danger">Not</span>
                  {def.not}
                </p>
                <p>
                  <span className="microlabel mr-1.5">Why</span>
                  {def.why}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(def.scopes[current] ?? []).map((s) => (
                  <code
                    key={s}
                    className="rounded-sm border border-line bg-inset px-1.5 py-0.5 font-mono text-[11px] text-ink-mute"
                  >
                    {s}
                  </code>
                ))}
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-faint">
                <Icon name="clock" size={12} />
                {ACCESS_TIMING[def.access]}
              </p>
            </div>
          );
        })}

        <div className="mt-4">
          <p className="microlabel mb-2">Data handling</p>
          <ul className="space-y-2">
            {dataHandlingFacts(current).map((fact) => (
              <li key={fact.text} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-inset">
                  <Icon name={fact.icon} size={12} className="text-ink-faint" />
                </span>
                <p className="text-[12px] leading-relaxed text-ink-mute">{fact.text}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/help"
            className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent transition-colors hover:text-ink"
          >
            Read the security model
            <Icon name="arrow-right" size={12} />
          </Link>
        </div>
      </div>
    </Drawer>
  );
}
