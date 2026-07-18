"use client";

import { ArrowLeft, Check, Clock, MapPin, Video, Wallet } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { SERVICES } from "@/lib/data";
import { Icon, ACCENT_CLASSES } from "./Icons";
import type { Service, ServiceCategory } from "@/lib/types";

const CATEGORY_TITLE: Record<ServiceCategory, { title: string; subtitle: string }> = {
  childcare: {
    title: "Child Care Services",
    subtitle:
      "From pregnancy planning to your baby's first steps, and from Jappa care to day nannies — our verified specialists and caregivers support every stage of early parenthood in Gurgaon.",
  },
  eldercare: {
    title: "Elder Care Services",
    subtitle:
      "Companionship, medical attendants, dementia care and post-hospitalisation recovery — bringing dignity and safety to your parents and grandparents at home.",
  },
  doctor: {
    title: "Doctor Consultation",
    subtitle:
      "Online video consults and in-home visits with qualified paediatricians, gynaecologists, geriatric specialists and physicians across Gurgaon.",
  },
  verification: {
    title: "Caregiver Verification",
    subtitle:
      "Hiring a caregiver from outside? Use our verification services as a safety net — Aadhaar, police, address, references and video interview.",
  },
};

const CATEGORY_ACCENT: Record<ServiceCategory, "blue" | "indigo" | "rose" | "amber"> = {
  childcare: "blue",
  eldercare: "indigo",
  doctor: "rose",
  verification: "amber",
};

function formatPrice(s: Service): string {
  if (s.mode === "both" && s.onlinePrice && s.inHomePrice) {
    return `₹${s.onlinePrice.toLocaleString("en-IN")} online • ₹${s.inHomePrice.toLocaleString("en-IN")} at home`;
  }
  return `₹${s.price.toLocaleString("en-IN")} ${s.priceUnit}`;
}

function ServiceCard({ service }: { service: Service }) {
  const openBooking = useAppStore((s) => s.openBooking);
  const accent = ACCENT_CLASSES[service.accent];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md md:p-6">
      <div className="flex items-start gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${accent.softBg} ${accent.softText}`}
        >
          <Icon name={service.icon} className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-tight sm:text-lg">
            {service.name}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {service.shortDescription}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {service.duration}
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300">
          <Wallet className="size-3.5" /> {formatPrice(service)}
        </span>
        <span className="inline-flex items-center gap-1">
          {service.mode === "online" ? (
            <>
              <Video className="size-3.5" /> Online only
            </>
          ) : service.mode === "physical" ? (
            <>
              <MapPin className="size-3.5" /> In-home
            </>
          ) : (
            <>
              <Video className="size-3.5" /> Online &amp; in-home
            </>
          )}
        </span>
      </div>

      <ul className="grid gap-1.5 text-xs text-slate-700 sm:text-sm">
        {service.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => openBooking(service)}
        className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
      >
        Book Now
      </button>
    </div>
  );
}

export function ServiceDetailView({ category }: { category: ServiceCategory }) {
  const setView = useAppStore((s) => s.setView);
  const meta = CATEGORY_TITLE[category];
  const accent = ACCENT_CLASSES[CATEGORY_ACCENT[category]];
  const services = SERVICES.filter((s) => s.category === category);

  // Special ordering for childcare: maternal services first, nannies after
  if (category === "childcare") {
    const maternalIds = [
      "pregnancy-planning",
      "prenatal-care",
      "postnatal-care",
      "child-health",
      "women-health",
    ];
    const nannyIds = ["day-nanny", "live-nanny-24hr", "jappa-nanny"];
    const maternal = maternalIds
      .map((id) => services.find((s) => s.id === id))
      .filter(Boolean) as Service[];
    const nannies = nannyIds
      .map((id) => services.find((s) => s.id === id))
      .filter(Boolean) as Service[];

    return (
      <div className="px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => setView("home")}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-blue-700"
          >
            <ArrowLeft className="size-4" /> Back to Home
          </button>

          <div className="mb-8">
            <span
              className={`mb-3 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${accent.softBg} ${accent.softText}`}
            >
              <Icon
                name={category === "childcare" ? "Baby" : "Users"}
                className="size-3"
              />
              Child Care
            </span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {meta.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {meta.subtitle}
            </p>
          </div>

          {/* Maternal & child health services */}
          <section className="mb-10">
            <h2 className="mb-1 text-lg font-semibold sm:text-xl">
              Maternal &amp; Child Health
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Consultations with gynaecologists, paediatricians and maternal
              health experts — available online or at-home.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {maternal.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </section>

          {/* Nanny services */}
          <section>
            <h2 className="mb-1 text-lg font-semibold sm:text-xl">
              Nanny Services
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Background-verified, video-interviewed nannies for newborn and
              infant care — billed monthly with replacement guarantee.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nannies.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => setView("home")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-blue-700"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </button>

        <div className="mb-8">
          <span
            className={`mb-3 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${accent.softBg} ${accent.softText}`}
          >
            <Icon
              name={
                category === "eldercare"
                  ? "Users"
                  : category === "doctor"
                  ? "Stethoscope"
                  : "ShieldCheck"
              }
              className="size-3"
            />
            {meta.title}
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {meta.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {meta.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
