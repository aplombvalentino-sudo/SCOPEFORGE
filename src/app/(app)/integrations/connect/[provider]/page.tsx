"use client";

/* ================================================================
   /integrations/connect/[provider] — the connection ritual.
   A guided, three-stage procedure on a centered stage:

     01 Review access — capability cards (what / won't / scopes /
        sensitivity) + a live trust panel (WHAT / WON'T / WHY /
        WHEN / HOW to disconnect).
     02 Authorize — the 3D bridge: SCOPEFORGE workspace panel and
        a neutral provider panel in restrained perspective, joined
        by an accent beam, with a clearly-labeled sandbox consent
        frame. Never imitates a real provider consent screen.
     03 Outcome — connected / cancelled / admin-blocked states,
        each with concrete next steps. Manual import stays a
        first-class path throughout.
   ================================================================ */

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cx } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import {
  CAPABILITIES,
  PROVIDER_META,
  type CapabilityDef,
  type CapabilityKey,
  type ConnectionStatus,
  type IntegrationProvider,
} from "@/lib/integrations";
import { useIntegrations, type ConnectOutcome } from "@/lib/integrations-store";
import { PageTransition } from "@/components/ui/page";
import { Badge, Button, type Tone } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { EmptyState, useToast } from "@/components/ui/feedback";
import { MonoStepper } from "@/components/auth/stepper";
import { Wordmark } from "@/components/shell/app-shell";

/* ---------------- shared bits ---------------- */

type Stage = 1 | 2 | 3;

const SENSITIVITY_TONE: Record<CapabilityDef["sensitivity"], Tone> = {
  standard: "neutral",
  sensitive: "warn",
  restricted: "danger",
};

const ACCESS_LABEL: Record<CapabilityDef["access"], string> = {
  "on-demand": "On demand — runs only when you click",
  "send-only": "Send-only — fires only after you review and send each draft",
  "per-file": "Per file — only the files you pick in the picker",
};

const stageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: DUR.slow, ease: EASE } },
  exit: { opacity: 0, x: -16, transition: { duration: DUR.base, ease: EASE } },
};

function shortScope(scope: string): string {
  return scope.replace("https://www.googleapis.com/auth/", "");
}

function ScopeChip({ scope }: { scope: string }) {
  return (
    <span className="rounded-sm border border-line bg-inset px-1.5 py-px font-mono text-[10px] text-ink-faint">
      {shortScope(scope)}
    </span>
  );
}

/* ---------------- page ---------------- */

export default function ConnectProviderPage() {
  const params = useParams<{ provider: string }>();
  const router = useRouter();
  const raw = params.provider;
  const provider: IntegrationProvider | null =
    raw === "google" || raw === "microsoft" ? raw : null;

  if (!provider) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-5xl">
          <EmptyState
            icon="plug"
            title="That connector doesn't exist"
            body="Connections are available for Google Workspace and Microsoft 365. Pick one from the integrations hub — or import manually, which always works."
            action={
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => router.push("/integrations")}>
                  Open integrations hub
                </Button>
                <Button variant="ghost" onClick={() => router.push("/leads")}>
                  Import manually
                </Button>
              </div>
            }
          />
        </div>
      </PageTransition>
    );
  }

  return <ConnectionRitual provider={provider} />;
}

/* ---------------- the ritual ---------------- */

function ConnectionRitual({ provider }: { provider: IntegrationProvider }) {
  const router = useRouter();
  const meta = PROVIDER_META[provider];

  const connections = useIntegrations((s) => s.connections);
  const authorizing = useIntegrations((s) => s.authorizing);
  const beginAuthorization = useIntegrations((s) => s.beginAuthorization);
  const completeAuthorization = useIntegrations((s) => s.completeAuthorization);

  const connection = connections.find((c) => c.provider === provider);

  const [stage, setStage] = useState<Stage>(1);
  const [selected, setSelected] = useState<CapabilityKey[]>([
    "email_import",
    "drive_files",
  ]);

  const phase1Caps = useMemo(
    () => CAPABILITIES.filter((c) => c.phase === 1 && c.scopes[provider] !== null),
    [provider]
  );

  useEffect(() => {
    if (stage === 2) beginAuthorization(provider);
  }, [stage, provider, beginAuthorization]);

  function toggle(key: CapabilityKey) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function decide(outcome: ConnectOutcome) {
    completeAuthorization(provider, outcome, selected);
    setStage(3);
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl">
        {/* custom staged header — replaces PageHeader */}
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="microlabel mb-1.5">Platform / Integrations / Connect</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] leading-tight font-medium tracking-tight text-ink">
                Connect {meta.name}
              </h1>
              <Badge tone="neutral">Sandbox</Badge>
            </div>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-mute">
              {meta.domainHint} — nothing is requested until you choose what to enable.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/integrations")}>
            <Icon name="chevron-left" size={13} />
            Back to hub
          </Button>
        </header>

        <MonoStepper
          steps={["Review access", "Authorize", "Outcome"]}
          active={stage - 1}
          className="mb-7"
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage}
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {stage === 1 && (
              <StageReview
                provider={provider}
                caps={phase1Caps}
                selected={selected}
                onToggle={toggle}
                onContinue={() => setStage(2)}
                onManual={() => router.push("/leads")}
              />
            )}
            {stage === 2 && (
              <StageAuthorize
                provider={provider}
                caps={phase1Caps}
                selected={selected}
                waiting={authorizing === provider}
                onDecide={decide}
              />
            )}
            {stage === 3 && connection && (
              <StageOutcome
                provider={provider}
                caps={phase1Caps}
                selected={selected}
                status={connection.status}
                statusDetail={connection.statusDetail}
                accountEmail={connection.accountEmail}
                grants={connection.capabilities}
                onRetry={() => setStage(2)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

/* ================================================================
   STAGE 1 — review access
   ================================================================ */

function StageReview({
  provider,
  caps,
  selected,
  onToggle,
  onContinue,
  onManual,
}: {
  provider: IntegrationProvider;
  caps: CapabilityDef[];
  selected: CapabilityKey[];
  onToggle: (k: CapabilityKey) => void;
  onContinue: () => void;
  onManual: () => void;
}) {
  const meta = PROVIDER_META[provider];
  const chosen = caps.filter((c) => selected.includes(c.key));

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* capability cards */}
        <div className="space-y-2.5">
          <p className="microlabel">Choose what this connection can do</p>
          {caps.map((cap) => {
            const on = selected.includes(cap.key);
            const scopes = cap.scopes[provider] ?? [];
            return (
              <button
                key={cap.key}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onToggle(cap.key)}
                className={cx(
                  "group w-full rounded-lg border p-4 text-left transition-colors duration-150",
                  on
                    ? "border-accent-line bg-accent-soft/30"
                    : "border-line bg-surface hover:border-line-strong"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cx(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-all duration-150",
                      on
                        ? "border-accent bg-accent text-on-accent"
                        : "border-line-strong bg-inset group-hover:border-accent-line"
                    )}
                  >
                    {on && <Icon name="check" size={11} strokeWidth={2.4} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-medium text-ink">
                        {cap.label}
                      </span>
                      <Badge tone={SENSITIVITY_TONE[cap.sensitivity]}>
                        {cap.sensitivity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink">
                      {cap.what}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-mute">
                      Won&apos;t: {cap.not}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {scopes.map((s) => (
                        <ScopeChip key={s} scope={s} />
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* live trust panel */}
        <aside className="panel h-fit p-4 lg:sticky lg:top-20">
          <p className="microlabel">Access summary</p>

          <div className="mt-3 space-y-3.5">
            <TrustBlock label="What we access">
              {chosen.length === 0 ? (
                <p className="text-[12px] leading-relaxed text-ink-mute">
                  Identity only — your name and email to sign you in. No content access.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {chosen.map((c) => (
                    <li key={c.key} className="flex items-start gap-1.5">
                      <Icon
                        name="check"
                        size={11}
                        strokeWidth={2.2}
                        className="mt-0.5 shrink-0 text-accent"
                      />
                      <span className="text-[12px] leading-snug text-ink">{c.what}</span>
                    </li>
                  ))}
                </ul>
              )}
            </TrustBlock>

            {chosen.length > 0 && (
              <TrustBlock label="What we don't">
                <ul className="space-y-1.5">
                  {chosen.map((c) => (
                    <li key={c.key} className="text-[12px] leading-snug text-ink-mute">
                      {c.not}
                    </li>
                  ))}
                </ul>
              </TrustBlock>
            )}

            {chosen.length > 0 && (
              <TrustBlock label="Why">
                <ul className="space-y-1.5">
                  {chosen.map((c) => (
                    <li key={c.key} className="text-[12px] leading-snug text-ink-mute">
                      {c.why}
                    </li>
                  ))}
                </ul>
              </TrustBlock>
            )}

            <TrustBlock label="When">
              <ul className="space-y-1.5">
                {chosen.length === 0 ? (
                  <li className="text-[12px] leading-snug text-ink-mute">
                    Never — nothing runs without a capability enabled.
                  </li>
                ) : (
                  chosen.map((c) => (
                    <li key={c.key} className="text-[12px] leading-snug text-ink-mute">
                      {ACCESS_LABEL[c.access]}
                    </li>
                  ))
                )}
                <li className="text-[12px] leading-snug text-ink-mute">
                  Nothing runs in the background in v1.
                </li>
              </ul>
            </TrustBlock>

            <TrustBlock label="How to disconnect">
              <p className="text-[12px] leading-snug text-ink-mute">
                One click in the integrations hub — tokens are revoked at {meta.short}{" "}
                and deleted from the vault.
              </p>
            </TrustBlock>
          </div>

          <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-mute">
            Only the scopes for what you enable are requested. You can add or remove
            capabilities later.
          </p>
        </aside>
      </div>

      {/* stage footer */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={onContinue}>
          Continue — review at {meta.consentHost}
          <Icon name="arrow-right" size={13} />
        </Button>
        <Button variant="ghost" onClick={onManual}>
          Use manual import instead
        </Button>
      </div>
      <p className="mt-2 text-[12px] text-ink-faint">
        Manual paste and upload cover the same ground — connecting just removes the
        copy-paste.
      </p>
    </div>
  );
}

function TrustBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] font-medium tracking-[0.1em] text-ink-faint uppercase">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/* ================================================================
   STAGE 2 — authorize (the 3D bridge + sandbox consent frame)
   ================================================================ */

function StageAuthorize({
  provider,
  caps,
  selected,
  waiting,
  onDecide,
}: {
  provider: IntegrationProvider;
  caps: CapabilityDef[];
  selected: CapabilityKey[];
  waiting: boolean;
  onDecide: (o: ConnectOutcome) => void;
}) {
  const reduced = useReducedMotion();
  const meta = PROVIDER_META[provider];
  const requestedScopes = caps
    .filter((c) => selected.includes(c.key))
    .flatMap((c) => c.scopes[provider] ?? []);

  return (
    <div className="mx-auto max-w-3xl">
      {/* the bridge */}
      <div
        className="grid grid-cols-[1fr_minmax(36px,120px)_1fr] items-center"
        style={{ perspective: 1200 }}
      >
        {/* SCOPEFORGE workspace panel */}
        <div
          className="panel-raised p-4 shadow-e2"
          style={{ transform: "rotateY(13deg)", transformOrigin: "100% 50%" }}
        >
          <Wordmark />
          <p className="microlabel mt-3.5">Workspace</p>
          <p className="mt-0.5 text-[13px] font-medium text-ink">Atelier North</p>
          <div className="well mt-3 flex items-center gap-2 px-2.5 py-2">
            <Icon name="lock" size={13} className="shrink-0 text-accent" />
            <span className="font-mono text-[9.5px] tracking-[0.06em] text-ink-mute">
              AES-256-GCM TOKEN VAULT
            </span>
          </div>
        </div>

        {/* connection beam */}
        <div className="relative mx-1 self-center" aria-hidden>
          <div className="h-px w-full bg-accent-line" />
          {!reduced && waiting && (
            <motion.span
              className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent"
              animate={{ left: ["0%", "92%"] }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            />
          )}
        </div>

        {/* neutral provider panel — text only, no logo recreation */}
        <div
          className="panel-raised p-4 shadow-e2"
          style={{ transform: "rotateY(-13deg)", transformOrigin: "0% 50%" }}
        >
          <p className="microlabel">External provider</p>
          <p className="mt-1 font-display text-[15px] font-medium text-ink">
            {meta.name}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-ink-mute">{meta.consentHost}</p>
          <div className="well mt-3 flex items-center gap-2 px-2.5 py-2">
            <Icon name="globe" size={13} className="shrink-0 text-ink-faint" />
            <span className="font-mono text-[9.5px] tracking-[0.06em] text-ink-faint">
              AUTHORIZATION HAPPENS HERE
            </span>
          </div>
        </div>
      </div>

      {/* waiting line */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className={cx("h-1.5 w-1.5 rounded-full bg-accent", !reduced && "pulse-dot")} />
        <span className="font-mono text-[10px] tracking-[0.08em] text-ink-faint uppercase">
          Waiting for authorization at {meta.consentHost}
        </span>
      </div>

      {/* sandbox consent frame — neutral, explicitly a simulation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { duration: DUR.slow, ease: EASE, delay: 0.12 },
        }}
        className="relative z-10 mx-auto mt-5 max-w-md rounded-lg border border-line bg-overlay p-5 shadow-e3"
      >
        <div className="flex items-center justify-between gap-2">
          <Badge tone="warn">Sandbox simulation</Badge>
          <span className="font-mono text-[10px] text-ink-faint">{meta.consentHost}</span>
        </div>
        <h2 className="mt-3 font-display text-[16px] font-medium tracking-tight text-ink">
          Authorize SCOPEFORGE
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mute">
          In production this is a {meta.consentHost} window. SCOPEFORGE never sees your
          password — authorization happens entirely on the provider&apos;s domain.
        </p>

        {requestedScopes.length > 0 && (
          <div className="mt-3">
            <p className="font-mono text-[9.5px] tracking-[0.1em] text-ink-faint uppercase">
              Requesting
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {requestedScopes.map((s) => (
                <ScopeChip key={s} scope={s} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="primary" onClick={() => onDecide("success")}>
            Simulate: approve
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => onDecide("denied")}
            >
              Simulate: cancel
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => onDecide("admin_blocked")}
            >
              Simulate: admin policy block
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
   STAGE 3 — outcome states
   ================================================================ */

function StageOutcome({
  provider,
  caps,
  selected,
  status,
  statusDetail,
  accountEmail,
  grants,
  onRetry,
}: {
  provider: IntegrationProvider;
  caps: CapabilityDef[];
  selected: CapabilityKey[];
  status: ConnectionStatus;
  statusDetail?: string;
  accountEmail?: string;
  grants: { key: CapabilityKey; enabled: boolean; granted: boolean }[];
  onRetry: () => void;
}) {
  if (status === "connected" || status === "partial") {
    return (
      <OutcomeConnected
        provider={provider}
        caps={caps}
        statusDetail={status === "partial" ? statusDetail : undefined}
        accountEmail={accountEmail}
        grants={grants}
      />
    );
  }
  if (status === "admin_required") {
    return (
      <OutcomeAdminRequired
        provider={provider}
        caps={caps}
        selected={selected}
        statusDetail={statusDetail}
      />
    );
  }
  return <OutcomeDenied onRetry={onRetry} />;
}

/* ---------- connected / partial ---------- */

function OutcomeConnected({
  provider,
  caps,
  statusDetail,
  accountEmail,
  grants,
}: {
  provider: IntegrationProvider;
  caps: CapabilityDef[];
  statusDetail?: string;
  accountEmail?: string;
  grants: { key: CapabilityKey; enabled: boolean; granted: boolean }[];
}) {
  const router = useRouter();
  const meta = PROVIDER_META[provider];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ok/25 bg-ok-soft">
          <Icon name="check" size={18} strokeWidth={2.2} className="text-ok" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[18px] font-medium tracking-tight text-ink">
            {meta.name} is connected
          </h2>
          <p className="text-[12.5px] text-ink-mute">
            Signed in as <span className="font-mono text-[11.5px]">{accountEmail}</span>{" "}
            — tokens sealed in the vault.
          </p>
        </div>
      </div>

      {statusDetail && (
        <div className="mt-4 rounded-md border border-info/25 bg-info-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-mute">
          {statusDetail}
        </div>
      )}

      <div className="panel mt-5 divide-y divide-line">
        {caps.map((cap) => {
          const granted = grants.some((g) => g.key === cap.key && g.granted);
          const scopes = cap.scopes[provider] ?? [];
          return (
            <div key={cap.key} className="flex items-start gap-3 px-4 py-3">
              {granted ? (
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-ok/25 bg-ok-soft">
                  <Icon name="check" size={10} strokeWidth={2.4} className="text-ok" />
                </span>
              ) : (
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border border-line bg-inset" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cx(
                      "text-[13px] font-medium",
                      granted ? "text-ink" : "text-ink-mute"
                    )}
                  >
                    {cap.label}
                  </span>
                  {granted ? (
                    scopes.map((s) => <ScopeChip key={s} scope={s} />)
                  ) : (
                    <Badge tone="neutral">Off</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-mute">
                  {granted
                    ? cap.what
                    : "Off — you can enable this later from the hub; it will ask for exactly its scopes, nothing more."}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-md border border-line bg-surface px-3.5 py-3">
        <Icon name="doc" size={14} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-[12.5px] leading-relaxed text-ink-mute">
          Everything imported will carry a source trail — which thread, which files, who
          imported it, and when. It shows as a provenance chip on the lead.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={() => router.push("/leads")}>
          Import your first thread
          <Icon name="arrow-right" size={13} />
        </Button>
        <Button variant="secondary" onClick={() => router.push("/integrations")}>
          Open integrations hub
        </Button>
      </div>
    </div>
  );
}

/* ---------- denied (cancelled at consent) ---------- */

function OutcomeDenied({ onRetry }: { onRetry: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-inset">
        <Icon name="x" size={18} className="text-ink-mute" />
      </span>
      <h2 className="mt-4 font-display text-[18px] font-medium tracking-tight text-ink">
        Nothing was connected
      </h2>
      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-mute">
        You cancelled at the consent screen. Nothing was connected and nothing was
        accessed — there is no partial state to clean up.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
        <Button variant="secondary" onClick={() => router.push("/leads")}>
          Continue with manual import
        </Button>
      </div>
      <p className="mt-3 text-[12px] text-ink-faint">
        Manual import covers the same ground — paste a thread or upload files on any
        lead.
      </p>
    </div>
  );
}

/* ---------- admin approval required ---------- */

function OutcomeAdminRequired({
  provider,
  caps,
  selected,
  statusDetail,
}: {
  provider: IntegrationProvider;
  caps: CapabilityDef[];
  selected: CapabilityKey[];
  statusDetail?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const meta = PROVIDER_META[provider];

  const approvalEmail = useMemo(() => {
    const chosen = caps.filter((c) => selected.includes(c.key));
    const scopeLines =
      chosen.length > 0
        ? chosen
            .map(
              (c) =>
                `• ${(c.scopes[provider] ?? []).join(", ")} — ${c.label}. Boundary: ${c.not}`
            )
            .join("\n")
        : "• Identity only (name and email at sign-in) — no content scopes.";
    return `Subject: Approval request — SCOPEFORGE for ${meta.name}

Hi,

Could you approve SCOPEFORGE (the scoping and proposal tool Atelier North uses for client intake) in the ${meta.short} admin console? My connection attempt was blocked by the third-party app policy.

It asks for exactly these scopes, nothing broader:

${scopeLines}

Access is on-demand only — it acts when I click, never in the background. Tokens are stored in an encrypted vault (AES-256-GCM) and deleted the moment we disconnect.

Requested by: Maya Lindqvist (maya@ateliernorth.dk)

Thanks,
Maya`;
  }, [caps, selected, provider, meta]);

  function copyEmail() {
    navigator.clipboard
      .writeText(approvalEmail)
      .then(() =>
        toast.success(
          "Approval request copied",
          "Send it to your Workspace admin — the connection completes automatically once approved."
        )
      )
      .catch(() =>
        toast.error("Couldn't copy", "Select the text in the box and copy it manually.")
      );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-warn/25 bg-warn-soft">
          <Icon name="shield" size={18} className="text-warn" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[18px] font-medium tracking-tight text-ink">
            Your Workspace admin has to approve this first
          </h2>
          <p className="text-[12.5px] leading-relaxed text-ink-mute">
            {statusDetail ??
              "Your organization restricts third-party apps. Forward the request below and the connection completes on approval."}
          </p>
        </div>
      </div>

      <ol className="panel mt-5 divide-y divide-line">
        {[
          "Copy the approval request below.",
          "Send it to your Workspace admin.",
          "We finish the connection automatically once they approve — you'll see it in the hub.",
        ].map((step, i) => (
          <li key={step} className="flex items-start gap-3 px-4 py-3">
            <span className="font-mono text-[10.5px] font-medium tracking-[0.09em] text-accent tnum">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[13px] leading-snug text-ink">{step}</span>
          </li>
        ))}
      </ol>

      <div className="well relative mt-4">
        <div className="absolute top-2.5 right-2.5">
          <Button size="sm" variant="secondary" onClick={copyEmail}>
            <Icon name="copy" size={12} />
            Copy
          </Button>
        </div>
        <pre className="overflow-x-auto p-4 pr-24 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-ink-mute">
          {approvalEmail}
        </pre>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => router.push("/leads")}>
          Continue with manual import meanwhile
        </Button>
        <Button variant="ghost" onClick={() => router.push("/integrations")}>
          Back to integrations hub
        </Button>
      </div>
    </div>
  );
}
