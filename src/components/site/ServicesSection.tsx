"use client";

import { useAppStore } from "@/lib/store";
import { SERVICES } from "@/lib/data";
import { Icon, ACCENT_CLASSES } from "./Icons";
import { ArrowRight } from "lucide-react";
import type { ServiceCategory } from "@/lib/types";

const CATEGORY_META: Record<
  ServiceCategory,
  { label: string; icon: string; accent: "blue" | "indigo" | "rose" | "amber"; description: string }
> = {
  childcare: {
    label: "Child Care",
    icon: "Baby",
    accent: "blue",
    description: "Pregnancy planning to nanny services — expert care for every stage.",
  },
  eldercare: {
    label: "Elder Care",
    icon: "Users",
    accent: "indigo",
    description: "Compassionate daily assistance, medical support & companionship.",
  },
  doctor: {
    label: "Doctor Consultation",
    icon: "Stethoscope",
    accent: "rose",
    description: "Online & in-home consultations with qualified specialists.",
  },
  verification: {
    label: "Caregiver Verification",
    icon: "ShieldCheck",
    accent: "amber",
    description: "Background checks, identity & address verification for safety.",
  },
};

const CATEGORIES: ServiceCategory[] = ["childcare", "eldercare", "doctor", "verification"];

export function ServicesSection() {
  const setView = useAppStore((s) => s.setView);

  const countFor = (cat: ServiceCategory) =>
    SERVICES.filter((s) => s.category === cat).length;

  return (
    <section id="services" className="px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center md:mb-14">
          <span className="mb-3 inline-flex items-center rounded-md border border-transparent bg-secondary px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            Our Services
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Comprehensive Care Solutions
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Everything from child care to elder care, delivered by verified
            professionals across Gurgaon
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const accent = ACCENT_CLASSES[meta.accent];
            return (
              <button
                key={cat}
                onClick={() => setView(cat)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-transparent bg-card p-4 py-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg md:p-6"
              >
                <div
                  className={`flex size-14 items-center justify-center rounded-2xl ${accent.softBg} ${accent.softText} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon name={meta.icon} className="size-6" />
                </div>
                <h3 className="text-sm font-semibold leading-tight sm:text-base">
                  {meta.label}
                </h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {meta.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400">
                  {countFor(cat)} services
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
