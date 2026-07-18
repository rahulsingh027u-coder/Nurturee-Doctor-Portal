"use client";

import { HeroSection } from "./HeroSection";
import { ServicesSection } from "./ServicesSection";
import { HowItWorks } from "./HowItWorks";
import { TrustSection } from "./TrustSection";
import { CTASection } from "./CTASection";

/**
 * Home view = the same 5 sections as the template, with two changes
 * requested by the user:
 *   1. "Why Trust Us" stats (5000+ families etc.) replaced by concrete
 *      trust pillars — because we are new and have not served anyone yet.
 *   2. Fake testimonials removed entirely.
 */
export function HomeView() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <HowItWorks />
      <TrustSection />
      <CTASection />
    </>
  );
}
