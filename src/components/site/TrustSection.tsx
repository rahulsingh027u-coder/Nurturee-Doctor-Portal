"use client";

import { TRUST_PILLARS } from "@/lib/data";
import { Icon, ACCENT_CLASSES } from "./Icons";

/**
 * Replaces the original "Why Trust Us" stats section (5000+ families, etc.)
 * and the fake testimonials section. Since Nurturee is new and has not yet
 * served any families, we surface concrete, verifiable trust signals instead:
 * what we check, what you can see, and how we support you.
 */
export function TrustSection() {
  return (
    <section className="px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center md:mb-14">
          <span className="mb-3 inline-flex items-center rounded-md border border-transparent bg-secondary px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            Our Commitment
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            How We Earn Your Trust
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            We are a new service — so instead of asking you to trust us with
            stories, we show you exactly what we verify and what you can see.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {TRUST_PILLARS.map((p) => {
            const accent = ACCENT_CLASSES[p.accent];
            return (
              <div
                key={p.title}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div
                  className={`flex size-11 items-center justify-center rounded-full ${accent.softBg} ${accent.softText}`}
                >
                  <Icon name={p.icon} className="size-5" />
                </div>
                <h3 className="text-sm font-semibold leading-tight sm:text-base">
                  {p.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Disclosure strip */}
        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50/50 p-5 md:p-6">
          <h3 className="text-sm font-semibold text-blue-900 sm:text-base">
            A note from the Nurturee team
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-blue-800/90">
            We are honest about being new. We have not served thousands of
            families — yet. What we have done is build a verification process we
            would want for our own parents and children: Aadhaar-checked,
            police-verified, video-interviewed, medically cleared. Every booking
            you make helps us earn the trust we ask for. If anything goes wrong,
            our support line is one call away and a replacement is guaranteed.
          </p>
        </div>
      </div>
    </section>
  );
}
