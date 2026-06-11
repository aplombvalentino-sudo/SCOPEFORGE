/* ================================================================
   SCOPEFORGE demo dataset
   The demo workspace is "Atelier North", a 14-person digital
   agency in Copenhagen. All dates are relative to DEMO_NOW
   (2026-06-10) so the app always renders a live-feeling state.
   ================================================================ */

import { daysFromNow } from "./format";
import type {
  ActivityEvent,
  AppNotification,
  Brief,
  ChangeOrder,
  FollowUp,
  Lead,
  OnboardingFlow,
  PricingModel,
  Proposal,
  ScopeDoc,
  ServiceBlueprint,
  TeamMember,
  Template,
  Workspace,
} from "./types";

/* ---------------- workspace & team ---------------- */

export const workspace: Workspace = {
  name: "Atelier North",
  plan: "Agency",
  seats: 14,
  brandColor: "#2EC79E",
  domain: "ateliernorth.dk",
};

export const team: TeamMember[] = [
  { id: "tm-maya", name: "Maya Lindqvist", role: "Founder & Managing Director", email: "maya@ateliernorth.dk", initials: "ML", seatStatus: "active" },
  { id: "tm-jonas", name: "Jonas Reuter", role: "Strategy Director", email: "jonas@ateliernorth.dk", initials: "JR", seatStatus: "active" },
  { id: "tm-priya", name: "Priya Shah", role: "Delivery Lead", email: "priya@ateliernorth.dk", initials: "PS", seatStatus: "active" },
  { id: "tm-tom", name: "Tom Okafor", role: "Design Lead", email: "tom@ateliernorth.dk", initials: "TO", seatStatus: "active" },
  { id: "tm-elise", name: "Elise Fontaine", role: "Account Manager", email: "elise@ateliernorth.dk", initials: "EF", seatStatus: "active" },
  { id: "tm-lukas", name: "Lukas Berg", role: "Growth Lead", email: "lukas@ateliernorth.dk", initials: "LB", seatStatus: "invited" },
];

/* ---------------- leads ---------------- */

export const leads: Lead[] = [
  {
    id: "ld-vey",
    company: "Maison Vey",
    contact: { name: "Camille Aubert", role: "Head of Digital", email: "c.aubert@maisonvey.fr" },
    source: "meeting_transcript",
    projectType: "Website redesign + ecommerce",
    summary: "Full redesign of maisonvey.fr ahead of the September collection launch, including a re-platformed ecommerce experience.",
    value: 38400,
    stage: "scoping",
    risk: "medium",
    riskNote: "Hard deadline (Sept 2 collection launch) leaves no slack for content delays. Client copywriting is a known bottleneck.",
    tags: ["website", "ecommerce", "premium"],
    ownerId: "tm-jonas",
    createdAt: daysFromNow(-9),
    lastActivityAt: daysFromNow(-1),
    briefId: "br-vey",
    scopeId: "sc-vey",
    rawIntake: `[Discovery call — 1 Jun 2026, 47 min, attendees: Camille Aubert, Théo Marchand (Maison Vey), Jonas, Elise (Atelier North)]

Camille: The current site was built in 2021 and it reads like a catalogue, not a maison. We relaunch the brand identity in September with the new collection — the site has to follow. Two things matter: editorial storytelling and a checkout that doesn't feel like a template.

Théo: Commerce runs on a heavily customised WooCommerce build. Honestly nobody internally wants to keep it. We're open to re-platforming if migration is safe — we have around 1,400 SKUs and a loyal client list we cannot lose.

Camille: Budget — we've set aside something in the range of 35 to 45 thousand for the digital side. The lookbook shoots are separate.

Jonas: Timeline driver is the Sept 2 launch event?

Camille: Yes, non-negotiable, press is booked. Ideally the site is live a week before. Internal sign-off goes through me, final word from our MD Hélène Vey, who is... particular about typography.

Théo: One more thing — our copy team is small. Last agency waited six weeks on us for product copy. Plan around that.`,
    intakeAnalysis: {
      summary: "Premium fashion house needs a full site redesign with safe re-platforming of a 1,400-SKU WooCommerce store, live one week before a fixed Sept 2 collection launch. Editorial quality and typography scrutiny are explicit; client-side copywriting capacity is a known bottleneck.",
      goals: [
        "Reposition the site from catalogue to editorial brand experience",
        "Re-platform ecommerce without losing 1,400 SKUs or the customer list",
        "Go live ~Aug 26, one week before the Sept 2 press launch",
      ],
      missingInfo: [
        "Target platform preference (Shopify vs headless) and integration constraints",
        "Analytics access and current conversion baseline",
        "Whether translations (FR/EN) are in scope",
      ],
      risks: [
        "Fixed launch date with zero slack — schedule risk is structural",
        "Client copy team historically 6 weeks late on product copy",
        "MD Hélène Vey is final approver but not in the loop yet — late-stage taste revisions likely",
      ],
      timelineClues: ["Live ~1 week before Sept 2 → effective deadline Aug 26", "~12 working weeks from brief confirmation"],
      budgetClues: ["€35–45k stated for digital scope, photography excluded"],
      suggestedQuestions: [
        "Can Hélène Vey join the typography/art-direction review at week 3 rather than at the end?",
        "Is a phased launch acceptable (brand site Aug 26, full catalogue Sept 9) if copy slips?",
        "Do you have a platform preference, or should we recommend one as a paid discovery output?",
      ],
      confidence: 78,
    },
    notes: "Hélène Vey (MD) must see type direction early. Théo is the technical ally — keep him close on migration planning.",
  },
  {
    id: "ld-northgate",
    company: "Northgate Dental Group",
    contact: { name: "Daniel Whitford", role: "Marketing Director", email: "d.whitford@northgatedental.co.uk" },
    source: "referral",
    projectType: "SEO retainer",
    summary: "12-location dental group losing local search ground to PE-backed competitors. Wants a 12-month local SEO programme.",
    value: 42000,
    stage: "proposal_sent",
    risk: "low",
    tags: ["seo", "retainer", "healthcare"],
    ownerId: "tm-lukas",
    createdAt: daysFromNow(-21),
    lastActivityAt: daysFromNow(-3),
    briefId: "br-northgate",
    scopeId: "sc-northgate",
    proposalId: "pp-northgate",
    notes: "Referred by Meridian Legal. Daniel has board approval up to £3.5k/mo; anything above needs CFO sign-off.",
  },
  {
    id: "ld-harborfern",
    company: "Harbor & Fern",
    contact: { name: "Sofie Brandt", role: "Founder", email: "sofie@harborfern.com" },
    source: "email",
    projectType: "Paid media + funnel optimization",
    summary: "DTC home-goods brand with rising CAC. Wants paid account restructure and funnel work before Q4.",
    value: 14500,
    stage: "intake",
    risk: "medium",
    riskNote: "Budget expectation unclear — mentions 'a few thousand a month' which may not cover media + fee.",
    tags: ["paid-media", "ecommerce", "inbound"],
    ownerId: "tm-elise",
    createdAt: daysFromNow(0, 7),
    lastActivityAt: daysFromNow(0, 7),
    rawIntake: `From: Sofie Brandt <sofie@harborfern.com>
To: hello@ateliernorth.dk
Subject: Paid ads help — running out of runway on Meta

Hi — I got your name from Anna at Veldt Cycles.

We're Harbor & Fern, we sell Scandinavian home goods online (harborfern.com), shipping across the EU. Revenue is around €1.1M/yr, 70% from Meta ads, and our CAC has nearly doubled since January (€31 → €58). Our agency before just kept raising budgets.

What I think we need (but tell me if I'm wrong):
- someone to rebuild the ad account properly — it's a mess of 40+ ad sets
- landing pages that actually match the ads (we send everything to collection pages)
- email capture is basically nonexistent

We're prepping for Q4 and honestly if CAC stays where it is, Black Friday won't be profitable. We can spend a few thousand a month on this if the numbers make sense.

Could we talk this week? I'm traveling Thu–Fri.

Sofie`,
    notes: "Referral from Veldt Cycles (Anna Puig). Respond same-day — founder-led, fast decision cycle likely.",
  },
  {
    id: "ld-aurelia",
    company: "Aurelia Hospitality Group",
    contact: { name: "Marco Teixeira", role: "Brand Director", email: "m.teixeira@aureliagroup.pt" },
    source: "website_form",
    projectType: "Brand identity package",
    summary: "Boutique hotel group launching a three-property 'Aurelia Casas' line. Needs naming refinement, identity system, and guidelines.",
    value: 24000,
    stage: "brief",
    risk: "medium",
    riskNote: "Three stakeholders with veto power and no agreed decision process. Two open clarification questions block scope.",
    tags: ["branding", "hospitality"],
    ownerId: "tm-tom",
    createdAt: daysFromNow(-6),
    lastActivityAt: daysFromNow(-2),
    briefId: "br-aurelia",
    notes: "Marco is championing us internally. CEO and the F&B director both want sign-off. Get the decision process agreed before scoping.",
  },
  {
    id: "ld-stratus",
    company: "Stratus HVAC Services",
    contact: { name: "Pieter Vandenberg", role: "Operations Manager", email: "p.vandenberg@stratushvac.nl" },
    source: "call_notes",
    projectType: "Automation implementation",
    summary: "Quote-to-dispatch workflow automation: intake forms, quoting templates, job scheduling sync, invoice triggers.",
    value: 9600,
    stage: "won",
    risk: "low",
    tags: ["automation", "operations"],
    ownerId: "tm-priya",
    createdAt: daysFromNow(-34),
    lastActivityAt: daysFromNow(-1),
    briefId: "br-stratus",
    scopeId: "sc-stratus",
    proposalId: "pp-stratus",
    onboardingId: "ob-stratus",
    notes: "Signed 28 May. Deposit received. Kickoff held 4 Jun — onboarding in progress.",
  },
  {
    id: "ld-veldt",
    company: "Veldt Cycles",
    contact: { name: "Anna Puig", role: "CMO", email: "anna@veldtcycles.cc" },
    source: "meeting_transcript",
    projectType: "Website + product configurator",
    summary: "DTC bicycle brand wants a new site with a built-to-order configurator. Strong brand, strong opinions, soft budget.",
    value: 31000,
    stage: "negotiation",
    risk: "high",
    riskNote: "Two 'while you're at it' additions during the last call (dealer locator, Strava integration). Anchor budget €24k is below our floor for this scope. Creep pattern pre-contract.",
    tags: ["website", "ecommerce", "configurator"],
    ownerId: "tm-jonas",
    createdAt: daysFromNow(-18),
    lastActivityAt: daysFromNow(-2),
    proposalId: "pp-veldt",
    notes: "Negotiation call Thu. Hold the line: configurator phase 2 or premium tier. Anna responds well to written trade-off summaries.",
  },
  {
    id: "ld-calder",
    company: "Calder & Mott",
    contact: { name: "Susan Mott", role: "Managing Partner", email: "s.mott@caldermott.co.uk" },
    source: "pdf_brief",
    projectType: "Rebrand + website",
    summary: "Accounting partnership rebranding after merger; needs identity refresh and a credible, fast marketing site.",
    value: 21500,
    stage: "proposal_draft",
    risk: "low",
    tags: ["branding", "website", "professional-services"],
    ownerId: "tm-tom",
    createdAt: daysFromNow(-12),
    lastActivityAt: daysFromNow(0, 8),
    briefId: "br-calder",
    proposalId: "pp-calder",
    notes: "Conservative buyers — proposal tone should be measured, no growth-hacking language. Decision by end of June.",
  },
  {
    id: "ld-pellervo",
    company: "Pellervo Furniture",
    contact: { name: "Janne Koskinen", role: "Ecommerce Manager", email: "janne.koskinen@pellervo.fi" },
    source: "website_form",
    projectType: "Webshop migration",
    summary: "Magento 1 to Shopify migration, 3,200 SKUs. Lost to a cheaper offshore vendor on price.",
    value: 18000,
    stage: "lost",
    risk: "low",
    tags: ["ecommerce", "migration"],
    ownerId: "tm-elise",
    createdAt: daysFromNow(-41),
    lastActivityAt: daysFromNow(-13),
    proposalId: "pp-pellervo",
    notes: "Lost on price (vendor quoted 40% less). Janne hinted the board may revisit if the migration goes badly — check in come October.",
  },
  {
    id: "ld-roastery",
    company: "Roastery Nord",
    contact: { name: "Ida Sørensen", role: "Owner", email: "ida@roasterynord.dk" },
    source: "referral",
    projectType: "Website + subscriptions",
    summary: "Specialty coffee roaster — site rebuild with subscription commerce. Delivered April 2026; occasional change requests.",
    value: 16800,
    stage: "won",
    risk: "low",
    tags: ["website", "ecommerce", "subscriptions"],
    ownerId: "tm-priya",
    createdAt: daysFromNow(-120),
    lastActivityAt: daysFromNow(-4),
    proposalId: "pp-roastery",
    onboardingId: "ob-roastery",
    notes: "Live since 14 Apr. In 60-day support window until 13 Jun — route requests through change-order review.",
  },
  {
    id: "ld-meridian",
    company: "Meridian Legal",
    contact: { name: "Grace Adeyemi", role: "Practice Director", email: "g.adeyemi@meridianlegal.co.uk" },
    source: "referral",
    projectType: "SEO + content retainer",
    summary: "Employment law firm, 9 months into a content-led SEO retainer. Renewal conversation due in July.",
    value: 28800,
    stage: "won",
    risk: "low",
    tags: ["seo", "retainer", "legal"],
    ownerId: "tm-lukas",
    createdAt: daysFromNow(-280),
    lastActivityAt: daysFromNow(-7),
    notes: "Retainer renews 31 Jul. Organic leads up 64% YoY — build the renewal case deck from the QBR data.",
  },
];

/* ---------------- briefs ---------------- */

export const briefs: Brief[] = [
  {
    id: "br-vey",
    leadId: "ld-vey",
    status: "confirmed",
    clientContext:
      "Maison Vey is an independent French fashion house (est. 1987, ~€6M revenue) relaunching its brand identity alongside the September 2026 collection. The current WooCommerce site (2021) is perceived internally as 'a catalogue, not a maison' and the commerce stack is unmaintained.",
    projectGoal:
      "Relaunch maisonvey.fr as an editorial brand experience with re-platformed commerce, live by 26 Aug 2026 — one week ahead of the Sept 2 press launch.",
    successMetrics: [
      "Site live and stable by 26 Aug 2026",
      "Checkout conversion ≥ 1.8% within 60 days (current: 1.1%)",
      "Zero loss of customer accounts or order history in migration",
      "Editorial pages achieve ≥ 2:30 avg. engaged time",
    ],
    deliverablesSummary:
      "Discovery & platform recommendation, design system + 8 core templates, editorial lookbook module, Shopify build & 1,400-SKU migration, launch support.",
    constraints: [
      "Hard launch date: 2 Sept (press event booked) — site live 26 Aug",
      "Client copy team is small and historically slow (6-week delays on product copy)",
      "Final visual approval rests with MD Hélène Vey",
      "Photography handled separately by client's agency",
    ],
    stakeholders: [
      { name: "Camille Aubert", role: "Head of Digital — day-to-day owner", influence: "decision" },
      { name: "Hélène Vey", role: "Managing Director — final visual sign-off", influence: "decision" },
      { name: "Théo Marchand", role: "Ecommerce lead — technical counterpart", influence: "input" },
    ],
    dependencies: [
      "Product copy delivered by client by week 6",
      "New brand identity assets from Studio Hervé by week 2",
      "Shopify Plus contract signed by client by week 3",
    ],
    budgetNote: "€35–45k stated verbally. Positioned at €38.4k (Standard tier) with premium option at €46k.",
    timelineNote: "11 working weeks from brief confirmation (8 Jun) to launch-ready (21 Aug), 1 week buffer to the 26 Aug go-live.",
    openQuestions: [
      { id: "q-vey-1", question: "Are FR/EN translations in scope or client-provided?", answered: true, answer: "Client provides FR; we handle EN adaptation for templates only (not product copy)." },
      { id: "q-vey-2", question: "Can Hélène Vey review type direction at week 3?", answered: true, answer: "Yes — booked 24 Jun, 60-minute art-direction review." },
    ],
    updatedAt: daysFromNow(-2),
  },
  {
    id: "br-northgate",
    leadId: "ld-northgate",
    status: "confirmed",
    clientContext:
      "Northgate Dental Group operates 12 clinics across Greater Manchester. Two PE-backed consolidators entered the market in 2025 and now outrank Northgate for 'dentist near me' queries in 8 of 12 catchments.",
    projectGoal:
      "Recover and defend local search leadership across all 12 locations within 12 months, measured by map-pack presence and booked-appointment attribution.",
    successMetrics: [
      "Map-pack top-3 presence in 10 of 12 catchments by month 9",
      "+25% organic booking requests by month 12",
      "Location pages outrank both consolidator brands for priority terms",
    ],
    deliverablesSummary:
      "Technical audit & fixes, 12 location-page rebuilds, review-generation system, monthly content programme (4 pieces), local citations cleanup, monthly reporting with attribution.",
    constraints: [
      "CQC/medical advertising compliance — all content through clinical review",
      "Site is on a proprietary healthcare CMS with limited dev access (2-week change windows)",
      "Budget ceiling £3.5k/mo without CFO sign-off",
    ],
    stakeholders: [
      { name: "Daniel Whitford", role: "Marketing Director — owner", influence: "decision" },
      { name: "Dr. Amrita Singh", role: "Clinical Director — content compliance", influence: "input" },
    ],
    dependencies: ["CMS vendor cooperation on technical fixes", "Clinic managers supplying review-request workflows"],
    budgetNote: "£3.3k/mo proposed (≈ €3.85k), 12-month term, quarterly exit clause after month 6.",
    timelineNote: "Months 1–2 technical + locations, months 3–12 content & authority programme.",
    openQuestions: [
      { id: "q-ng-1", question: "Does the CMS vendor allow schema markup injection?", answered: true, answer: "Yes via their 'custom head' module — confirmed 26 May." },
    ],
    updatedAt: daysFromNow(-8),
  },
  {
    id: "br-aurelia",
    leadId: "ld-aurelia",
    status: "needs_clarification",
    clientContext:
      "Aurelia Hospitality Group runs four boutique hotels in Portugal. They are launching 'Aurelia Casas' — a three-property line of self-catered guesthouses — in spring 2027 and need an identity that relates to, but is distinct from, the mother brand.",
    projectGoal:
      "Create the Aurelia Casas identity system: naming refinement, visual identity, voice, and application guidelines ready for the property-opening campaign.",
    successMetrics: [
      "Identity approved by all three stakeholders in ≤ 2 revision rounds",
      "Guidelines adopted by interior and signage vendors without rework",
      "Launch campaign assets produced from the system without agency dependency",
    ],
    deliverablesSummary:
      "Brand strategy workshop, naming refinement, identity system (logo, type, colour, art direction), voice & messaging, 60-page guidelines, application templates.",
    constraints: [
      "Interior design concept (external studio) lands mid-July — identity must not contradict it",
      "Trilingual application (PT/EN/FR)",
      "Signage vendor needs final files by November for fabrication",
    ],
    stakeholders: [
      { name: "Marco Teixeira", role: "Brand Director — project champion", influence: "decision" },
      { name: "Beatriz Aurelia", role: "CEO — final approval", influence: "decision" },
      { name: "Nuno Cardoso", role: "F&B Director — claims veto on naming", influence: "decision" },
    ],
    dependencies: ["Interior design concept delivery (mid-July)", "Agreed decision process among the three approvers"],
    budgetNote: "€24k positioned. Marco signalled €20–28k acceptable if process risk is controlled.",
    timelineNote: "10 weeks from kickoff; naming sprint first to clear the Nuno veto early.",
    openQuestions: [
      { id: "q-au-1", question: "Who arbitrates if the three approvers disagree — is Beatriz's decision final and binding?", answered: false },
      { id: "q-au-2", question: "Is 'Aurelia Casas' locked as the name, or is naming genuinely open?", answered: false },
    ],
    updatedAt: daysFromNow(-2),
  },
  {
    id: "br-calder",
    leadId: "ld-calder",
    status: "draft",
    clientContext:
      "Calder & Mott formed from the 2025 merger of two regional accounting practices (41 staff, Leeds + York). The merged firm inherited two dated identities and two websites; neither reflects the combined firm's advisory ambitions.",
    projectGoal:
      "Unify the merged practice under one credible identity and a fast, lead-generating marketing site before the autumn tax-planning season.",
    successMetrics: [
      "Single brand live across site, templates, and signage by 15 Sept",
      "Site Core Web Vitals all green; loads < 1.5s on 4G",
      "Advisory service pages generating ≥ 12 qualified enquiries/month by Nov",
    ],
    deliverablesSummary:
      "Brand consolidation (not full rebrand), messaging hierarchy, 12-page marketing site, enquiry routing, document templates.",
    constraints: [
      "Partners' committee meets fortnightly — approvals must fit that cadence",
      "Regulatory wording requirements (ICAEW) on service claims",
      "Both legacy domains must redirect cleanly with no SEO loss",
    ],
    stakeholders: [
      { name: "Susan Mott", role: "Managing Partner — sponsor", influence: "decision" },
      { name: "Richard Calder", role: "Senior Partner — emeritus voice", influence: "input" },
      { name: "Partners' committee", role: "Sign-off body (7 partners)", influence: "decision" },
    ],
    dependencies: ["Brand name confirmed as 'Calder & Mott' (done)", "Partner headshot photography (client-arranged)"],
    budgetNote: "€21.5k positioned, aligned to their stated 'around twenty thousand' envelope.",
    timelineNote: "9 weeks; identity weeks 1–3, site weeks 3–8, cutover week 9.",
    openQuestions: [
      { id: "q-cm-1", question: "Will the partners' committee delegate interim approvals to Susan?", answered: false },
    ],
    updatedAt: daysFromNow(0, 8),
  },
  {
    id: "br-stratus",
    leadId: "ld-stratus",
    status: "confirmed",
    clientContext:
      "Stratus HVAC runs 11 field engineers across Rotterdam. Quoting happens in spreadsheets, dispatch in a shared calendar, invoicing in Moneybird — three disconnected systems with manual re-entry at every step.",
    projectGoal:
      "Automate the quote-to-dispatch-to-invoice chain so a service request becomes a scheduled, invoiceable job without manual re-entry.",
    successMetrics: [
      "Quote turnaround < 4 business hours (current: 1.5 days)",
      "Zero duplicate data entry between quoting, scheduling, invoicing",
      "Invoice sent within 24h of job completion for 95% of jobs",
    ],
    deliverablesSummary:
      "Intake form + triage, quoting templates with price book, calendar/dispatch sync, Moneybird invoice triggers, team training.",
    constraints: ["Engineers are non-technical — UI must be phone-first", "Moneybird is fixed (accountant requirement)"],
    stakeholders: [
      { name: "Pieter Vandenberg", role: "Operations Manager — owner", influence: "decision" },
      { name: "Mark de Vries", role: "Owner — budget holder", influence: "decision" },
    ],
    dependencies: ["Price book finalised by client (received 30 May)", "Moneybird API access (received)"],
    budgetNote: "€9.6k fixed. Standard tier accepted without negotiation.",
    timelineNote: "5 weeks build + 1 week parallel-run, go-live 13 Jul.",
    openQuestions: [],
    updatedAt: daysFromNow(-10),
  },
];

/* ---------------- scopes ---------------- */

export const scopes: ScopeDoc[] = [
  {
    id: "sc-vey",
    leadId: "ld-vey",
    status: "in_review",
    deliverables: [
      { id: "dl-vey-1", title: "Discovery & platform recommendation", description: "Stakeholder interviews, analytics review, platform scorecard (Shopify Plus vs headless), migration risk assessment. Output: recommendation memo Hélène can sign.", effortDays: 4, tiers: ["lean", "standard", "premium"] },
      { id: "dl-vey-2", title: "Design system & art direction", description: "Typography-first design system honouring the Studio Hervé identity; reviewed with MD at week 3 checkpoint.", effortDays: 6, tiers: ["lean", "standard", "premium"] },
      { id: "dl-vey-3", title: "Core templates (8)", description: "Home, collection, product, editorial article, lookbook, about/maison, contact, cart/checkout skin.", effortDays: 10, tiers: ["lean", "standard", "premium"] },
      { id: "dl-vey-4", title: "Editorial lookbook module", description: "CMS-driven longform layouts: full-bleed imagery, scroll-linked reveals, credits. Built for the Sept collection story.", effortDays: 5, tiers: ["standard", "premium"] },
      { id: "dl-vey-5", title: "Shopify build & theme development", description: "Custom theme from the design system, no off-the-shelf template. Performance budget: LCP < 1.8s.", effortDays: 12, tiers: ["lean", "standard", "premium"] },
      { id: "dl-vey-6", title: "Catalogue & customer migration (1,400 SKUs)", description: "Scripted WooCommerce → Shopify migration with dry run, checksum validation, and account-preservation plan.", effortDays: 6, tiers: ["lean", "standard", "premium"] },
      { id: "dl-vey-7", title: "Launch support & training", description: "Go-live runbook, 2 training sessions for the digital team, 2 weeks hypercare.", effortDays: 3, tiers: ["standard", "premium"] },
      { id: "dl-vey-8", title: "Conversion analytics setup", description: "GA4 + server-side events, funnel dashboards, post-launch baseline report at day 30.", effortDays: 3, tiers: ["premium"] },
    ],
    exclusions: [
      "Product photography and retouching (client's photo agency)",
      "Product copywriting in any language (client supplies FR; EN product copy excluded)",
      "Paid media, SEO migration beyond 301 mapping of top-200 URLs",
      "Email marketing templates beyond transactional defaults",
      "Ongoing maintenance after the 2-week hypercare window",
    ],
    assumptions: [
      "Studio Hervé delivers final identity assets by 19 Jun (week 2)",
      "Client signs Shopify Plus agreement directly by week 3",
      "Product copy arrives in batches, final batch no later than week 6 (20 Jul)",
      "One consolidated feedback round per template group, via Camille",
    ],
    revisionRounds: 2,
    milestones: [
      { id: "ms-vey-1", title: "Discovery & platform decision", week: 1, durationWeeks: 2, description: "Interviews, audit, platform memo signed by MD." },
      { id: "ms-vey-2", title: "Art direction approved", week: 3, durationWeeks: 1, description: "Type-first direction review with Hélène Vey — the de-risking checkpoint." },
      { id: "ms-vey-3", title: "Design system & templates", week: 4, durationWeeks: 3, description: "8 core templates designed; one consolidated revision round." },
      { id: "ms-vey-4", title: "Build & migration dry run", week: 6, durationWeeks: 4, description: "Theme build, migration dry run with checksum report at week 9." },
      { id: "ms-vey-5", title: "Content load & QA", week: 9, durationWeeks: 2, description: "Copy in by wk 6 contractually; QA, perf budget, accessibility pass." },
      { id: "ms-vey-6", title: "Launch & hypercare", week: 11, durationWeeks: 1, description: "Go-live 26 Aug, runbook execution, 2-week hypercare." },
    ],
    dependencies: ["Studio Hervé identity assets (wk 2)", "Shopify Plus contract (wk 3)", "Final product copy (wk 6)"],
    acceptanceCriteria: [
      "All 8 templates match approved designs at 1440/768/390 breakpoints",
      "Migration validation: 100% SKU count match, order history spot-check 50 orders, zero lost accounts",
      "LCP < 1.8s on product and home templates (4G, mid-tier device)",
      "WCAG 2.1 AA on all templates",
    ],
    riskFlags: [
      { id: "rf-vey-1", label: "Copy delivery slippage", level: "high", detail: "History of 6-week delays. Mitigation: copy deadline in contract (wk 6) with phased-launch fallback clause." },
      { id: "rf-vey-2", label: "Late MD taste revisions", level: "medium", detail: "Mitigated by week-3 art-direction checkpoint with Hélène — locked before template production." },
      { id: "rf-vey-3", label: "Migration data integrity", level: "medium", detail: "1,400 SKUs with custom meta. Dry run + checksum validation at week 9 before any cutover." },
    ],
    timelineWeeks: 11,
    updatedAt: daysFromNow(-1),
  },
  {
    id: "sc-northgate",
    leadId: "ld-northgate",
    status: "approved",
    deliverables: [
      { id: "dl-ng-1", title: "Technical SEO audit & fix programme", description: "Full crawl, CMS-constraint-aware fix list, prioritised into the vendor's 2-week change windows.", effortDays: 5, tiers: ["lean", "standard", "premium"] },
      { id: "dl-ng-2", title: "12 location page rebuilds", description: "Unique content per catchment, local schema, embedded review streams, booking CTAs.", effortDays: 8, tiers: ["lean", "standard", "premium"] },
      { id: "dl-ng-3", title: "Review generation system", description: "Post-appointment review workflow per clinic, GBP optimisation, response templates with compliance guardrails.", effortDays: 4, tiers: ["standard", "premium"] },
      { id: "dl-ng-4", title: "Monthly content programme", description: "4 clinically-reviewed pieces/month targeting treatment + locality terms.", effortDays: 4, tiers: ["standard", "premium"] },
      { id: "dl-ng-5", title: "Citations & data cleanup", description: "NAP consistency across 40+ directories, duplicate suppression.", effortDays: 3, tiers: ["lean", "standard", "premium"] },
      { id: "dl-ng-6", title: "Attribution reporting", description: "Monthly dashboard: rankings, map-pack share, booking-request attribution by location.", effortDays: 2, tiers: ["standard", "premium"] },
    ],
    exclusions: [
      "Paid search management",
      "CMS platform migration or redesign",
      "Review responses themselves (clinic managers own replies)",
      "PR / digital outreach beyond local citations",
    ],
    assumptions: [
      "CMS vendor honours 2-week change windows",
      "Clinical review turnaround ≤ 5 working days per content batch",
      "GBP ownership transferred to Northgate (currently 3 profiles owned by ex-employee)",
    ],
    revisionRounds: 1,
    milestones: [
      { id: "ms-ng-1", title: "Audit & quick wins", week: 1, durationWeeks: 4, description: "Technical audit, citations cleanup, GBP recovery." },
      { id: "ms-ng-2", title: "Location pages live", week: 5, durationWeeks: 4, description: "All 12 rebuilt pages deployed through CMS windows." },
      { id: "ms-ng-3", title: "Programme cadence", week: 9, durationWeeks: 44, description: "Monthly content + reviews + reporting cycle." },
    ],
    dependencies: ["CMS vendor change windows", "Clinical review SLA", "GBP ownership recovery"],
    acceptanceCriteria: [
      "All technical fixes from audit P0/P1 list deployed by month 2",
      "12 location pages live with valid LocalBusiness schema",
      "Monthly report delivered by the 5th working day",
    ],
    riskFlags: [
      { id: "rf-ng-1", label: "CMS vendor bottleneck", level: "medium", detail: "2-week change windows could stall fixes. Mitigation: batch all changes, escalation contact agreed in contract." },
      { id: "rf-ng-2", label: "GBP ownership recovery", level: "low", detail: "3 profiles owned by ex-employee. Standard Google recovery process started." },
    ],
    timelineWeeks: 52,
    updatedAt: daysFromNow(-9),
  },
  {
    id: "sc-stratus",
    leadId: "ld-stratus",
    status: "approved",
    deliverables: [
      { id: "dl-st-1", title: "Service intake form & triage", description: "Public request form with photo upload, urgency triage rules, automatic customer record matching.", effortDays: 3, tiers: ["lean", "standard", "premium"] },
      { id: "dl-st-2", title: "Quoting engine with price book", description: "Templated quotes from the client price book, mobile approval flow, e-signature.", effortDays: 5, tiers: ["lean", "standard", "premium"] },
      { id: "dl-st-3", title: "Dispatch & calendar sync", description: "Accepted quote auto-creates a job; two-way sync with engineer calendars; phone-first job sheets.", effortDays: 4, tiers: ["standard", "premium"] },
      { id: "dl-st-4", title: "Moneybird invoice triggers", description: "Job completion triggers draft invoice with line items from the quote; review-then-send flow.", effortDays: 3, tiers: ["lean", "standard", "premium"] },
      { id: "dl-st-5", title: "Training & runbook", description: "Two training sessions (office + engineers), Loom library, admin runbook.", effortDays: 2, tiers: ["standard", "premium"] },
    ],
    exclusions: [
      "Changes to Moneybird chart of accounts",
      "Historical data migration (jobs before 1 Jun 2026)",
      "Custom mobile app (phone-first web only)",
      "SMS notifications (available as change order)",
    ],
    assumptions: ["Price book is final (received 30 May)", "Engineers have company phones with modern browsers", "Max 3 quote templates at launch"],
    revisionRounds: 1,
    milestones: [
      { id: "ms-st-1", title: "Intake + quoting live", week: 1, durationWeeks: 3, description: "Form, triage, quoting engine on staging." },
      { id: "ms-st-2", title: "Dispatch + invoicing", week: 3, durationWeeks: 2, description: "Calendar sync and Moneybird triggers wired." },
      { id: "ms-st-3", title: "Parallel run & go-live", week: 5, durationWeeks: 2, description: "One week dual-running, then cutover 13 Jul." },
    ],
    dependencies: ["Moneybird API token (received)", "Engineer calendar access (received)"],
    acceptanceCriteria: [
      "Request → quote in under 10 minutes of office time",
      "Accepted quote creates a correctly-assigned calendar job",
      "Completed job produces a draft invoice with correct line items in Moneybird",
    ],
    riskFlags: [
      { id: "rf-st-1", label: "Engineer adoption", level: "medium", detail: "Field team is non-technical. Mitigation: phone-first design, training session, 2 champions nominated." },
    ],
    timelineWeeks: 6,
    updatedAt: daysFromNow(-12),
  },
];

/* ---------------- pricing ---------------- */

export const pricingModels: PricingModel[] = [
  {
    id: "pm-vey",
    leadId: "ld-vey",
    mode: "project",
    tiers: [
      {
        key: "lean",
        name: "Lean",
        price: 29800,
        cost: 18600,
        summary: "Core redesign + safe migration. No editorial module, launch support reduced to runbook handover.",
        inclusions: ["Discovery & platform memo", "Design system + 8 templates", "Shopify build", "1,400-SKU migration", "1 revision round"],
      },
      {
        key: "standard",
        name: "Standard",
        price: 38400,
        cost: 23100,
        summary: "The recommended scope: editorial lookbook module, launch support with hypercare, 2 revision rounds.",
        inclusions: ["Everything in Lean", "Editorial lookbook module", "Launch support + 2-week hypercare", "2 revision rounds", "Training (2 sessions)"],
        recommended: true,
      },
      {
        key: "premium",
        name: "Premium",
        price: 46200,
        cost: 27400,
        summary: "Adds conversion analytics, day-30 baseline report, and a phased-launch safety net for copy slippage.",
        inclusions: ["Everything in Standard", "GA4 + server-side analytics", "Day-30 conversion baseline report", "Phased-launch contingency plan", "Priority support window"],
      },
    ],
    addOns: [
      { id: "ao-vey-1", name: "EN product copy adaptation (per 100 SKUs)", price: 1400, description: "Editorial EN adaptation of client-supplied FR product copy." },
      { id: "ao-vey-2", name: "Email template suite", price: 2600, description: "6 branded Klaviyo templates matching the new design system." },
    ],
    depositPct: 40,
    schedule: [
      { label: "Deposit", pct: 40, trigger: "On signature" },
      { label: "Design approval", pct: 30, trigger: "Templates approved (wk 6)" },
      { label: "Launch", pct: 30, trigger: "Go-live (wk 11)" },
    ],
    marginGuidance:
      "Standard tier margin 39.8% — above the 35% workspace floor. Lean tier drops to 37.6% with elevated schedule risk; if the client pushes below €29k, remove migration validation rather than discount. Anchor with Premium first.",
    updatedAt: daysFromNow(-1),
  },
  {
    id: "pm-northgate",
    leadId: "ld-northgate",
    mode: "retainer",
    tiers: [
      {
        key: "lean",
        name: "Foundations",
        price: 2400,
        cost: 1520,
        summary: "Technical + locations only. No content programme — rankings recovery will be slower.",
        inclusions: ["Technical fix programme", "12 location pages", "Citations cleanup", "Quarterly reporting"],
      },
      {
        key: "standard",
        name: "Programme",
        price: 3300,
        cost: 1980,
        summary: "The full local programme: content, reviews, monthly attribution reporting. Fits Daniel's approval ceiling.",
        inclusions: ["Everything in Foundations", "4 content pieces/month", "Review generation system", "Monthly attribution dashboard"],
        recommended: true,
      },
      {
        key: "premium",
        name: "Dominance",
        price: 4200,
        cost: 2460,
        summary: "Adds digital PR for authority building and conversion optimisation on booking flows. Requires CFO sign-off.",
        inclusions: ["Everything in Programme", "Quarterly digital PR campaign", "Booking-flow CRO", "Competitor watch alerts"],
      },
    ],
    addOns: [
      { id: "ao-ng-1", name: "New location launch pack", price: 950, description: "Per new clinic: page, GBP setup, citations, launch content." },
    ],
    depositPct: 0,
    schedule: [
      { label: "Monthly retainer", pct: 100, trigger: "1st of month, net 14" },
    ],
    marginGuidance:
      "Programme tier margin 40.0% at £3.3k/mo. Month 1–2 setup load runs ~15h over — recover via the 12-month term, breakeven at month 4. Do not discount the term below 12 months.",
    updatedAt: daysFromNow(-9),
  },
];

/* ---------------- proposals ---------------- */

export const proposals: Proposal[] = [
  {
    id: "pp-northgate",
    leadId: "ld-northgate",
    title: "Local Search Leadership Programme — Northgate Dental Group",
    status: "viewed",
    amount: 39600,
    tierSelected: "standard",
    style: "detailed",
    validUntil: daysFromNow(11),
    sentAt: daysFromNow(-6),
    viewedAt: daysFromNow(-1, 16),
    views: 4,
    updatedAt: daysFromNow(-1),
    sections: [
      {
        id: "ps-ng-1", kind: "executive_summary", title: "Executive summary", enabled: true,
        body: [
          "Northgate's 12 clinics are losing local search visibility to two PE-backed consolidators that entered Greater Manchester in 2025. In 8 of 12 catchments, Northgate no longer appears in the map pack for core 'dentist near me' queries — the single highest-intent moment in the patient journey.",
          "This programme recovers that ground systematically: technical foundations and location pages in months 1–2, then a sustained content, review, and authority programme through month 12. Every month, you see rankings, map-pack share, and — critically — booked appointment requests attributed by location.",
          "The investment is £3,300/month for 12 months with a quarterly exit clause from month 6. Based on your current average patient value, the programme breaks even at 11 additional booked patients per month across the group.",
        ],
      },
      {
        id: "ps-ng-2", kind: "scope_of_work", title: "Scope of work", enabled: true,
        body: [
          "Months 1–2 — Foundations: full technical audit executed through your CMS vendor's change windows; rebuild of all 12 location pages with unique catchment content and LocalBusiness schema; citations cleanup across 40+ directories; recovery of the 3 Google Business Profiles currently owned by a former employee.",
          "Months 3–12 — Programme: 4 clinically-reviewed content pieces per month targeting treatment and locality terms; review generation workflows per clinic with compliant response templates; monthly attribution reporting delivered by the 5th working day.",
        ],
      },
      {
        id: "ps-ng-3", kind: "exclusions", title: "What this programme does not include", enabled: true,
        body: [
          "Paid search management; CMS platform migration or redesign; writing review responses (clinic managers own patient replies, we provide templates); PR beyond local citations. Each can be scoped separately if needed — we will never fold unscoped work into the retainer silently.",
        ],
      },
      {
        id: "ps-ng-4", kind: "timeline", title: "Timeline", enabled: true,
        body: [
          "Weeks 1–4: audit, quick wins, citations, GBP recovery. Weeks 5–8: location pages deployed through CMS change windows. Week 9 onward: monthly programme cadence. First attribution report lands at the end of month 1; rankings movement is typically visible from month 3 in this vertical.",
        ],
      },
      {
        id: "ps-ng-5", kind: "pricing", title: "Investment", enabled: true,
        body: [
          "Programme tier: £3,300/month, 12-month term, invoiced on the 1st, net 14. Quarterly exit clause from month 6. Foundations tier (£2,400/mo, no content programme) and Dominance tier (£4,200/mo, adds digital PR + booking-flow CRO) are detailed in the appendix.",
        ],
      },
      {
        id: "ps-ng-6", kind: "revision_policy", title: "Revisions & change control", enabled: true,
        body: [
          "Each content batch includes one revision round incorporating clinical review feedback. Structural changes to the programme (new locations, new service lines) are handled as written change orders with pricing agreed before work starts — the new-location launch pack is pre-priced at £950 per clinic.",
        ],
      },
      {
        id: "ps-ng-7", kind: "next_steps", title: "Next steps", enabled: true,
        body: [
          "1. 30-minute scope review call — Daniel + Dr. Singh for the clinical review workflow. 2. Signature via the link below. 3. Kickoff within 5 working days: we start with GBP recovery and the technical audit, both independent of the CMS vendor's first change window.",
        ],
      },
    ],
  },
  {
    id: "pp-calder",
    leadId: "ld-calder",
    title: "One Firm, One Voice — Calder & Mott Brand & Web Consolidation",
    status: "draft",
    amount: 21500,
    tierSelected: "standard",
    style: "concise",
    validUntil: daysFromNow(24),
    views: 0,
    updatedAt: daysFromNow(0, 8),
    sections: [
      {
        id: "ps-cm-1", kind: "executive_summary", title: "Executive summary", enabled: true,
        body: [
          "Eighteen months after the merger, Calder & Mott still presents as two firms: two visual identities, two websites, two tones of voice. For a practice selling advisory judgement, that inconsistency has a cost — it shows up in pitch decks, proposals, and the first Google search a prospective client makes.",
          "This engagement consolidates the merged practice into one credible identity and one fast, enquiry-generating site — live before the autumn tax-planning season, approved through your fortnightly partners' committee without process drama.",
        ],
      },
      {
        id: "ps-cm-2", kind: "scope_of_work", title: "Scope of work", enabled: true,
        body: [
          "Weeks 1–3: brand consolidation — unified identity built from the existing Calder & Mott name (not a from-scratch rebrand), messaging hierarchy, ICAEW-compliant service claims. Weeks 3–8: 12-page marketing site with enquiry routing by service line. Week 9: cutover with full redirect mapping from both legacy domains.",
        ],
      },
      {
        id: "ps-cm-3", kind: "deliverables", title: "Deliverables", enabled: true,
        body: [
          "Identity system and usage guide; messaging hierarchy; 12-page site (services, sectors, team, insights, contact); document templates (letterhead, proposal, email signature); redirect map and cutover runbook.",
        ],
      },
      {
        id: "ps-cm-4", kind: "exclusions", title: "Exclusions", enabled: true,
        body: [
          "Photography (partner headshots client-arranged); ongoing content writing after launch; CRM implementation; office signage production (we supply artwork files).",
        ],
      },
      {
        id: "ps-cm-5", kind: "pricing", title: "Investment", enabled: true,
        body: [
          "Fixed fee €21,500: 40% on signature, 30% on identity approval, 30% on launch. Two revision rounds on identity, one consolidated round per site template group. Committee-driven extra rounds available at €850/round, agreed in advance.",
        ],
      },
      {
        id: "ps-cm-6", kind: "next_steps", title: "Next steps", enabled: true,
        body: [
          "Susan reviews with the committee on 18 June. On approval: signature, deposit, and a kickoff aligned to the 25 June committee cycle. Identity concepts land at the 9 July meeting.",
        ],
      },
    ],
  },
  {
    id: "pp-veldt",
    leadId: "ld-veldt",
    title: "Veldt Cycles — Website & Built-to-Order Configurator",
    status: "sent",
    amount: 31000,
    tierSelected: "standard",
    style: "detailed",
    validUntil: daysFromNow(6),
    sentAt: daysFromNow(-8),
    viewedAt: daysFromNow(-2, 11),
    views: 7,
    updatedAt: daysFromNow(-2),
    sections: [
      {
        id: "ps-vc-1", kind: "executive_summary", title: "Executive summary", enabled: true,
        body: [
          "Veldt's bikes are configured, not picked off a shelf — but the current site sells them like SKUs. This project rebuilds veldtcycles.cc around the build-to-order journey: a configurator that makes speccing a frame feel like part of the product, backed by a site that earns the price point.",
          "Scope is deliberately phased. Phase 1 (this proposal, €31,000) ships the site and the configurator for the two core platforms. The dealer locator and Strava integration discussed on our last call are scoped as Phase 2 — pricing included in the appendix — so Phase 1 stays on budget and on time for the spring season.",
        ],
      },
      {
        id: "ps-vc-2", kind: "scope_of_work", title: "Scope of work", enabled: true,
        body: [
          "Design and build of the marketing site (7 templates) and the configurator covering the Strada and Gravia platforms: frame size, groupset tiers, wheelsets, cockpit, paint programme. Configuration output generates a quote request with full spec sheet into your existing flow.",
        ],
      },
      {
        id: "ps-vc-3", kind: "exclusions", title: "Exclusions & phase 2", enabled: true,
        body: [
          "Phase 2 (separately quoted): dealer locator with stock feeds (€4,800), Strava club integration (€2,200), additional bike platforms (€1,900 each). Excluded entirely: 3D renders (client supplies via Keyshot pipeline), inventory system changes, EU VAT consultancy.",
        ],
      },
      {
        id: "ps-vc-4", kind: "timeline", title: "Timeline", enabled: true,
        body: [
          "10 weeks from kickoff. Configurator UX prototype at week 3 — validated with 5 real customers before visual design. Build weeks 5–9, launch week 10. Two revision rounds on design, one on the prototype.",
        ],
      },
      {
        id: "ps-vc-5", kind: "pricing", title: "Investment", enabled: true,
        body: [
          "Fixed fee €31,000: 40% signature / 30% design approval / 30% launch. Phase 2 items can be contracted any time at the quoted prices, valid 90 days post-launch.",
        ],
      },
      {
        id: "ps-vc-6", kind: "next_steps", title: "Next steps", enabled: true,
        body: [
          "Thursday's call: walk the phasing logic and the configurator prototype plan. If the phase split works for Anna, we sign this week and prototype before the holiday break.",
        ],
      },
    ],
  },
  {
    id: "pp-stratus",
    leadId: "ld-stratus",
    title: "Quote-to-Dispatch Automation — Stratus HVAC",
    status: "accepted",
    amount: 9600,
    tierSelected: "standard",
    style: "concise",
    validUntil: daysFromNow(-13),
    sentAt: daysFromNow(-16),
    viewedAt: daysFromNow(-15),
    decidedAt: daysFromNow(-13),
    views: 3,
    updatedAt: daysFromNow(-13),
    sections: [
      {
        id: "ps-st-1", kind: "executive_summary", title: "Executive summary", enabled: true,
        body: [
          "Every Stratus job is re-typed three times: once into a quote spreadsheet, once into the dispatch calendar, once into Moneybird. At 11 engineers and ~70 jobs a week, that is roughly 14 office-hours of duplicate entry — and a 1.5-day quote turnaround that loses urgent work to faster competitors.",
          "This implementation makes a service request flow to a sent invoice without re-entry, cutting quote turnaround to under 4 business hours.",
        ],
      },
      {
        id: "ps-st-2", kind: "deliverables", title: "Deliverables", enabled: true,
        body: [
          "Intake form with triage rules; quoting engine on your price book with mobile e-sign; dispatch calendar sync; Moneybird draft-invoice triggers; training for office and field teams with a Loom library.",
        ],
      },
      {
        id: "ps-st-3", kind: "pricing", title: "Investment", enabled: true,
        body: [
          "Fixed fee €9,600: 50% on signature, 50% at go-live. Includes one revision round and a one-week parallel run. SMS notifications available post-launch as a pre-priced change order (€1,150).",
        ],
      },
      {
        id: "ps-st-4", kind: "next_steps", title: "Next steps", enabled: true,
        body: ["Sign via the link below. Kickoff within a week — first milestone (intake + quoting on staging) three weeks later."],
      },
    ],
  },
  {
    id: "pp-pellervo",
    leadId: "ld-pellervo",
    title: "Pellervo Furniture — Magento to Shopify Migration",
    status: "declined",
    amount: 18000,
    tierSelected: "lean",
    style: "concise",
    validUntil: daysFromNow(-20),
    sentAt: daysFromNow(-32),
    viewedAt: daysFromNow(-30),
    decidedAt: daysFromNow(-13),
    views: 5,
    updatedAt: daysFromNow(-13),
    sections: [
      {
        id: "ps-pf-1", kind: "executive_summary", title: "Executive summary", enabled: true,
        body: ["Migration of 3,200 SKUs from end-of-life Magento 1 to Shopify with validated data integrity, theme rebuild, and SEO-safe cutover."],
      },
      {
        id: "ps-pf-2", kind: "pricing", title: "Investment", enabled: true,
        body: ["Fixed fee €18,000 — 40/30/30. Declined 28 May: board selected a lower-cost vendor (~€11k). Door left open for a migration-rescue engagement."],
      },
    ],
  },
  {
    id: "pp-roastery",
    leadId: "ld-roastery",
    title: "Roastery Nord — Site Rebuild & Subscription Commerce",
    status: "accepted",
    amount: 16800,
    tierSelected: "standard",
    style: "concise",
    validUntil: daysFromNow(-95),
    sentAt: daysFromNow(-110),
    viewedAt: daysFromNow(-109),
    decidedAt: daysFromNow(-104),
    views: 6,
    updatedAt: daysFromNow(-104),
    sections: [
      {
        id: "ps-rn-1", kind: "executive_summary", title: "Executive summary", enabled: true,
        body: ["Rebuild of roasterynord.dk with subscription commerce (Recharge), delivered April 2026. Currently in 60-day support window."],
      },
    ],
  },
];

/* ---------------- follow-ups ---------------- */

export const followUps: FollowUp[] = [
  {
    id: "fu-northgate-2",
    leadId: "ld-northgate",
    proposalId: "pp-northgate",
    dueAt: daysFromNow(0, 14),
    sequenceStep: 2,
    channel: "email",
    status: "due",
    reason: "Proposal viewed 4× including yesterday 16:40 — Daniel is re-reading the pricing section. Decision momentum is warm; nudge before the weekend.",
    draftMessage: `Hi Daniel,

When we spoke you mentioned wanting movement before the autumn intake period — I've held kickoff capacity for the week of 22 June to protect that.

One thing worth flagging from the proposal: GBP recovery for the three profiles owned by your former employee takes 2–3 weeks through Google's process, and it gates the map-pack work. Starting that recovery is day-one work, independent of everything else.

Happy to walk Dr. Singh through the clinical review workflow this week if that would help the committee — it's a 20-minute call.

Best,
Lukas`,
  },
  {
    id: "fu-harborfern-1",
    leadId: "ld-harborfern",
    dueAt: daysFromNow(0, 11),
    sequenceStep: 1,
    channel: "email",
    status: "due",
    reason: "New inbound from a warm referral (Veldt Cycles), founder traveling Thu–Fri. Same-day response SLA — propose a call for Wednesday.",
    draftMessage: `Hi Sofie,

Thanks for the detailed note — and a CAC doubling from €31 to €58 since January while revenue holds is actually a useful signal: the account is fatiguing, not the offer.

Your instinct on the three problems is right, and they're sequenced wrong as separate fixes — the account rebuild only pays off if landing pages stop sending paid traffic to collection pages. We'd treat it as one funnel project.

You mentioned traveling Thu–Fri — could you do 30 minutes Wednesday, 10:00 or 15:00 CET? I'll bring a quick teardown of the account structure issues we can see from the outside.

Elise`,
  },
  {
    id: "fu-veldt-3",
    leadId: "ld-veldt",
    proposalId: "pp-veldt",
    dueAt: daysFromNow(1, 10),
    sequenceStep: 3,
    channel: "call",
    status: "scheduled",
    reason: "Negotiation call booked (Thu 10:00). Prep: phasing trade-off one-pager; floor is €29k for phase 1; configurator descopes before any price move.",
    draftMessage: `[Call prep — not an email]
Position: Phase 1 at €31k stands. If Anna pushes on price: offer to move paint-programme visualiser to Phase 2 (−€2k) before touching margin. Dealer locator and Strava stay Phase 2 — written into the proposal appendix at fixed prices, valid 90 days. Close on: prototype validation with 5 real customers at week 3.`,
  },
  {
    id: "fu-aurelia-1",
    leadId: "ld-aurelia",
    dueAt: daysFromNow(2, 9),
    sequenceStep: 1,
    channel: "email",
    status: "scheduled",
    reason: "Two clarification questions unanswered for 2 days — decision-process question blocks scoping. Marco said 'this week'; gentle nudge Friday if silent.",
    draftMessage: `Hi Marco,

Quick nudge on the two open questions from the brief — particularly the decision process. The honest reason we ask: identity projects with three approvers and no tie-break rule average double the revision cycles, and that always costs more than it saves.

If it helps, we can do a 15-minute call with you and Beatriz to settle it — most groups land on "Beatriz decides after hearing both" and that single sentence protects the whole timeline.

Marco's call — but the naming sprint can't start until this is settled.

Tom`,
  },
  {
    id: "fu-pellervo-x",
    leadId: "ld-pellervo",
    proposalId: "pp-pellervo",
    dueAt: daysFromNow(124),
    sequenceStep: 1,
    channel: "email",
    status: "scheduled",
    reason: "Lost on price to an offshore vendor. Janne hinted the board may revisit if migration goes badly. Scheduled re-engagement check-in for October.",
    draftMessage: `Hi Janne,

No pitch — just checking in on how the Magento migration is going. If timelines have slipped or data integrity is wobbling, we keep a 'migration rescue' track with a 2-week stabilisation sprint; happy to share how that works.

Either way, hope it's going smoothly.

Elise`,
  },
  {
    id: "fu-meridian-qbr",
    leadId: "ld-meridian",
    dueAt: daysFromNow(5, 10),
    sequenceStep: 1,
    channel: "call",
    status: "scheduled",
    reason: "Renewal QBR prep — retainer renews 31 Jul. Organic leads +64% YoY; build the renewal deck and propose the Dominance-tier upgrade path.",
    draftMessage: `[QBR agenda draft]
1. 9-month results: organic leads +64% YoY, 31 first-page terms (+12). 2. Attribution: 9 signed matters traced to organic in Q1–Q2. 3. Renewal options: continue at current tier, or add digital PR programme (+£700/mo) targeting the employment-tribunal content gap competitors haven't covered. 4. Term: propose 12-month renewal with the same quarterly exit clause.`,
  },
];

/* ---------------- onboarding ---------------- */

export const onboardingFlows: OnboardingFlow[] = [
  {
    id: "ob-stratus",
    leadId: "ld-stratus",
    clientName: "Stratus HVAC Services",
    projectName: "Quote-to-Dispatch Automation",
    kickoffDate: daysFromNow(-6),
    welcomeNote:
      "Welcome aboard. Over the next six weeks we'll take your quote-to-invoice chain from three disconnected systems to one flow. This page is the single source of truth for what we need from you and what happens next — your only job this week is the access checklist.",
    tasks: [
      { id: "ot-st-1", title: "Countersigned agreement filed", group: "kickoff", ownerId: "tm-elise", dueInDays: -5, done: true },
      { id: "ot-st-2", title: "40% deposit invoice paid", group: "kickoff", ownerId: "tm-elise", dueInDays: -4, done: true },
      { id: "ot-st-3", title: "Kickoff call held — goals & milestone walkthrough", group: "kickoff", ownerId: "tm-priya", dueInDays: -6, done: true },
      { id: "ot-st-4", title: "Moneybird API token received & tested", group: "access", ownerId: "tm-priya", dueInDays: -3, done: true },
      { id: "ot-st-5", title: "Engineer calendar access (11 calendars)", group: "access", ownerId: "tm-priya", dueInDays: -2, done: true },
      { id: "ot-st-6", title: "Price book v2 confirmed as final", group: "assets", ownerId: "tm-priya", dueInDays: 0, done: false },
      { id: "ot-st-7", title: "Service request categories & triage rules signed off", group: "client", dueInDays: 1, done: false },
      { id: "ot-st-8", title: "Two engineer champions nominated for testing", group: "client", dueInDays: 2, done: false },
      { id: "ot-st-9", title: "Internal handoff: sales → delivery summary in workspace", group: "internal", ownerId: "tm-jonas", dueInDays: -5, done: true },
      { id: "ot-st-10", title: "Staging environment provisioned", group: "internal", ownerId: "tm-priya", dueInDays: 3, done: false },
      { id: "ot-st-11", title: "Week-3 demo booked (intake + quoting)", group: "kickoff", ownerId: "tm-elise", dueInDays: 4, done: false },
    ],
    assetRequests: [
      "Final price book (v2) — confirm no pending changes",
      "Company logo pack (SVG) for quote and invoice templates",
      "Example quotes: 3 recent 'good' quotes, 1 that went wrong",
      "Engineer roster with mobile numbers and working patterns",
      "Moneybird invoice template currently in use",
    ],
    stakeholders: [
      { name: "Pieter Vandenberg", role: "Operations Manager — decisions & sign-off", side: "client" },
      { name: "Mark de Vries", role: "Owner — informed at milestones", side: "client" },
      { name: "Priya Shah", role: "Delivery Lead — your main contact", side: "agency" },
      { name: "Elise Fontaine", role: "Account Manager — commercials & scheduling", side: "agency" },
    ],
    planFirst14Days: [
      { day: 1, action: "Kickoff call: walk milestones, confirm triage rules draft" },
      { day: 2, action: "Access verification: Moneybird sandbox test, calendar sync dry run" },
      { day: 4, action: "Intake form v1 on staging with real service categories" },
      { day: 7, action: "Quoting engine wired to price book — internal test with 5 historical jobs" },
      { day: 9, action: "Pieter reviews quote templates; one consolidated feedback round" },
      { day: 11, action: "Triage rules tuned against last month's real request mix" },
      { day: 14, action: "Week-3 demo prep: intake → quote end-to-end on staging" },
    ],
  },
  {
    id: "ob-roastery",
    leadId: "ld-roastery",
    clientName: "Roastery Nord",
    projectName: "Site Rebuild & Subscription Commerce",
    kickoffDate: daysFromNow(-100),
    welcomeNote: "Completed flow — retained for reference. Project delivered 14 Apr 2026; support window closes 13 Jun.",
    tasks: [
      { id: "ot-rn-1", title: "Agreement + deposit", group: "kickoff", ownerId: "tm-elise", dueInDays: -98, done: true },
      { id: "ot-rn-2", title: "Shopify + Recharge access", group: "access", ownerId: "tm-priya", dueInDays: -96, done: true },
      { id: "ot-rn-3", title: "Brand assets & photography received", group: "assets", dueInDays: -94, done: true },
      { id: "ot-rn-4", title: "Subscription plans & pricing confirmed", group: "client", dueInDays: -90, done: true },
      { id: "ot-rn-5", title: "Launch checklist executed", group: "internal", ownerId: "tm-priya", dueInDays: -57, done: true },
    ],
    assetRequests: ["Brand assets (received)", "Product photography (received)", "Subscription plan matrix (received)"],
    stakeholders: [
      { name: "Ida Sørensen", role: "Owner", side: "client" },
      { name: "Priya Shah", role: "Delivery Lead", side: "agency" },
    ],
    planFirst14Days: [
      { day: 1, action: "Kickoff & access" },
      { day: 7, action: "Design direction review" },
      { day: 14, action: "Subscription flow prototype" },
    ],
  },
];

/* ---------------- change orders ---------------- */

export const changeOrders: ChangeOrder[] = [
  {
    id: "co-stratus-sms",
    leadId: "ld-stratus",
    projectName: "Quote-to-Dispatch Automation",
    requestText:
      "Pieter (call, 9 Jun): 'One thing the engineers asked — can customers get an SMS when the engineer is en route? And maybe a reminder the day before? WhatsApp would be even better.'",
    requestedBy: "Pieter Vandenberg",
    receivedAt: daysFromNow(-1),
    classification: "out_of_scope",
    rationale:
      "SMS notifications are explicitly listed in scope exclusions ('SMS notifications — available as change order'). WhatsApp adds Business API setup, template approval, and a per-message cost the client hasn't seen. This is new capability, not refinement of existing scope.",
    scopeReference: "sc-stratus → Exclusions, item 4",
    suggestedWording:
      "Good news is this was anticipated — en-route and day-before SMS is pre-priced as an add-on at €1,150 (build + your Twilio setup, ~€0.07/message running cost). WhatsApp is possible but heavier: Business API verification takes 2–3 weeks and message templates need Meta approval, so we'd suggest launching with SMS now and revisiting WhatsApp once the flow has run for a month.",
    price: 1150,
    effortDays: 2,
    status: "open",
  },
  {
    id: "co-roastery-gifting",
    leadId: "ld-roastery",
    projectName: "Site Rebuild & Subscription Commerce",
    requestText:
      "Ida (email, 6 Jun): 'Subscribers keep asking to send a subscription as a gift. Could we add a gifting option to the subscription flow? Feels small since the subscription logic is all there?'",
    requestedBy: "Ida Sørensen",
    receivedAt: daysFromNow(-4),
    classification: "out_of_scope",
    rationale:
      "Gift subscriptions are a distinct commerce flow: separate purchaser/recipient records, scheduled start dates, gift messaging, and renewal-consent handling. 'The subscription logic is all there' undersells it — Recharge gifting requires its own checkout path. Classic 'feels small' creep signal.",
    scopeReference: "pp-roastery → Scope: subscription commerce (single-recipient flows)",
    suggestedWording:
      "Gifting is a genuinely good idea — subscriber-driven feature requests like this usually convert well. It's a separate checkout flow in Recharge rather than a toggle, so it sits outside the original scope. We'd deliver it as a focused mini-project: gift purchase flow, recipient scheduling, and gift messaging for €2,400, two weeks end-to-end. Worth doing before the holiday gifting season rather than during it.",
    price: 2400,
    effortDays: 4,
    status: "sent",
  },
  {
    id: "co-roastery-banner",
    leadId: "ld-roastery",
    projectName: "Site Rebuild & Subscription Commerce",
    requestText:
      "Ida (email, 4 Jun): 'Tiny one — can you swap the homepage hero to the summer blend campaign image and update the promo text? Assets attached.'",
    requestedBy: "Ida Sørensen",
    receivedAt: daysFromNow(-6),
    classification: "in_scope",
    rationale:
      "Content swap using existing template and client-supplied assets, within the 60-day support window (closes 13 Jun). No layout or logic change. 20-minute task — goodwill value exceeds any billing rationale.",
    scopeReference: "pp-roastery → 60-day support window",
    suggestedWording:
      "Done by end of day — summer blend hero is live. Note our support window closes 13 Jun; after that, content updates like this move to the maintenance plan we shared (from €240/mo) or ad-hoc at our day rate.",
    price: 0,
    effortDays: 0.1,
    status: "approved",
  },
];

/* ---------------- templates ---------------- */

export const templates: Template[] = [
  { id: "tp-1", kind: "proposal", name: "Website project — standard", description: "9-section proposal for fixed-fee site builds. Exec summary leads with business cost of the status quo; pricing uses 3-tier anchor structure.", tags: ["website", "fixed-fee"], usedCount: 23, updatedAt: daysFromNow(-11), sections: ["Executive summary", "Scope of work", "Deliverables", "Exclusions", "Timeline", "Investment", "Revision policy", "Terms", "Next steps"] },
  { id: "tp-2", kind: "proposal", name: "Retainer — performance programme", description: "For SEO/paid retainers. Quarterly exit clause standard, breakeven framing in exec summary, attribution reporting cadence built in.", tags: ["retainer", "seo", "paid-media"], usedCount: 17, updatedAt: daysFromNow(-9), sections: ["Executive summary", "Programme scope", "What's not included", "Timeline & cadence", "Investment", "Change control", "Next steps"] },
  { id: "tp-3", kind: "scope_module", name: "Discovery sprint", description: "2-week paid discovery: stakeholder interviews, audit, recommendation memo. De-risks big builds and converts 70% to full projects.", tags: ["discovery"], usedCount: 31, updatedAt: daysFromNow(-30) },
  { id: "tp-4", kind: "scope_module", name: "Ecommerce migration block", description: "Platform migration scope with dry run, checksum validation, account preservation, and 301 mapping. Includes the data-integrity acceptance criteria.", tags: ["ecommerce", "migration"], usedCount: 9, updatedAt: daysFromNow(-25) },
  { id: "tp-5", kind: "scope_module", name: "Local SEO foundations", description: "Location pages + citations + GBP + review system. Sized per-location with the multi-location multiplier table.", tags: ["seo", "local"], usedCount: 12, updatedAt: daysFromNow(-9) },
  { id: "tp-6", kind: "onboarding", name: "Client kickoff — standard", description: "The default post-signature flow: agreement filing, deposit, access checklist, kickoff agenda, week-3 demo booking, 14-day plan.", tags: ["kickoff"], usedCount: 28, updatedAt: daysFromNow(-15) },
  { id: "tp-7", kind: "email", name: "Proposal follow-up #1 — momentum", description: "First nudge, 3–5 days post-send. References a concrete operational detail from the proposal, never 'just checking in'.", tags: ["follow-up"], usedCount: 41, updatedAt: daysFromNow(-6) },
  { id: "tp-8", kind: "email", name: "Scope guardrail reply", description: "The polite-but-firm response when a request lands outside scope: acknowledge value, cite the scope line, offer the pre-priced path.", tags: ["scope-control"], usedCount: 19, updatedAt: daysFromNow(-3) },
  { id: "tp-9", kind: "proposal", name: "Brand identity — strategic", description: "For identity work with multi-stakeholder approval risk. Decision-process clause and revision economics stated upfront.", tags: ["branding"], usedCount: 8, updatedAt: daysFromNow(-18), sections: ["Executive summary", "Strategy approach", "Identity scope", "Decision process", "Exclusions", "Timeline", "Investment", "Next steps"] },
  { id: "tp-10", kind: "onboarding", name: "Retainer onboarding", description: "Month-zero flow for retainers: access matrix, reporting setup, escalation contacts, first-30-days expectations memo.", tags: ["retainer"], usedCount: 13, updatedAt: daysFromNow(-21) },
];

/* ---------------- service blueprints ---------------- */

export const services: ServiceBlueprint[] = [
  {
    id: "sv-website",
    name: "Website design & build",
    category: "Web",
    description: "Fixed-fee marketing or commerce site: discovery, design system, custom build, launch support. The agency's flagship offer.",
    pricingMode: "project",
    basePrice: 24000,
    targetMarginPct: 40,
    typicalTimelineWeeks: 10,
    deliverables: ["Discovery & recommendation", "Design system + templates", "Custom build", "Content load", "Launch support + hypercare"],
    standardExclusions: ["Copywriting", "Photography", "Ongoing maintenance", "Paid media"],
    revisionRounds: 2,
    usedCount: 34,
  },
  {
    id: "sv-seo",
    name: "SEO retainer",
    category: "Performance",
    description: "Monthly programme: technical, content, authority. 12-month default term, quarterly exit from month 6, attribution reporting standard.",
    pricingMode: "retainer",
    basePrice: 3200,
    targetMarginPct: 42,
    typicalTimelineWeeks: 52,
    deliverables: ["Technical programme", "Content production", "Authority building", "Monthly attribution reporting"],
    standardExclusions: ["Paid search", "Site redesign", "PR beyond citations"],
    revisionRounds: 1,
    usedCount: 21,
  },
  {
    id: "sv-paid",
    name: "Paid media management",
    category: "Performance",
    description: "Account restructure + ongoing management. Fee floor €2.8k/mo or 12% of spend, whichever is greater. Landing pages scoped separately.",
    pricingMode: "retainer",
    basePrice: 2800,
    targetMarginPct: 45,
    typicalTimelineWeeks: 26,
    deliverables: ["Account restructure", "Creative testing programme", "Landing page CRO advisory", "Weekly pacing + monthly reporting"],
    standardExclusions: ["Media spend", "Creative production beyond ad variants", "Email marketing"],
    revisionRounds: 1,
    usedCount: 16,
  },
  {
    id: "sv-brand",
    name: "Brand identity",
    category: "Brand",
    description: "Strategy-led identity: workshop, naming, system, guidelines. Decision-process clause mandatory for multi-approver clients.",
    pricingMode: "project",
    basePrice: 18000,
    targetMarginPct: 38,
    typicalTimelineWeeks: 8,
    deliverables: ["Strategy workshop", "Naming (optional)", "Identity system", "Voice & messaging", "Guidelines"],
    standardExclusions: ["Trademark legal", "Packaging production", "Website (separate blueprint)"],
    revisionRounds: 2,
    usedCount: 14,
  },
  {
    id: "sv-automation",
    name: "Automation implementation",
    category: "Operations",
    description: "Workflow automation for service businesses: intake, quoting, scheduling, invoicing. Fixed-fee with one-week parallel run.",
    pricingMode: "project",
    basePrice: 8500,
    targetMarginPct: 44,
    typicalTimelineWeeks: 6,
    deliverables: ["Process mapping", "Build & integration", "Parallel run", "Training + runbook"],
    standardExclusions: ["Software licence costs", "Historical data migration", "Custom mobile apps"],
    revisionRounds: 1,
    usedCount: 11,
  },
];

/* ---------------- activity ---------------- */

export const activity: ActivityEvent[] = [
  { id: "ac-1", at: daysFromNow(0, 8), actorId: "tm-tom", kind: "brief_updated", text: "Updated Calder & Mott brief — added partners' committee approval cadence to constraints", leadId: "ld-calder" },
  { id: "ac-2", at: daysFromNow(0, 7), actorId: "tm-elise", kind: "lead_created", text: "New inbound lead: Harbor & Fern (paid media + funnel) via email — referral from Veldt Cycles", leadId: "ld-harborfern" },
  { id: "ac-3", at: daysFromNow(-1, 17), actorId: "tm-maya", kind: "proposal_viewed", text: "Northgate proposal viewed for the 4th time — pricing section, 6 min dwell", leadId: "ld-northgate" },
  { id: "ac-4", at: daysFromNow(-1, 15), actorId: "tm-priya", kind: "change_order", text: "Change order drafted: Stratus SMS notifications classified out-of-scope, pre-priced €1,150", leadId: "ld-stratus" },
  { id: "ac-5", at: daysFromNow(-1, 11), actorId: "tm-jonas", kind: "scope_updated", text: "Maison Vey scope: added phased-launch contingency to risk mitigations; sent for internal review", leadId: "ld-vey" },
  { id: "ac-6", at: daysFromNow(-2, 16), actorId: "tm-tom", kind: "comment", text: "Aurelia: Marco confirmed interior design concept lands mid-July — logged as scope dependency", leadId: "ld-aurelia" },
  { id: "ac-7", at: daysFromNow(-2, 11), actorId: "tm-jonas", kind: "proposal_viewed", text: "Veldt proposal viewed 7th time; Anna forwarded to ops lead (new viewer)", leadId: "ld-veldt" },
  { id: "ac-8", at: daysFromNow(-2, 9), actorId: "tm-lukas", kind: "follow_up_sent", text: "Meridian QBR agenda shared with Grace ahead of renewal call", leadId: "ld-meridian" },
  { id: "ac-9", at: daysFromNow(-3, 15), actorId: "tm-elise", kind: "stage_change", text: "Veldt Cycles moved to Negotiation — call booked Thursday 10:00", leadId: "ld-veldt" },
  { id: "ac-10", at: daysFromNow(-4, 10), actorId: "tm-priya", kind: "change_order", text: "Roastery gifting request classified out-of-scope; €2,400 mini-project proposal sent", leadId: "ld-roastery" },
  { id: "ac-11", at: daysFromNow(-4, 9), actorId: "tm-priya", kind: "onboarding_started", text: "Stratus onboarding 5 of 11 tasks complete — price book confirmation due today", leadId: "ld-stratus" },
  { id: "ac-12", at: daysFromNow(-5, 14), actorId: "tm-jonas", kind: "intake_analyzed", text: "Maison Vey discovery transcript analyzed — 78% intake confidence, 3 clarifying questions suggested", leadId: "ld-vey" },
  { id: "ac-13", at: daysFromNow(-6, 12), actorId: "tm-priya", kind: "onboarding_started", text: "Stratus kickoff held; 14-day plan issued to client", leadId: "ld-stratus" },
  { id: "ac-14", at: daysFromNow(-6, 9), actorId: "tm-tom", kind: "brief_updated", text: "Aurelia brief flagged needs-clarification: decision process + naming status unresolved", leadId: "ld-aurelia" },
  { id: "ac-15", at: daysFromNow(-6, 8), actorId: "tm-lukas", kind: "proposal_sent", text: "Northgate proposal sent — £3,300/mo Programme tier recommended, valid 17 days", leadId: "ld-northgate" },
  { id: "ac-16", at: daysFromNow(-8, 16), actorId: "tm-jonas", kind: "proposal_sent", text: "Veldt proposal sent with phase-2 appendix for dealer locator + Strava", leadId: "ld-veldt" },
];

/* ---------------- notifications ---------------- */

export const notifications: AppNotification[] = [
  { id: "nt-1", at: daysFromNow(-1, 17), kind: "info", title: "Northgate re-read pricing", body: "4th proposal view, 6-minute dwell on the pricing section. Follow-up #2 is drafted and due today.", read: false, href: "/follow-ups" },
  { id: "nt-2", at: daysFromNow(0, 7), kind: "alert", title: "New inbound: Harbor & Fern", body: "Founder-led referral from Veldt Cycles. CAC crisis, Q4 deadline pressure — same-day response SLA applies.", read: false, href: "/leads/ld-harborfern" },
  { id: "nt-3", at: daysFromNow(-1, 15), kind: "alert", title: "Scope risk: Veldt Cycles", body: "Two unpriced additions surfaced in negotiation calls. Risk level raised to high — phasing strategy attached to Thursday's call prep.", read: false, href: "/leads/ld-veldt" },
  { id: "nt-4", at: daysFromNow(-1, 9), kind: "alert", title: "Aurelia clarifications stale", body: "Two blocking questions unanswered for 48h. Naming sprint can't start; nudge scheduled for Friday.", read: true, href: "/briefs/br-aurelia" },
  { id: "nt-5", at: daysFromNow(-2, 10), kind: "success", title: "Stratus onboarding on track", body: "5 of 11 kickoff tasks complete. Client-side: price book confirmation due today.", read: true, href: "/onboarding/ob-stratus" },
  { id: "nt-6", at: daysFromNow(-4, 11), kind: "info", title: "Roastery support window closing", body: "60-day support ends 13 Jun. Two open change orders — gifting proposal awaiting Ida's reply.", read: true, href: "/change-orders" },
  { id: "nt-7", at: daysFromNow(-6, 8), kind: "success", title: "Proposal sent: Northgate Dental", body: "£3,300/mo Programme tier, 12-month term. Auto follow-up sequence armed.", read: true, href: "/proposals/pp-northgate" },
];

/* ---------------- analytics ---------------- */

export const analytics = {
  /** monthly proposal flow, Jan–Jun 2026 */
  monthly: [
    { month: "Jan", sent: 6, won: 2, value: 91000 },
    { month: "Feb", sent: 8, won: 3, value: 124000 },
    { month: "Mar", sent: 7, won: 3, value: 102000 },
    { month: "Apr", sent: 9, won: 4, value: 143000 },
    { month: "May", sent: 8, won: 3, value: 131000 },
    { month: "Jun", sent: 4, won: 1, value: 78000 },
  ],
  funnel: { created: 42, sent: 38, viewed: 31, accepted: 16 },
  winRatePct: 42,
  medianTurnaroundDays: 2.1,
  industryTurnaroundDays: 6.5,
  avgMarginPct: 39.4,
  marginFloorPct: 35,
  scopeCreepCaught: 11,
  scopeCreepRecoveredValue: 14750,
  avgDealValue: 23400,
  responseTimeHours: 3.2,
  marginByService: [
    { service: "Paid media", marginPct: 45 },
    { service: "Automation", marginPct: 44 },
    { service: "SEO retainers", marginPct: 42 },
    { service: "Web projects", marginPct: 40 },
    { service: "Brand identity", marginPct: 37 },
  ],
};

/* convenience lookups */
export const teamById = Object.fromEntries(team.map((t) => [t.id, t]));
