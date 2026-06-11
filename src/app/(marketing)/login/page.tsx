"use client";

/* ================================================================
   /login — split spatial auth. Form column left, layered product
   scene right. Inline validation on blur + submit; demo error path
   (password "wrong"); "Use demo workspace" prefills and routes;
   forgot-password is an in-card subview ending in a link-sent
   state. Submit: ~900ms working state → success flash → /dashboard.
   ================================================================ */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE } from "@/lib/motion";
import { PageTransition } from "@/components/ui/page";
import { Field, Input } from "@/components/ui/fields";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { AuthCardHeader, AuthSplit, HairlineDivider } from "@/components/auth/layout";
import { emailError, passwordError } from "@/components/auth/validate";

const DEMO_EMAIL = "demo@ateliernorth.dk";
const DEMO_PASSWORD = "atelier-north-2026";

const subViewVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: DUR.slow, ease: EASE } },
  exit: { opacity: 0, x: -24, transition: { duration: DUR.base, ease: EASE } },
};

type View = "signin" | "forgot" | "sent";
type Phase = "idle" | "loading" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState<string | undefined>(undefined);
  const [resetSending, setResetSending] = useState(false);

  function enterWorkspace() {
    setPhase("success");
    window.setTimeout(() => router.push("/dashboard"), 500);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "idle") return;
    const eErr = emailError(email) ?? undefined;
    const pErr = passwordError(password) ?? undefined;
    setErrors({ email: eErr, password: pErr });
    if (eErr || pErr) return;
    setFormError(null);
    setPhase("loading");
    window.setTimeout(() => {
      if (password === "wrong") {
        setPhase("idle");
        setFormError(
          "That password didn't match. Passwords are checked by your identity provider — we never store them in the browser."
        );
        return;
      }
      enterWorkspace();
    }, 900);
  }

  function fillDemoAndEnter() {
    if (phase !== "idle") return;
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setFormError(null);
    setPhase("loading");
    window.setTimeout(enterWorkspace, 900);
  }

  function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (resetSending) return;
    const err = emailError(resetEmail) ?? undefined;
    setResetError(err);
    if (err) return;
    setResetSending(true);
    window.setTimeout(() => {
      setResetSending(false);
      setView("sent");
    }, 700);
  }

  return (
    <PageTransition>
      <AuthSplit>
        <AnimatePresence mode="wait" initial={false}>
          {view === "signin" && (
            <motion.div
              key="signin"
              variants={subViewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AuthCardHeader
                microlabel="Workspace login"
                title="Sign in to your workspace"
                lede="Pipeline, briefs, scopes and proposals — exactly where you left them."
              />

              {formError && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5"
                >
                  <Icon
                    name="alert-triangle"
                    size={13}
                    className="mt-0.5 shrink-0 text-danger"
                  />
                  <p className="text-[12px] leading-snug text-ink">{formError}</p>
                </div>
              )}

              <form onSubmit={submit} noValidate className="mt-5 space-y-4">
                <Field label="Work email" htmlFor="login-email" error={errors.email}>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="maya@ateliernorth.dk"
                    value={email}
                    invalid={!!errors.email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                    }}
                    onBlur={() =>
                      setErrors((p) => ({ ...p, email: emailError(email) ?? undefined }))
                    }
                  />
                </Field>
                <Field
                  label="Password"
                  htmlFor="login-password"
                  error={errors.password}
                >
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    invalid={!!errors.password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    onBlur={() =>
                      setErrors((p) => ({
                        ...p,
                        password: passwordError(password) ?? undefined,
                      }))
                    }
                  />
                </Field>

                {phase === "success" ? (
                  <div className="flex h-8.5 w-full items-center justify-center gap-1.5 rounded-md border border-ok/25 bg-ok-soft text-[13px] font-medium text-ok">
                    <Icon name="check" size={13} strokeWidth={2.2} />
                    Signed in — opening your workspace
                  </div>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    loading={phase === "loading"}
                    className="w-full"
                  >
                    {phase === "loading"
                      ? "Checking with your identity provider…"
                      : "Sign in"}
                  </Button>
                )}
              </form>

              <div className="my-5">
                <HairlineDivider label="or" />
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={fillDemoAndEnter}
                disabled={phase !== "idle"}
              >
                Use demo workspace
              </Button>
              <p className="mt-2 text-center font-mono text-[9.5px] tracking-[0.08em] text-ink-faint uppercase">
                Atelier North · 14 seats · Seeded pipeline
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-[12px] text-ink-mute transition-colors duration-150 hover:text-ink"
                >
                  Forgot password?
                </button>
                <Link
                  href="/signup"
                  className="flex items-center gap-1 text-[12px] font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
                >
                  Create a workspace
                  <Icon name="arrow-right" size={11} />
                </Link>
              </div>
            </motion.div>
          )}

          {view === "forgot" && (
            <motion.div
              key="forgot"
              variants={subViewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AuthCardHeader
                microlabel="Password reset"
                title="Get a sign-in link"
                lede="Enter your work email and we'll send a one-time sign-in link — no password needed."
              />
              <form onSubmit={submitReset} noValidate className="mt-5 space-y-4">
                <Field label="Work email" htmlFor="reset-email" error={resetError}>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="maya@ateliernorth.dk"
                    value={resetEmail}
                    invalid={!!resetError}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      if (resetError) setResetError(undefined);
                    }}
                    onBlur={() => setResetError(emailError(resetEmail) ?? undefined)}
                  />
                </Field>
                <Button
                  type="submit"
                  variant="primary"
                  loading={resetSending}
                  className="w-full"
                >
                  {resetSending ? "Sending link…" : "Send sign-in link"}
                </Button>
              </form>
              <button
                type="button"
                onClick={() => setView("signin")}
                className="mt-4 flex items-center gap-1 text-[12px] text-ink-mute transition-colors duration-150 hover:text-ink"
              >
                <Icon name="chevron-left" size={12} />
                Back to sign in
              </button>
            </motion.div>
          )}

          {view === "sent" && (
            <motion.div
              key="sent"
              variants={subViewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center py-4 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-inset">
                <Icon name="mail" size={20} className="text-accent" />
              </span>
              <h1 className="mt-4 font-display text-[18px] font-medium tracking-tight text-ink">
                Check your inbox
              </h1>
              <p className="mt-1.5 max-w-[280px] text-[12.5px] leading-relaxed text-ink-mute">
                We sent a sign-in link to{" "}
                <span className="font-medium text-ink">{resetEmail}</span>. The link is
                valid for 15 minutes.
              </p>
              <Button
                variant="secondary"
                className="mt-5"
                onClick={() => setView("signin")}
              >
                Back to sign in
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthSplit>
    </PageTransition>
  );
}
