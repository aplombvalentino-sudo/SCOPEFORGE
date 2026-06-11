"use client";

/* /product — module-by-module tour with live-feeling vignettes. */

import { PageTransition } from "@/components/ui/page";
import { ProductHero, ProductTour } from "@/components/marketing/product-blocks";
import { QuotesBand } from "@/components/marketing/quotes-band";
import { CtaBand } from "@/components/marketing/cta-band";

export default function ProductPage() {
  return (
    <PageTransition>
      <ProductHero />
      <ProductTour />
      <QuotesBand />
      <CtaBand
        title="See the chain run end-to-end on your own service types."
        lede="A 25-minute demo covers intake to onboarding with your actual offers — or explore Atelier North's live workspace right now."
      />
    </PageTransition>
  );
}
