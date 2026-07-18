"use client";

import { Sparkles, ArrowRight, Baby, Users, Stethoscope, ShieldCheck, HeartHandshake, Star } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function HeroSection() {
  const setView = useAppStore((s) => s.setView);
  const openBooking = useAppStore((s) => s.openBooking);

  const scrollToServices = () => {
    document
      .getElementById("services")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-4 pt-12 pb-20 text-white md:px-8 md:pt-16 md:pb-28 lg:pb-32">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 -left-20 size-56 rounded-full bg-indigo-400/20 blur-xl" />
        <div className="absolute top-1/2 right-1/4 size-40 rounded-full bg-blue-300/10 blur-lg" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <span className="mb-4 inline-flex items-center justify-center gap-1 rounded-md border border-white/30 bg-white/15 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              <Sparkles className="size-3" />
              New in Gurgaon — building trust from day one
            </span>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              Trusted Care for Your{" "}
              <span className="gradient-text-amber">Loved Ones</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-blue-100 sm:text-lg md:mt-5">
              From pregnancy planning to elder care — verified, video-interviewed
              caregivers and qualified doctors at your doorstep in Gurgaon.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <button
                onClick={scrollToServices}
                className="inline-flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-50 active:scale-95"
              >
                Book a Service
                <ArrowRight className="size-4" />
              </button>
              <button
                onClick={scrollToServices}
                className="inline-flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-95"
              >
                Explore Services
              </button>
            </div>
          </div>

          {/* Right-side decorative icon grid */}
          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="relative">
              <div className="flex size-72 items-center justify-center rounded-3xl bg-white/10 p-6 backdrop-blur-sm lg:size-80">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-white/20">
                    <Baby className="size-10 text-white" />
                  </div>
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-white/20">
                    <Users className="size-10 text-white" />
                  </div>
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-white/20">
                    <Stethoscope className="size-10 text-white" />
                  </div>
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-amber-400/30">
                    <ShieldCheck className="size-10 text-amber-200" />
                  </div>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 flex size-14 items-center justify-center rounded-full bg-amber-400 shadow-lg shadow-amber-500/30">
                <HeartHandshake className="size-7 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 flex size-10 items-center justify-center rounded-full bg-indigo-400 shadow-lg shadow-indigo-500/30">
                <Star className="size-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 w-full" aria-hidden="true">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V100H0V40Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}
