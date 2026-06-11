"use client";

/* ================================================================
   /integrations — the trust centerpiece. Every state on this page
   is driven by useIntegrations(); demo machinery lives only behind
   the clearly-labeled "Demo controls" menu in the header.
   ================================================================ */

import { useState } from "react";
import { motion } from "framer-motion";
import { listVariants } from "@/lib/motion";
import { PROVIDER_META, type IntegrationProvider } from "@/lib/integrations";
import { useIntegrations } from "@/lib/integrations-store";
import { PageHeader, PageTransition, Section } from "@/components/ui/page";
import { Button } from "@/components/ui/primitives";
import { Menu } from "@/components/ui/overlays";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";
import { PermissionLadder } from "@/components/integrations/permission-ladder";
import { ProviderCard } from "@/components/integrations/provider-card";
import {
  CapabilityConsentModal,
  type ConsentRequest,
} from "@/components/integrations/capability-consent-modal";
import { AccessDrawer } from "@/components/integrations/access-drawer";
import { DisconnectModal } from "@/components/integrations/disconnect-modal";
import { ActivityLog, type ProviderFilter } from "@/components/integrations/activity-log";
import { PlannedConnectors } from "@/components/integrations/planned-connectors";
import { SecurityFacts } from "@/components/integrations/security-facts";

const PROVIDERS = Object.keys(PROVIDER_META) as IntegrationProvider[];

export default function IntegrationsPage() {
  const toast = useToast();
  const simulateExpiry = useIntegrations((s) => s.simulateExpiry);
  const completeAuthorization = useIntegrations((s) => s.completeAuthorization);
  const reconnect = useIntegrations((s) => s.reconnect);

  const [consent, setConsent] = useState<ConsentRequest | null>(null);
  const [accessProvider, setAccessProvider] = useState<IntegrationProvider | null>(null);
  const [disconnectProvider, setDisconnectProvider] = useState<IntegrationProvider | null>(null);
  const [activityFilter, setActivityFilter] = useState<ProviderFilter>("all");

  const jumpToActivity = (provider: IntegrationProvider) => {
    setActivityFilter(provider);
    document
      .getElementById("integrations-activity")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PageTransition>
      <PageHeader
        overline="PLATFORM / INTEGRATIONS"
        title="Integrations"
        description="Access covers only the content you select, runs on demand — never in the background — and is reversible in one click."
        actions={
          <Menu
            align="end"
            trigger={
              <Button variant="ghost" size="sm">
                <Icon name="sparkle" size={13} />
                Demo controls
              </Button>
            }
            items={[
              {
                label: "Simulate token expiry (Google)",
                onSelect: () => {
                  simulateExpiry("google");
                  toast.info(
                    "Token expiry simulated",
                    "Google Workspace now needs re-authorization — grants kept, imports paused."
                  );
                },
              },
              {
                label: "Simulate admin block (Microsoft)",
                onSelect: () => {
                  completeAuthorization("microsoft", "admin_blocked", []);
                  toast.info(
                    "Admin block simulated",
                    "Microsoft 365 now waits on workspace-admin approval."
                  );
                },
              },
              {
                label: "Restore healthy state",
                onSelect: () => {
                  reconnect("google");
                  toast.success(
                    "Healthy state restored",
                    "Google Workspace re-authorized with its existing grants."
                  );
                },
              },
            ]}
          />
        }
      />

      <Section
        title="How access works"
        description="Three modes — you choose how much the workspace connects."
      >
        <PermissionLadder />
      </Section>

      <Section title="Providers">
        <motion.div
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="grid items-start gap-4 xl:grid-cols-2"
        >
          {PROVIDERS.map((provider) => (
            <ProviderCard
              key={provider}
              provider={provider}
              onEnableCapability={(capability) => setConsent({ provider, capability })}
              onOpenAccess={() => setAccessProvider(provider)}
              onDisconnect={() => setDisconnectProvider(provider)}
              onViewActivity={() => jumpToActivity(provider)}
            />
          ))}
        </motion.div>
      </Section>

      <div id="integrations-activity" className="scroll-mt-16">
        <ActivityLog filter={activityFilter} onFilterChange={setActivityFilter} />
      </div>

      <Section
        title="Planned connectors"
        description="What's next on the roadmap — tell us what your workspace needs first."
      >
        <PlannedConnectors />
      </Section>

      <SecurityFacts />

      <CapabilityConsentModal request={consent} onClose={() => setConsent(null)} />
      <AccessDrawer provider={accessProvider} onClose={() => setAccessProvider(null)} />
      <DisconnectModal
        provider={disconnectProvider}
        onClose={() => setDisconnectProvider(null)}
      />
    </PageTransition>
  );
}
