/* ================================================================
   Help article content — docs-lite, product-true. Plain data so the
   page can search across titles, paragraphs, and steps.
   ================================================================ */

import type { IconName } from "@/components/ui/icons";

export interface HelpStep {
  text: string;
  href: string;
}

export interface HelpShortcut {
  keys: string[];
  label: string;
}

export interface HelpArticle {
  id: string;
  icon: IconName;
  title: string;
  paragraphs: string[];
  steps?: HelpStep[];
  closing?: string;
  shortcuts?: HelpShortcut[];
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "start-here",
    icon: "zap",
    title: "Start here: from inbox to proposal in one sitting",
    paragraphs: [
      "The whole product is one path: raw intake in, signed scope out. Everything else — templates, guardrails, follow-ups — exists to make that path repeatable. Here it is end to end.",
    ],
    steps: [
      {
        text: "Paste the raw intake — a founder email, a 47-minute discovery transcript, Loom notes — into a new lead. Intake analysis drafts goals, risks, budget clues, and the clarifying questions you'd forget to ask.",
        href: "/leads",
      },
      {
        text: "Confirm the brief. Answer the open questions inline; the brief flips to confirmed when nothing blocking remains. Unanswered questions block scoping on purpose.",
        href: "/briefs",
      },
      {
        text: "Build the scope: deliverables with effort, explicit exclusions, a named revision line. This is the contract before the contract.",
        href: "/scopes",
      },
      {
        text: "Price in three tiers from the scope's pricing tab. The margin floor warns before you quote below it — not after the project loses money.",
        href: "/scopes",
      },
      {
        text: "Assemble and send the proposal. Sending arms the follow-up sequence automatically on your cadence — no calendar reminders, no forgotten deals.",
        href: "/proposals",
      },
    ],
    closing:
      "Atelier North's median turnaround on this path is 2.1 days against an industry median of 6.5 — and the fast quote usually wins, because it arrives while the problem is still loud.",
  },
  {
    id: "intake-analysis",
    icon: "sparkle",
    title: "How intake analysis works (and what it never does)",
    paragraphs: [
      "Paste anything a prospect gives you. The analysis extracts goals, budget and timeline clues, risks, and — most usefully — the information that's missing, with a confidence score so you know how much weight to put on it.",
      "It drafts; it never decides. Every extracted goal is editable, every suggested question is optional, and nothing reaches a client without you pressing send. Treat the output like a strong first pass from a sharp junior: review it, fix it, own it.",
      "The missing-info list deserves special attention. It tells you what to ask before you scope, which is dramatically cheaper than discovering the gap after you've quoted. 'No budget signal detected' has saved more margin than any pricing tactic in the product.",
    ],
  },
  {
    id: "scope-guardrails",
    icon: "shield",
    title: "Scope guardrails: exclusions, revisions, change orders",
    paragraphs: [
      "Every scope carries three guardrails: explicit exclusions ('copywriting', 'photography', 'paid media'), a named revision-round count, and acceptance criteria. They're tedious to write once and priceless in week six, when memory becomes negotiation.",
      "When a client request lands outside scope, the change-order engine classifies it — in scope, borderline, out of scope — cites the exact scope line, and drafts a polite reply with a pre-priced path forward. This year Atelier North caught 11 creep requests that way and recovered €14,750 that would otherwise have been free work.",
      "Borderline calls are flagged, never auto-sent. The judgement stays yours; only the paperwork is automated.",
    ],
  },
  {
    id: "margin-floor",
    icon: "target",
    title: "Pricing with a margin floor",
    paragraphs: [
      "Set the floor once in Settings → Margin rules (Atelier North runs 35%). Every pricing builder then warns when a tier dips below it. The warning fires while you're still drafting — before the number is in front of a client and impossible to raise.",
      "Three-tier pricing is the default because anchoring works: Lean makes Standard look sensible, Premium makes it look cheap. Margin guidance annotates each tier with what it actually earns after estimated internal cost, not just what it bills.",
      "The floor is a warning, not a lock. You can price below it for a strategic logo or a foot in the door — the point is that you do it on purpose, with the real margin in front of you.",
    ],
  },
  {
    id: "proposals-followup",
    icon: "send",
    title: "Sending proposals & follow-up automation",
    paragraphs: [
      "Proposals assemble from scope plus pricing, section by section. Toggle sections off for a concise read, reorder them, set a validity date — expiry is visible to the client too, which is its own gentle pressure.",
      "Sending arms a follow-up sequence on your cadence (default +3d, +7d, +14d). Drafts reference something concrete from the proposal — a deliverable, a risk you flagged, the timeline driver — never 'just checking in'. You review and approve every send.",
      "View tracking shows when a client opens the document and where they linger. Four views of the pricing section with six minutes of dwell is a buying signal, not a coincidence. Call them.",
    ],
  },
  {
    id: "onboarding-flows",
    icon: "onboarding",
    title: "Onboarding flows",
    paragraphs: [
      "The day a proposal is accepted, an onboarding flow spins up from your template: kickoff agenda, access checklist, asset requests, and a 14-day plan the client can actually see.",
      "Tasks are grouped — kickoff, access, assets, internal, client — and client-side tasks are visible to the client, which is precisely why they get done. Chasing a price book by email is a chore; a shared checklist with their name on it is accountability.",
      "Stalled tasks surface on the dashboard before they become a kickoff-day surprise. The week-one impression is the cheapest retention you will ever buy.",
    ],
  },
  {
    id: "shortcuts",
    icon: "command",
    title: "Keyboard shortcuts",
    paragraphs: [
      "The command palette is the fastest way around — every record, page, and action is reachable from one box. The rest are for the moments your hands are already on the keys.",
    ],
    shortcuts: [
      { keys: ["⌘", "K"], label: "Command palette — jump or create anything" },
      { keys: ["Esc"], label: "Close drawer, modal, or menu" },
      { keys: ["G", "D"], label: "Go to dashboard" },
      { keys: ["G", "L"], label: "Go to leads" },
      { keys: ["G", "P"], label: "Go to proposals" },
      { keys: ["N"], label: "New lead (from the leads page)" },
      { keys: ["⌘", "↵"], label: "Save & close in any editor" },
      { keys: ["?"], label: "Open this help page" },
    ],
  },
];
