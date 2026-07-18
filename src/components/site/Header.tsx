"use client";

import { CalendarDays, CircleUser, Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { AppView } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { view: AppView; label: string }[] = [
  { view: "home", label: "Home" },
  { view: "childcare", label: "Child Care" },
  { view: "eldercare", label: "Elder Care" },
  { view: "doctor", label: "Doctor" },
  { view: "verification", label: "Verification" },
];

export function Header() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const bookings = useAppStore((s) => s.bookings);
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (v: AppView) => {
    setView(v);
    setMobileOpen(false);
  };

  const activeBookings = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "completed"
  ).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
        {/* Logo */}
        <button
          onClick={() => go("home")}
          className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-blue-50 active:bg-blue-100"
          aria-label="Nurturee Home"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Nurtur<span className="text-indigo-600">ee</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => go(item.view)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                view === item.view
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => go("bookings")}
            className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 touch-manipulation text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
            aria-label="My Bookings"
          >
            <CalendarDays className="size-4" />
            <span className="hidden sm:inline">Bookings</span>
            {activeBookings > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {activeBookings}
              </span>
            )}
          </button>
          <button
            onClick={() => go("documents")}
            className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 touch-manipulation text-muted-foreground hover:bg-blue-50 hover:text-blue-700"
            aria-label="My Documents"
          >
            <span className="hidden sm:inline">Documents</span>
            <CircleUser className="size-5" />
          </button>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="ml-1 flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-blue-50 hover:text-blue-700 md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="border-t border-border/40 bg-white px-4 py-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => go(item.view)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                view === item.view
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              )}
            >
              <Home className="size-4 opacity-50" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
