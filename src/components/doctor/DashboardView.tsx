"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  IndianRupee,
  Users,
  FileText,
  Clock,
  Video,
  ArrowRight,
  Stethoscope,
  PenTool,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardViewProps {
  doctorId: string;
  doctorName?: string;
  doctorSpecialization?: string;
  onViewPatients: () => void;
  onViewCalendar: () => void;
  onViewPrescriptions: (bookingId: string, patientName: string) => void;
}

interface AnalyticsSummary {
  todayAppointments: number;
  weekEarnings: number;
  totalPatients: number;
  pendingPrescriptions: number;
}

interface MonthlyRevenue {
  month: string;
  earnings: number;
  appointments: number;
  online: number;
  offline: number;
}

interface UpcomingBooking {
  id: string;
  patient?: { id: string; name: string } | null;
  serviceName: string;
  mode: string;
  date: string;
  timeSlot: string;
  status: string;
}

interface TodaysBooking {
  id: string;
  patient?: { id: string; name: string } | null;
  serviceName: string;
  mode: string;
  date: string;
  timeSlot: string;
  status: string;
  prescriptions?: unknown[];
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  monthlyRevenue: MonthlyRevenue[];
  upcomingBookings: UpcomingBooking[];
  todaysBookings: TodaysBooking[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "in-progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "cancelled":
    case "no-show":
      return "bg-red-100 text-red-700 border-red-200";
    case "pending":
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "in-progress":
      return "In Progress";
    case "no-show":
      return "No Show";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// ===========================================================================
// Component
// ===========================================================================

export default function DashboardView({
  doctorId,
  doctorName = "Doctor",
  doctorSpecialization = "General Physician",
  onViewPatients,
  onViewCalendar,
  onViewPrescriptions,
}: DashboardViewProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    if (!doctorId) return;

    let cancelled = false;

    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics?doctorId=${encodeURIComponent(doctorId)}`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        if (!cancelled) {
          setAnalytics(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard analytics fetch error:", err);
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  // =======================================================================
  // Loading Skeleton
  // =======================================================================

  if (loading || !analytics) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        {/* Welcome skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-1.5 w-full max-w-xs rounded-full" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>

        {/* Two-column skeleton */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>

        {/* Schedule skeleton */}
        <Skeleton className="h-6 w-40" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        {/* Chart skeleton */}
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  // =======================================================================
  // Render
  // =======================================================================

  const { summary, monthlyRevenue, upcomingBookings, todaysBookings } = analytics;

  // Stats card definitions
  const statsCards = [
    {
      label: "Today's Appointments",
      value: summary.todayAppointments,
      sublabel: "today",
      icon: Calendar,
      colorClass: "bg-blue-600",
      lightBg: "bg-blue-50",
      textColor: "text-blue-700",
      onClick: onViewCalendar,
    },
    {
      label: "This Week's Earnings",
      value: formatCurrency(summary.weekEarnings),
      sublabel: "this week",
      icon: IndianRupee,
      colorClass: "bg-emerald-500",
      lightBg: "bg-emerald-50",
      textColor: "text-emerald-600",
      onClick: onViewCalendar,
    },
    {
      label: "Total Patients",
      value: summary.totalPatients,
      sublabel: "total",
      icon: Users,
      colorClass: "bg-violet-500",
      lightBg: "bg-violet-50",
      textColor: "text-violet-600",
      onClick: onViewPatients,
    },
    {
      label: "Pending Prescriptions",
      value: summary.pendingPrescriptions,
      sublabel: "pending",
      icon: FileText,
      colorClass: "bg-amber-500",
      lightBg: "bg-amber-50",
      textColor: "text-amber-600",
      onClick: onViewCalendar,
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* ================================================================ */}
      {/* 1. Welcome Header                                                */}
      {/* ================================================================ */}
      <section aria-label="Welcome header">
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
          {/* Rose gradient accent bar */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />

          <div className="flex flex-col gap-1 p-5 pt-5 md:flex-row md:items-center md:justify-between md:p-6 md:pt-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {getGreeting()}, Dr. {doctorName}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{formatTodayDate()}</p>
              <p className="mt-0.5 text-xs font-medium text-blue-600">
                {doctorSpecialization}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 md:mt-0">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">
                  {summary.todayAppointments > 0
                    ? `${summary.todayAppointments} appointment${summary.todayAppointments > 1 ? "s" : ""} today`
                    : "No appointments today"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2. Stats Cards (2x2 mobile, 4 cols desktop)                     */}
      {/* ================================================================ */}
      <section aria-label="Statistics overview">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.label}
                className="relative overflow-hidden border-gray-100 shadow-sm py-5 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] transition-transform"
                onClick={card.onClick}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500">
                        {card.label}
                      </p>
                      <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                        {card.value}
                      </p>
                      <p className="text-[11px] text-gray-400">{card.sublabel}</p>
                    </div>
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
                        card.colorClass
                      )}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. Two-Column: Upcoming Appointments + Quick Actions              */}
      {/* ================================================================ */}
      <section aria-label="Upcoming appointments and quick actions">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left: Upcoming Appointments */}
          <Card className="lg:col-span-2 border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Upcoming Appointments
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                onClick={onViewCalendar}
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-gray-100">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-600">
                    No upcoming appointments
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Your upcoming bookings will appear here
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/30 sm:p-4"
                    >
                      {/* Time badge */}
                      <div className="flex flex-col items-center shrink-0 rounded-lg bg-gray-50 px-2.5 py-1.5 sm:px-3 sm:py-2">
                        <Clock className="mb-1 h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[11px] font-semibold text-gray-700 sm:text-xs">
                          {booking.timeSlot}
                        </span>
                      </div>

                      {/* Patient info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {booking.patient?.name ?? "Unknown Patient"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {booking.serviceName}
                        </p>
                        {/* Mode badge */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-1.5 text-[10px] font-medium px-1.5 py-0",
                            booking.mode === "online"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          )}
                        >
                          {booking.mode === "online" ? (
                            <Video className="mr-1 h-2.5 w-2.5" />
                          ) : (
                            <Stethoscope className="mr-1 h-2.5 w-2.5" />
                          )}
                          {booking.mode === "online" ? "Online" : "Physical"}
                        </Badge>
                      </div>

                      {/* View button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 h-8 gap-1 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        onClick={() =>
                          onViewPrescriptions(
                            booking.id,
                            booking.patient?.name ?? "Unknown Patient"
                          )
                        }
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Quick Actions */}
          <div className="space-y-4">
            <Card className="border-gray-100 shadow-sm py-5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* New Prescription */}
                <button
                  onClick={() => onViewPrescriptions("", "")}
                  className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 p-3.5 text-left text-white shadow-sm transition-all hover:shadow-md hover:from-blue-700 hover:to-indigo-600 active:scale-[0.98]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <PenTool className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">New Prescription</p>
                    <p className="text-[11px] text-blue-100">
                      Write a new prescription
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-70" />
                </button>

                {/* View Calendar */}
                <button
                  onClick={onViewCalendar}
                  className="flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-left transition-all hover:bg-blue-100/60 hover:border-blue-300 active:scale-[0.98]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      View Calendar
                    </p>
                    <p className="text-[11px] text-blue-600">
                      Manage your schedule
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-blue-400" />
                </button>

                {/* Patient Directory */}
                <button
                  onClick={onViewPatients}
                  className="flex w-full items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3.5 text-left transition-all hover:bg-violet-100/60 hover:border-violet-300 active:scale-[0.98]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-violet-900">
                      Patient Directory
                    </p>
                    <p className="text-[11px] text-violet-600">
                      Browse all patients
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-violet-400" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 4. Today's Schedule (Timeline)                                    */}
      {/* ================================================================ */}
      <section aria-label="Today's schedule">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              Today&apos;s Schedule
            </CardTitle>
            <Badge variant="outline" className="text-[11px] font-normal text-gray-500 border-gray-200">
              <Clock className="mr-1 h-3 w-3" />
              {todaysBookings.length} booking{todaysBookings.length !== 1 ? "s" : ""}
            </Badge>
          </CardHeader>
          <CardContent className="pt-0">
            {todaysBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-gray-100">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-600">
                  No bookings scheduled for today
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Take some time to relax or review past prescriptions
                </p>
              </div>
            ) : (
              <div className="relative max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {/* Vertical timeline line */}
                <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gray-200" />

                <div className="space-y-4">
                  {todaysBookings.map((booking, idx) => {
                    const isLast = idx === todaysBookings.length - 1;
                    const hasPrescription =
                      booking.prescriptions && booking.prescriptions.length > 0;
                    const needsPrescription =
                      booking.status === "completed" && !hasPrescription;

                    return (
                      <div key={booking.id} className="relative flex gap-4">
                        {/* Timeline dot + time */}
                        <div className="relative z-10 flex flex-col items-center shrink-0 w-[44px]">
                          <div
                            className={cn(
                              "flex size-[10px] rounded-full border-2 border-white shadow-sm mt-1",
                              booking.status === "completed"
                                ? "bg-emerald-500"
                                : booking.status === "in-progress"
                                  ? "bg-blue-600 animate-pulse"
                                  : booking.status === "cancelled"
                                    ? "bg-red-400"
                                    : booking.status === "confirmed"
                                      ? "bg-blue-500"
                                      : "bg-amber-400"
                            )}
                          />
                          <span className="mt-1.5 text-[11px] font-semibold text-gray-600 whitespace-nowrap">
                            {booking.timeSlot?.split(" - ")[0] ?? ""}
                          </span>
                        </div>

                        {/* Patient card */}
                        <div
                          className={cn(
                            "flex-1 rounded-xl border p-3 sm:p-4 transition-colors",
                            isLast ? "" : "mb-0",
                            booking.status === "cancelled"
                              ? "border-red-100 bg-red-50/30 opacity-70"
                              : booking.status === "in-progress"
                                ? "border-blue-200 bg-blue-50/40 ring-1 ring-blue-200/50"
                                : "border-gray-100 bg-white hover:border-gray-200"
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">
                                  {booking.patient?.name ?? "Unknown Patient"}
                                </p>
                                {/* Status badge */}
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-medium px-1.5 py-0",
                                    getStatusBadgeClasses(booking.status)
                                  )}
                                >
                                  {getStatusLabel(booking.status)}
                                </Badge>
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                  <Stethoscope className="h-3 w-3 text-gray-400" />
                                  {booking.serviceName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-medium px-1.5 py-0",
                                    booking.mode === "online"
                                      ? "border-blue-200 bg-blue-50 text-blue-600"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-600"
                                  )}
                                >
                                  {booking.mode === "online" ? (
                                    <Video className="mr-0.5 h-2.5 w-2.5" />
                                  ) : (
                                    <Stethoscope className="mr-0.5 h-2.5 w-2.5" />
                                  )}
                                  {booking.mode === "online" ? "Online" : "Physical"}
                                </Badge>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  {booking.timeSlot}
                                </span>
                              </div>
                            </div>

                            {/* Action button */}
                            {needsPrescription && (
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-xs font-medium text-white shadow-sm hover:from-blue-700 hover:to-indigo-600 shrink-0"
                                onClick={() =>
                                  onViewPrescriptions(
                                    booking.id,
                                    booking.patient?.name ?? "Unknown Patient"
                                  )
                                }
                              >
                                <PenTool className="h-3 w-3" />
                                Write Prescription
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ================================================================ */}
      {/* 5. Revenue Chart (Area Chart - last 6 months)                   */}
      {/* ================================================================ */}
      <section aria-label="Revenue chart">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              Revenue Overview
            </CardTitle>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyRevenue}
                  margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(val: number) =>
                      val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : String(val)
                    }
                    dx={-4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                    labelStyle={{
                      fontWeight: 600,
                      color: "#1f2937",
                      marginBottom: "4px",
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Earnings",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#fb7185"
                    strokeWidth={2.5}
                    fill="url(#roseGradient)"
                    dot={{ r: 4, fill: "#fb7185", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{
                      r: 6,
                      fill: "#e11d48",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
export { DashboardView };
