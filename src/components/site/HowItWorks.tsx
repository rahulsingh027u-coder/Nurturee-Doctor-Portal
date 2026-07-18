"use client";

import { ClipboardList, CalendarCheck, UserCheck } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Choose a Service",
    description: "Browse child care, elder care, doctor consult or verification — pick what you need.",
  },
  {
    icon: CalendarCheck,
    title: "Book & Schedule",
    description: "Pick a date, time slot and (for in-home visits) share your address. Online consults skip the address.",
  },
  {
    icon: UserCheck,
    title: "Verified Caregiver Assigned",
    description: "Our admin assigns an approved, fully-verified caregiver. You see their profile, documents and video verification before they arrive.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/40 px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center md:mb-14">
          <span className="mb-3 inline-flex items-center rounded-md border border-transparent bg-secondary px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            How It Works
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Get Started in 3 Simple Steps
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Booking a verified caregiver has never been easier
          </p>
        </div>

        {/* Desktop 3-step horizontal */}
        <div className="hidden gap-8 md:grid md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative text-center">
              {i < STEPS.length - 1 && (
                <div className="absolute left-[calc(50%+32px)] top-7 hidden h-0.5 w-[calc(100%-64px)] bg-gradient-to-r from-blue-400 to-indigo-400 md:block" />
              )}
              <div className="relative mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <s.icon className="size-5" />
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-amber-900 shadow">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-1 text-base font-semibold">{s.title}</h3>
              <p className="mx-auto max-w-[240px] text-sm text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile vertical */}
        <div className="flex flex-col gap-0 md:hidden">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                  <s.icon className="size-5" />
                  <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-amber-900 shadow">
                    {i + 1}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-400 to-blue-200" />
                )}
              </div>
              <div className={i < STEPS.length - 1 ? "pb-8" : ""}>
                <h3 className="mb-1 text-base font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
