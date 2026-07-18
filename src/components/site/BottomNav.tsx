"use client";

import { CalendarDays, FileText, Home, Stethoscope, Users } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { AppView } from "@/lib/types";
import { cn } from "@/lib/utils";

const ITEMS: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: "home", label: "Home", icon: Home },
  { view: "childcare", label: "Child", icon: Users },
  { view: "eldercare", label: "Elder", icon: Stethoscope },
  { view: "bookings", label: "Bookings", icon: CalendarDays },
  { view: "documents", label: "Docs", icon: FileText },
];

export function BottomNav() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  // Hide bottom nav on caregiver profile view (full focus)
  if (view === "caregiver-profile" || view === "doctor" || view === "verification") {
    // Still show on doctor & verification for easy nav
    if (view === "caregiver-profile") return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-white/95 backdrop-blur-lg pb-safe md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = view === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                active ? "text-blue-700" : "text-slate-500 hover:text-blue-700"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-colors",
                  active ? "bg-blue-50" : ""
                )}
              >
                <Icon className="size-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
