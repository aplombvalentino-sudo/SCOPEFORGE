"use client";

/* ================================================================
   Marketing chrome: top nav, footer, and the book-a-demo modal.
   Use <DemoCta> anywhere in marketing pages to open the modal.
   ================================================================ */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cx } from "@/lib/format";
import { Button } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { Modal } from "@/components/ui/overlays";
import { Icon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/theme";
import { Wordmark } from "./app-shell";

const DemoModalContext = createContext<{ openDemo: () => void }>({ openDemo: () => {} });

export function useDemoModal() {
  return useContext(DemoModalContext);
}

/** CTA button that opens the demo modal. */
export function DemoCta({
  children = "Book a demo",
  variant = "primary",
  size = "md",
  className,
}: {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
}) {
  const { openDemo } = useDemoModal();
  return (
    <Button variant={variant} size={size} className={className} onClick={openDemo}>
      {children}
    </Button>
  );
}

function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setTimeout(() => setSent(false), 300);
      }}
      title={sent ? "Request received" : "Book a 25-minute demo"}
      width={480}
    >
      {sent ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ok-soft">
            <Icon name="check" size={22} className="text-ok" strokeWidth={2.2} />
          </span>
          <p className="mt-4 text-[14px] font-medium">We&apos;ll be in touch within one business day.</p>
          <p className="mt-1.5 max-w-xs text-[13px] text-ink-mute">
            You&apos;ll get a calendar link and a sandbox workspace pre-loaded with your service types.
          </p>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" htmlFor="demo-name">
              <Input id="demo-name" required placeholder="Jane Calder" />
            </Field>
            <Field label="Work email" htmlFor="demo-email">
              <Input id="demo-email" type="email" required placeholder="jane@agency.com" />
            </Field>
          </div>
          <Field label="Agency size" htmlFor="demo-size">
            <Select id="demo-size" defaultValue="3-10">
              <option value="solo">Just me</option>
              <option value="3-10">3–10 people</option>
              <option value="11-25">11–25 people</option>
              <option value="26+">26+ people</option>
            </Select>
          </Field>
          <Field
            label="What does quoting look like today?"
            htmlFor="demo-notes"
            hint="Optional — helps us tailor the walkthrough."
          >
            <Textarea id="demo-notes" placeholder="Google Docs proposals, pricing from memory, follow-ups when we remember…" />
          </Field>
          <Button type="submit" variant="primary" className="w-full">
            Request demo
          </Button>
        </form>
      )}
    </Modal>
  );
}

/* ---------- Nav ---------- */

const marketingLinks = [
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
];

function MarketingNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="SCOPEFORGE home">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Marketing">
            {marketingLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
                  pathname === l.href
                    ? "text-ink"
                    : "text-ink-mute hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-ink-mute transition-colors hover:text-ink sm:block"
          >
            Log in
          </Link>
          <DemoCta size="sm">Book a demo</DemoCta>
        </div>
      </div>
    </header>
  );
}

/* ---------- Footer ---------- */

function MarketingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-mute">
            The quote-to-scope operating system for agencies and service businesses.
          </p>
          <p className="microlabel mt-6">© 2026 Scopeforge ApS — Copenhagen</p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { label: "Overview", href: "/product" },
            { label: "Pricing", href: "/pricing" },
            { label: "Live app demo", href: "/dashboard" },
          ]}
        />
        <FooterCol
          title="Workflows"
          links={[
            { label: "Intake to brief", href: "/product#intake" },
            { label: "Scope control", href: "/product#scope" },
            { label: "Proposal studio", href: "/product#proposals" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: "Log in", href: "/login" },
            { label: "Create workspace", href: "/signup" },
            { label: "Help & docs", href: "/help" },
          ]}
        />
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="microlabel mb-3">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[13px] text-ink-mute transition-colors duration-150 hover:text-ink"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Shell ---------- */

export function MarketingShell({ children }: { children: ReactNode }) {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <DemoModalContext.Provider value={{ openDemo: () => setDemoOpen(true) }}>
      <div className="flex min-h-dvh flex-col bg-bg">
        <MarketingNav />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
        <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
      </div>
    </DemoModalContext.Provider>
  );
}
