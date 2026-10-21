"use client";

import React, { useMemo } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  FileText,
  BarChart3,
  Video,
  Stethoscope,
  Bell,
  LogOut,
  Menu,
  ChevronRight,
  MoreHorizontal,
  UserRound,
  Shield,
  ShieldCheck,
  Building2,
  ChevronDown,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClinicDoctorInfo {
  id: string;
  name: string;
  specialization: string;
  degree: string;
  department: string;
  associationType: string;
  avatar: string | null;
}

interface ClinicContext {
  clinicId: string;
  clinicName: string;
  doctors: ClinicDoctorInfo[];
  currentDoctorId: string;
  onDoctorSwitch: (doc: ClinicDoctorInfo) => void;
}

interface DoctorLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  doctorName: string;
  doctorSpecialization: string;
  doctorAvatar?: string;
  notificationCount: number;
  onSignOut: () => void;
  permissions?: Record<string, boolean> | null;
  isStaff?: boolean;
  clinicContext?: ClinicContext | null;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  mobile?: boolean;
}

// ---------------------------------------------------------------------------
// Navigation definition
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { id: "calendar", label: "Calendar", icon: CalendarDays, mobile: true },
  { id: "patients", label: "Patients", icon: Users, mobile: true },
  { id: "prescriptions", label: "Prescriptions", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "video-call", label: "Video Call", icon: Video, mobile: true },
  { id: "staff", label: "Staff Access", icon: Shield },
  { id: "verification", label: "Verification", icon: ShieldCheck },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getPageTitle(view: string): string {
  const found = NAV_ITEMS.find((n) => n.id === view);
  return found ? found.label : "Dashboard";
}

function getAssocBadge(assocType: string) {
  switch (assocType) {
    case "part-time": return "bg-amber-100 text-amber-700 border-amber-200";
    case "locum": return "bg-orange-100 text-orange-700 border-orange-200";
    case "visiting": return "bg-cyan-100 text-cyan-700 border-cyan-200";
    case "consultant": return "bg-purple-100 text-purple-700 border-purple-200";
    default: return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
}

// ===========================================================================
// Component
// ===========================================================================

export default function DoctorLayout({
  children,
  activeView,
  onViewChange,
  doctorName,
  doctorSpecialization,
  doctorAvatar,
  notificationCount,
  onSignOut,
  permissions,
  isStaff,
  clinicContext,
}: DoctorLayoutProps) {
  const initials = useMemo(() => getInitials(doctorName), [doctorName]);
  const pageTitle = getPageTitle(activeView);

  const visibleNavItems = useMemo(() => {
    if (!permissions) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) => {
      if (item.id === "staff") return permissions.staff === true;
      if (item.id === "verification") return true; // always show for doctors
      return permissions[item.id] === true;
    });
  }, [permissions]);

  const mobileBottomItems = visibleNavItems.filter((n) => n.mobile).slice(0, 4);
  const mobileMoreItems = visibleNavItems.filter(
    (n) => !n.mobile || visibleNavItems.filter((m) => m.mobile).indexOf(n) >= 4
  );

  const renderAvatar = (size: "sm" | "md" | "lg", className?: string) => {
    const sizeClasses = { sm: "size-8", md: "size-10", lg: "size-20" };
    const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-2xl" };
    const s = sizeClasses[size];
    const ts = textSizes[size];
    return (
      <Avatar className={cn(s, className)}>
        {doctorAvatar ? (
          <img
            src={doctorAvatar}
            alt={doctorName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <AvatarFallback className={cn("bg-blue-50 text-blue-700", ts, "font-semibold")}>
            {initials}
          </AvatarFallback>
        )}
      </Avatar>
    );
  };

  const handleNav = (id: string) => () => onViewChange(id);

  const renderSidebarItem = (item: NavItem) => {
    const isActive = activeView === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={handleNav(item.id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
          isActive
            ? "bg-blue-50 font-medium text-blue-700 border-l-[3px] border-blue-600"
            : "text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent"
        )}
      >
        <Icon className={cn("size-5 shrink-0", isActive && "text-blue-700")} />
        <span>{item.label}</span>
        {isActive && <ChevronRight className="ml-auto size-4 text-blue-500" />}
      </button>
    );
  };

  const renderMobileBottomItem = (item: NavItem) => {
    const isActive = activeView === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={handleNav(item.id)}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors"
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className={cn("size-5", isActive ? "text-blue-700" : "text-gray-400")} />
        <span className={cn("text-[11px] leading-none", isActive ? "font-medium text-blue-700" : "text-gray-400")}>
          {item.label}
        </span>
      </button>
    );
  };

  const renderMobileMoreItem = (item: NavItem) => {
    const isActive = activeView === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={handleNav(item.id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
          isActive ? "bg-blue-50 font-medium text-blue-700" : "text-gray-600 hover:bg-gray-50"
        )}
      >
        <Icon className={cn("size-5 shrink-0", isActive && "text-blue-700")} />
        <span className="flex-1 text-left">{item.label}</span>
        {isActive && <div className="size-1.5 rounded-full bg-blue-600" aria-hidden="true" />}
      </button>
    );
  };

  // ── Clinic Doctor Selector (shown for clinic staff/managers) ──
  const renderClinicSelector = () => {
    if (!clinicContext || clinicContext.doctors.length <= 1) return null;
    const current = clinicContext.doctors.find(d => d.id === clinicContext.currentDoctorId);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 border-violet-200 bg-violet-50/50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 h-9"
          >
            <Building2 className="size-4" />
            <span className="hidden sm:inline-block max-w-[140px] truncate text-xs font-medium">
              {current ? `Dr. ${current.name}` : "Select Doctor"}
            </span>
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="text-xs font-semibold text-violet-600">
            {clinicContext.clinicName} ({clinicContext.doctors.length} doctors)
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {clinicContext.doctors.map((doc) => {
            const isCurrent = doc.id === clinicContext.currentDoctorId;
            return (
              <DropdownMenuItem
                key={doc.id}
                onClick={() => clinicContext.onDoctorSwitch(doc)}
                className={cn("cursor-pointer gap-3 py-2.5", isCurrent && "bg-violet-50")}
              >
                <div className={cn("flex size-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 shrink-0 overflow-hidden",
                  isCurrent && "ring-2 ring-violet-500"
                )}>
                  {doc.avatar ? (
                    <img src={doc.avatar} alt={doc.name} className="size-8 rounded-full object-cover" />
                  ) : (
                    getInitials(doc.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">Dr. {doc.name}</p>
                    {isCurrent && <Check className="size-3.5 text-violet-600" />}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    {doc.specialization}{doc.department ? ` · ${doc.department}` : ""}
                  </p>
                </div>
                <Badge className={cn("text-[10px] shrink-0", getAssocBadge(doc.associationType))}>
                  {doc.associationType}
                </Badge>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DESKTOP SIDEBAR */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-gray-200 bg-white md:flex")} aria-label="Doctor portal sidebar">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
            <Stethoscope className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-gray-900">Nurturee</span>
            <span className="text-xs font-medium text-blue-600">Doctor Portal</span>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {visibleNavItems.map(renderSidebarItem)}
        </nav>
        <Separator />
        <div className="px-4 py-4">
          {renderClinicSelector()}
          <div className="flex items-center gap-3 mt-3">
            {renderAvatar("md", "border-2 border-blue-100")}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{doctorName}</p>
              <p className="truncate text-xs text-gray-500">{doctorSpecialization}{isStaff ? " (Staff)" : ""}</p>
            </div>
          </div>
          <Button variant="ghost" className="mt-3 w-full justify-start gap-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50" size="sm" onClick={onSignOut}>
            <LogOut className="size-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
                <Menu className="size-5 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
              <div className="flex items-center gap-3 px-5 py-5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                  <Stethoscope className="size-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight text-gray-900">Nurturee</span>
                  <span className="text-xs font-medium text-blue-600">Doctor Portal</span>
                </div>
              </div>
              <Separator />
              <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Mobile navigation">
                {visibleNavItems.map(renderSidebarItem)}
              </nav>
              <Separator />
              <div className="px-4 py-4">
                {renderClinicSelector()}
                <div className="flex items-center gap-3 mt-3">
                  {renderAvatar("md", "border-2 border-blue-100")}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{doctorName}</p>
                    <p className="truncate text-xs text-gray-500">{doctorSpecialization}{isStaff ? " (Staff)" : ""}</p>
                  </div>
                </div>
                <Button variant="ghost" className="mt-3 w-full justify-start gap-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50" size="sm" onClick={onSignOut}>
                  <LogOut className="size-4" /> Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold text-gray-900 md:text-xl">{pageTitle}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Clinic doctor selector in header (desktop) */}
          <div className="hidden md:block">{renderClinicSelector()}</div>
          <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}>
            <Bell className="size-5 text-gray-600" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-blue-600 p-0 text-[10px] font-bold text-white border-2 border-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </Badge>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative flex items-center gap-2 rounded-full pl-1 pr-3 hover:bg-gray-50" aria-label="Doctor profile menu">
                {renderAvatar("sm")}
                <span className="hidden text-sm font-medium text-gray-700 sm:inline-block">{doctorName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-900">{doctorName}</p>
                  <p className="text-xs text-gray-500">{doctorSpecialization}{isStaff ? " · Staff" : ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.id} onClick={handleNav(item.id)} className={cn("cursor-pointer gap-2", activeView === item.id && "bg-blue-50 text-blue-700")}>
                    <Icon className="size-4" />{item.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} variant="destructive" className="cursor-pointer gap-2">
                <LogOut className="size-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center border-t border-gray-200 bg-white md:hidden safe-area-pb" aria-label="Mobile bottom navigation">
        {mobileBottomItems.map(renderMobileBottomItem)}
        <Sheet>
          <SheetTrigger asChild>
            <button type="button" className={cn("flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors", mobileMoreItems.some((n) => n.id === activeView) ? "text-blue-700" : "text-gray-400")} aria-label="More navigation options">
              <MoreHorizontal className="size-5" /><span className="text-[11px] leading-none">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader className="px-4 pt-2 pb-0">
              <SheetTitle className="text-left text-base font-semibold text-gray-900">More Options</SheetTitle>
            </SheetHeader>
            <div className="space-y-1 px-2 py-4">{mobileMoreItems.map(renderMobileMoreItem)}</div>
          </SheetContent>
        </Sheet>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className={cn("min-h-screen bg-gray-50 pb-20 pt-16 md:ml-[260px] md:pb-0")}>
        {children}
      </main>
    </div>
  );
}
export { DoctorLayout };
