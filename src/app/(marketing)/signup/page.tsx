"use client";

/* ================================================================
   /signup — same spatial frame as /login (shared AuthSplit + scene,
   shared layoutIds for the cross-page morph). Two steps with a mono
   stepper: 01 Account (name / work email / password), 02 Workspace
   (name, agency size, service-type chips) → provisioning state →
   success flash → /dashboard.
   ================================================================ */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/format";
import { DUR, EASE } from "@/lib/motion";
import { PageTransition } from "@/components/ui/page";
import { Field, Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { AuthCardHeader, AuthSplit } from "@/components/auth/layout";
import { MonoStepper } from "@/components/auth/stepper";
import { emailError, passwordError, requiredError } from "@/components/auth/validate";

const SERVICE_TYPES = [
  "Web design & build",
  "SEO & content",
  "Paid media",
  "Brand identity",
  "Automation & ops",
  "Video & production",
];

const AGENCY_SIZES = ["Just me", "2–5 people", "6–12 people", "13–25 people", "26+ people"];

const stepVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: DUR.slow, ease: EASE } },
  exit: { opacity: 0, x: -24, transition: { duration: DUR.base, ease: EASE } },
};

type Phase = "idle" | "loading" | "success";

interface AccountErrors {
  name?: string;
  email?: string;
  password?: string;
}

interface WorkspaceErrors {
  workspace?: string;
  size?: string;
  services?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<Phase>("idle");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accErrors, setAccErrors] = useState<AccountErrors>({});

  const [workspace, setWorkspace] = useState("");
  const [size, setSize] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [wsErrors, setWsErrors] = useState<WorkspaceErrors>({});

  function toggleService(s: string) {
    setWsErrors((p) => ({ ...p, services: undefined }));
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    const next: AccountErrors = {
      name:
        requiredError(name, "Add your full name — it appears on proposals you send.") ??
        undefined,
      email: emailError(email) ?? undefined,
      password: passwordError(password) ?? undefined,
    };
    setAccErrors(next);
    if (next.name || next.email || next.password) return;
    setStep(1);
  }

  function submitWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "idle") return;
    const next: WorkspaceErrors = {
      workspace:
        requiredError(workspace, "Name your workspace — usually your agency name.") ??
        undefined,
      size: size ? undefined : "Pick the closest size — it tunes defaults like approval steps.",
      services:
        services.length === 0
          ? "Pick at least one — it seeds your blueprint library."
          : undefined,
    };
    setWsErrors(next);
    if (next.workspace || next.size || next.services) return;
    setPhase("loading");
    window.setTimeout(() => {
      setPhase("success");
      window.setTimeout(() => router.push("/dashboard"), 500);
    }, 1100);
  }

  return (
    <PageTransition>
      <AuthSplit>
        <AuthCardHeader
          microlabel="New workspace"
          title={step === 0 ? "Create your workspace" : "Shape the workspace"}
          lede={
            step === 0
              ? "14-day pilot on the Agency plan. No card required."
              : "Pick what you sell — Scopeforge seeds service blueprints, exclusion lists, and margin floors to match."
          }
        />

        <MonoStepper steps={["Account", "Workspace"]} active={step} className="mt-5" />

        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <motion.form
              key="account"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onSubmit={submitAccount}
              noValidate
              className="mt-5 space-y-4"
            >
              <Field label="Full name" htmlFor="su-name" error={accErrors.name}>
                <Input
                  id="su-name"
                  autoComplete="name"
                  placeholder="Maya Lindqvist"
                  value={name}
                  invalid={!!accErrors.name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (accErrors.name) setAccErrors((p) => ({ ...p, name: undefined }));
                  }}
                  onBlur={() =>
                    setAccErrors((p) => ({
                      ...p,
                      name:
                        requiredError(
                          name,
                          "Add your full name — it appears on proposals you send."
                        ) ?? undefined,
                    }))
                  }
                />
              </Field>
              <Field label="Work email" htmlFor="su-email" error={accErrors.email}>
                <Input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  placeholder="maya@ateliernorth.dk"
                  value={email}
                  invalid={!!accErrors.email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (accErrors.email)
                      setAccErrors((p) => ({ ...p, email: undefined }));
                  }}
                  onBlur={() =>
                    setAccErrors((p) => ({
                      ...p,
                      email: emailError(email) ?? undefined,
                    }))
                  }
                />
              </Field>
              <Field
                label="Password"
                htmlFor="su-password"
                error={accErrors.password}
                hint="8+ characters — a password manager string is ideal."
              >
                <Input
                  id="su-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••••••••••"
                  value={password}
                  invalid={!!accErrors.password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (accErrors.password)
                      setAccErrors((p) => ({ ...p, password: undefined }));
                  }}
                  onBlur={() =>
                    setAccErrors((p) => ({
                      ...p,
                      password: passwordError(password) ?? undefined,
                    }))
                  }
                />
              </Field>
              <Button type="submit" variant="primary" className="w-full">
                Continue to workspace
                <Icon name="arrow-right" size={13} />
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="workspace"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onSubmit={submitWorkspace}
              noValidate
              className="mt-5 space-y-4"
            >
              <Field
                label="Workspace name"
                htmlFor="su-workspace"
                error={wsErrors.workspace}
                hint="Usually your agency name — clients see it on onboarding pages."
              >
                <Input
                  id="su-workspace"
                  placeholder="Atelier North"
                  value={workspace}
                  invalid={!!wsErrors.workspace}
                  onChange={(e) => {
                    setWorkspace(e.target.value);
                    if (wsErrors.workspace)
                      setWsErrors((p) => ({ ...p, workspace: undefined }));
                  }}
                  onBlur={() =>
                    setWsErrors((p) => ({
                      ...p,
                      workspace:
                        requiredError(
                          workspace,
                          "Name your workspace — usually your agency name."
                        ) ?? undefined,
                    }))
                  }
                />
              </Field>
              <Field label="Agency size" htmlFor="su-size" error={wsErrors.size}>
                <Select
                  id="su-size"
                  value={size}
                  invalid={!!wsErrors.size}
                  onChange={(e) => {
                    setSize(e.target.value);
                    if (wsErrors.size) setWsErrors((p) => ({ ...p, size: undefined }));
                  }}
                >
                  <option value="" disabled>
                    Pick a range…
                  </option>
                  {AGENCY_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-col gap-1.5">
                <span className="microlabel">What do you sell?</span>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_TYPES.map((s) => {
                    const active = services.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleService(s)}
                        className={cx(
                          "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-[background-color,border-color,color] duration-150",
                          active
                            ? "border-accent-line bg-accent-soft text-accent"
                            : "border-line bg-inset text-ink-mute hover:border-line-strong hover:text-ink"
                        )}
                      >
                        {active && <Icon name="check" size={11} strokeWidth={2.2} />}
                        {s}
                      </button>
                    );
                  })}
                </div>
                {wsErrors.services ? (
                  <p className="flex items-center gap-1 text-[12px] text-danger">
                    <Icon name="alert-triangle" size={12} />
                    {wsErrors.services}
                  </p>
                ) : (
                  <p className="text-[12px] text-ink-faint">
                    {services.length === 0
                      ? "Pick at least one. You can add more later in Services."
                      : `${services.length} selected — ${services.length * 2} starter blueprints will be seeded.`}
                  </p>
                )}
              </div>

              {phase === "success" ? (
                <div className="flex h-8.5 w-full items-center justify-center gap-1.5 rounded-md border border-ok/25 bg-ok-soft text-[13px] font-medium text-ok">
                  <Icon name="check" size={13} strokeWidth={2.2} />
                  Workspace ready — opening it
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(0)}
                    disabled={phase !== "idle"}
                  >
                    <Icon name="chevron-left" size={13} />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={phase === "loading"}
                    className="flex-1"
                  >
                    {phase === "loading" ? "Provisioning workspace…" : "Create workspace"}
                  </Button>
                </div>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-5 border-t border-line pt-4 text-center">
          <p className="text-[12px] text-ink-faint">
            Already running on Scopeforge?{" "}
            <Link
              href="/login"
              className="font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
            >
              Sign in
            </Link>
          </p>
        </div>
      </AuthSplit>
    </PageTransition>
  );
}
