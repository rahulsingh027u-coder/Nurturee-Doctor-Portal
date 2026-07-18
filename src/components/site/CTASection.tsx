"use client";

import { ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function CTASection() {
  const setView = useAppStore((s) => s.setView);

  return (
    <section className="px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 py-10 text-center text-white shadow-lg md:px-12 md:py-14">
          <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 size-48 rounded-full bg-indigo-400/20 blur-2xl" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to book a caregiver?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-blue-100 sm:text-base">
              Pick a service, choose a date and time, and we&apos;ll assign a
              verified caregiver or doctor — with full documents you can see
              before they arrive.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => setView("childcare")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-50 active:scale-95"
              >
                Book Child Care
                <ArrowRight className="size-4" />
              </button>
              <button
                onClick={() => setView("eldercare")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-95"
              >
                Book Elder Care
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
