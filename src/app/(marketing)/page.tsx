"use client";

/* ================================================================
   Landing page — the front door. Hero vignette, the chain,
   before/after, scope-creep prevention, turnaround, onboarding,
   operator quotes, pricing preview, FAQ, final CTA.
   ================================================================ */

import { PageTransition } from "@/components/ui/page";
import { Hero } from "@/components/marketing/hero";
import { PipelineStrip } from "@/components/marketing/pipeline-strip";
import { PainOutcome } from "@/components/marketing/pain-outcome";
import { CreepVignette } from "@/components/marketing/creep-vignette";
import { Turnaround } from "@/components/marketing/turnaround";
import { OnboardingBand } from "@/components/marketing/onboarding-band";
import { QuotesBand } from "@/components/marketing/quotes-band";
import { PricingPreview } from "@/components/marketing/pricing-preview";
import { FaqSection } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";

export default function LandingPage() {
  return (
    <PageTransition>
      <Hero />
      <PipelineStrip />
      <PainOutcome />
      <CreepVignette />
      <Turnaround />
      <OnboardingBand />
      <QuotesBand />
      <PricingPreview />
      <FaqSection />
      <CtaBand />
    </PageTransition>
  );
}
