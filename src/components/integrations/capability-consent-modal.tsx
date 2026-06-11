"use client";

/* ================================================================
   Capability consent — the before-consent screen for ONE capability.
   WHAT / NOT / WHY / WHEN + exact scopes, then a neutral, clearly
   sandbox-labeled authorization frame. Never imitates a provider's
   real consent UI.
   ================================================================ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DUR, EASE } from "@/lib/motion";
import {
  CAPABILITY_BY_KEY,
  PROVIDER_META,
  type CapabilityDef,
  type CapabilityKey,
  type IntegrationProvider,
} from "@/lib/integrations";
import { useIntegrations } from "@/lib/integrations-store";
import { Modal } from "@/components/ui/overlays";
import { Badge, Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";

export interface ConsentRequest {
  provider: IntegrationProvider;
  capability: CapabilityKey;
}

function sensitivityNote(provider: IntegrationProvider, def: CapabilityDef): string {
  if (provider === "google") {
    if (def.sensitivity === "restricted")
      return "Google classes this scope as restricted — it requires their security review of SCOPEFORGE, which we maintain.";
    if (def.sensitivity === "sensitive")
      return "Google classes this scope as sensitive — it's covered by Google's app verification, which we keep current.";
    return "A standard scope under Google's verification tiers — no extra review required.";
  }
  return `Classed as ${def.sensitivity} under Google's tiers. For Microsoft 365, your organization may additionally require admin consent — we check that before anything connects.`;
}

function grantToast(
  key: CapabilityKey,
  accountEmail: string
): { title: string; body?: string } {
  switch (key) {
    case "email_import":
      return {
        title: "Thread import enabled",
        body: "Pick the exact threads you need from the import dialog — nothing else is read.",
      };
    case "send_followups":
      return { title: `Follow-up sending enabled — drafts can now send from ${accountEmail}` };
    case "drive_files":
      return {
        title: "Document attach enabled",
        body: "Files you pick land on the lead one at a time — the rest of Drive stays invisible.",
      };
    case "calendar_read":
      return {
        title: "Calendar read enabled",
        body: "Selected discovery calls can now link to their leads.",
      };
  }
}

export function CapabilityConsentModal({
  request,
  onClose,
}: {
  request: ConsentRequest | null;
  onClose: () => void;
}) {
  const requestCapability = useIntegrations((s) => s.requestCapability);
  const connections = useIntegrations((s) => s.connections);
  const toast = useToast();

  /* keep the last request around so the exit animation renders content */
  const [current, setCurrent] = useState<ConsentRequest | null>(request);
  const [stage, setStage] = useState<"review" | "authorizing">("review");
  const [choiceReady, setChoiceReady] = useState(false);

  useEffect(() => {
    if (request) {
      setCurrent(request);
      setStage("review");
      setChoiceReady(false);
    }
  }, [request]);

  useEffect(() => {
    if (stage !== "authorizing" || choiceReady) return;
    const t = setTimeout(() => setChoiceReady(true), 1400);
    return () => clearTimeout(t);
  }, [stage, choiceReady]);

  if (!current) return null;

  const def = CAPABILITY_BY_KEY[current.capability];
  const meta = PROVIDER_META[current.provider];
  const scopes = def.scopes[current.provider] ?? [];
  const connection = connections.find((c) => c.provider === current.provider);
  const accountEmail = connection?.accountEmail ?? "your address";

  const resolve = (outcome: "granted" | "declined") => {
    requestCapability(current.provider, current.capability, outcome);
    onClose();
    if (outcome === "granted") {
      const t = grantToast(current.capability, accountEmail);
      toast.success(t.title, t.body);
    } else {
      toast.info("Declined — the feature stays off and nothing else changed");
    }
  };

  return (
    <Modal
      open={request !== null}
      onClose={onClose}
      title={def.label}
      width={540}
      footer={
        stage === "review" ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Not now
            </Button>
            <Button variant="primary" onClick={() => setStage("authorizing")}>
              Continue to consent
            </Button>
          </>
        ) : undefined
      }
    >
      {stage === "review" ? (
        <div className="space-y-3.5">
          <p className="microlabel">
            {meta.name}
            {connection?.accountEmail ? ` · ${connection.accountEmail}` : ""}
          </p>

          <div>
            <p className="microlabel mb-1">What we access</p>
            <p className="text-[13px] leading-relaxed text-ink">{def.what}</p>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger-soft px-3 py-2.5">
            <Icon name="x" size={13} className="mt-0.5 shrink-0 text-danger" />
            <div>
              <p className="microlabel mb-0.5 text-danger">What we don&apos;t</p>
              <p className="text-[12.5px] leading-relaxed text-ink">{def.not}</p>
            </div>
          </div>

          <div>
            <p className="microlabel mb-1">Why</p>
            <p className="text-[13px] leading-relaxed text-ink">{def.why}</p>
          </div>

          <div>
            <p className="microlabel mb-1">When</p>
            <p className="text-[13px] leading-relaxed text-ink">
              Only when you click — never in the background.
            </p>
          </div>

          <div>
            <p className="microlabel mb-1.5">Exact scopes requested</p>
            <div className="flex flex-wrap gap-1.5">
              {scopes.map((s) => (
                <code
                  key={s}
                  className="rounded-sm border border-line bg-inset px-1.5 py-0.5 font-mono text-[11px] text-ink-mute"
                >
                  {s}
                </code>
              ))}
            </div>
          </div>

          <div className="well flex items-start gap-2 px-3 py-2.5">
            <Icon name="key" size={13} className="mt-0.5 shrink-0 text-ink-faint" />
            <p className="text-[12px] leading-relaxed text-ink-mute">
              {sensitivityNote(current.provider, def)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center px-2 py-6 text-center">
          <Badge tone="neutral">Sandbox — external authorization</Badge>
          <span className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-raised">
            <Icon name="lock" size={18} className="text-ink-mute" />
          </span>
          <p className="mt-3 text-[13px] font-medium text-ink">
            Waiting for {meta.consentHost}…
          </p>
          <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-ink-mute">
            Sandbox simulation — in production this opens a {meta.short}-owned window. We
            never see your password.
          </p>
          {choiceReady ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.base, ease: EASE }}
              className="mt-5 flex items-center gap-2"
            >
              <Button variant="secondary" onClick={() => resolve("granted")}>
                Simulate: allow
              </Button>
              <Button variant="secondary" onClick={() => resolve("declined")}>
                Simulate: cancel
              </Button>
            </motion.div>
          ) : (
            <div className="mt-5 flex items-center gap-2 text-[12px] text-ink-faint">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Contacting {meta.consentHost}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
