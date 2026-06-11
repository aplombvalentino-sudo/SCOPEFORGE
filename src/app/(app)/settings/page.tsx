"use client";

/* ================================================================
   /settings — Workspace, Team, Billing, Profile, Margin rules.
   Tab state lives in ?tab= (the account menu deep-links to
   ?tab=profile and ?tab=billing), so the consumer sits in Suspense.
   ================================================================ */

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { DUR, EASE } from "@/lib/motion";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Tabs, type TabDef } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/feedback";
import { WorkspaceTab } from "@/components/library/settings/workspace-tab";
import { TeamTab } from "@/components/library/settings/team-tab";
import { BillingTab } from "@/components/library/settings/billing-tab";
import { ProfileTab } from "@/components/library/settings/profile-tab";
import { MarginTab } from "@/components/library/settings/margin-tab";

const TAB_VALUES = ["workspace", "team", "billing", "profile", "margin"] as const;
type SettingsTab = (typeof TAB_VALUES)[number];

function isSettingsTab(v: string | null): v is SettingsTab {
  return v !== null && (TAB_VALUES as readonly string[]).includes(v);
}

const TABS: TabDef<SettingsTab>[] = [
  { value: "workspace", label: "Workspace" },
  { value: "team", label: "Team" },
  { value: "billing", label: "Billing" },
  { value: "profile", label: "Profile" },
  { value: "margin", label: "Margin rules" },
];

function SettingsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: SettingsTab = isSettingsTab(raw) ? raw : "workspace";

  return (
    <PageTransition>
      <PageHeader
        overline="WORKSPACE / SETTINGS"
        title="Settings"
        description="Workspace identity, seats, billing — and the guardrails every new scope inherits."
      />

      <Tabs
        tabs={TABS}
        value={tab}
        onChange={(v) =>
          router.replace(v === "workspace" ? "/settings" : `/settings?tab=${v}`, {
            scroll: false,
          })
        }
        className="mb-5"
      />

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.base, ease: EASE }}
      >
        {tab === "workspace" && <WorkspaceTab />}
        {tab === "team" && <TeamTab />}
        {tab === "billing" && <BillingTab />}
        {tab === "profile" && <ProfileTab />}
        {tab === "margin" && <MarginTab />}
      </motion.div>
    </PageTransition>
  );
}

function SettingsFallback() {
  return (
    <div role="status" aria-label="Loading settings">
      <Skeleton className="mb-2 h-3 w-40" />
      <Skeleton className="mb-5 h-6 w-32" />
      <Skeleton className="mb-5 h-8 w-full max-w-md" />
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsContent />
    </Suspense>
  );
}
