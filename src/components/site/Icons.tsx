"use client";

import {
  Baby,
  Brain,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileCheck,
  FileText,
  Headset,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  UserCheck,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Baby,
  Brain,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileCheck,
  FileText,
  Headset,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  UserCheck,
  Users,
  Video,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = MAP[name] ?? Baby;
  return <Cmp className={className} aria-hidden="true" />;
}

/** Accent color → Tailwind classes for icon badges */
export const ACCENT_CLASSES: Record<
  string,
  { bg: string; text: string; softBg: string; softText: string }
> = {
  blue: {
    bg: "bg-blue-500",
    text: "text-white",
    softBg: "bg-blue-50 dark:bg-blue-950/40",
    softText: "text-blue-600 dark:text-blue-400",
  },
  indigo: {
    bg: "bg-indigo-500",
    text: "text-white",
    softBg: "bg-indigo-50 dark:bg-indigo-950/40",
    softText: "text-indigo-600 dark:text-indigo-400",
  },
  rose: {
    bg: "bg-rose-500",
    text: "text-white",
    softBg: "bg-rose-50 dark:bg-rose-950/40",
    softText: "text-rose-500 dark:text-rose-400",
  },
  amber: {
    bg: "bg-amber-500",
    text: "text-white",
    softBg: "bg-amber-50 dark:bg-amber-950/40",
    softText: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    bg: "bg-emerald-500",
    text: "text-white",
    softBg: "bg-emerald-50 dark:bg-emerald-950/40",
    softText: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    bg: "bg-violet-500",
    text: "text-white",
    softBg: "bg-violet-50 dark:bg-violet-950/40",
    softText: "text-violet-600 dark:text-violet-400",
  },
};
