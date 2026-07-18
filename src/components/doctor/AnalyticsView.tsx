"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  Calendar,
  Clock,
  Video,
  Phone,
  BarChart3,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_COLORS = ["#f43f5e", "#38bdf8", "#8b5cf6", "#10b981", "#f59e0b", "#6366f1"];

const GENDER_COLORS: Record<string, string> = {
  Male: "#38bdf8",
  Female: "#f43f5e",
  Other: "#9ca3af",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsViewProps {
  doctorId: string;
}

interface MonthlyRevenue {
  month: string;
  earnings: number;
  appointments: number;
}

interface RecentPayment {
  id: string;
  date: string;
  patientName: string;
  service: string;
  mode: "online" | "physical";
  amount: number;
  status: "Completed" | "Pending" | "Refunded";
}

interface NewPatientEntry {
  month: string;
  count: number;
}

interface GenderDistribution {
  gender: string;
  count: number;
  percentage: number;
}

interface PeakHour {
  hour: string;
  bookings: number;
}

interface AppointmentStats {
  totalAppointments: number;
  onlineCount: number;
  offlineCount: number;
  cancelledCount: number;
  completedOnlineCount: number;
  averageCallDurationMinutes: number;
}

interface AnalyticsData {
  monthlyRevenue: MonthlyRevenue[];
  recentPayments: RecentPayment[];
  newPatientsMonthly: NewPatientEntry[];
  genderDistribution: GenderDistribution[];
  peakHours: PeakHour[];
  appointmentStats: AppointmentStats;
}

type SortField = "date" | "amount" | "patientName" | "service";
type SortDirection = "asc" | "desc";

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getModeBadge(mode: string) {
  if (mode === "online") {
    return (
      <Badge
        variant="outline"
        className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100"
      >
        <Video className="mr-1 h-3 w-3" />
        Online
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
    >
      <Phone className="mr-1 h-3 w-3" />
      Physical
    </Badge>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Completed":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
        >
          Completed
        </Badge>
      );
    case "Pending":
      return (
        <Badge
          variant="outline"
          className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
        >
          Pending
        </Badge>
      );
    case "Refunded":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
        >
          Refunded
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Custom Recharts Tooltips
// ---------------------------------------------------------------------------

interface RevenueTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { month: string; earnings: number } }>;
  label?: string;
}

function RevenueTooltip({ active, payload, label }: RevenueTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm font-bold text-blue-700">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

interface PatientTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function PatientTooltip({ active, payload, label }: PatientTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm font-bold text-violet-600">
        {payload[0].value} new patients
      </p>
    </div>
  );
}

interface PeakHourTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function PeakHourTooltip({ active, payload, label }: PeakHourTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm font-bold text-sky-600">
        {payload[0].value} bookings
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Pie Label
// ---------------------------------------------------------------------------

interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percentage: number;
  name: string;
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percentage,
  name,
}: PieLabelProps) {
  if (percentage == null || isNaN(percentage)) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percentage < 5) return null;

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium fill-foreground"
    >
      {name} ({percentage.toFixed(0)}%)
    </text>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section 1 skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Section 2 skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>

      {/* Section 3 skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </div>
      </div>

      {/* Section 4 skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}

// ===========================================================================
// Main Component
// ===========================================================================

export default function AnalyticsView({ doctorId }: AnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table sort state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/analytics?doctorId=${encodeURIComponent(doctorId)}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ---------------------------------------------------------------------------
  // Sorting logic
  // ---------------------------------------------------------------------------

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedPayments = data
    ? [...data.recentPayments].sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "date":
            cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case "amount":
            cmp = a.amount - b.amount;
            break;
          case "patientName":
            cmp = a.patientName.localeCompare(b.patientName);
            break;
          case "service":
            cmp = a.service.localeCompare(b.service);
            break;
        }
        return sortDirection === "asc" ? cmp : -cmp;
      })
    : [];

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const totalRevenue =
    data?.monthlyRevenue.reduce((sum, m) => sum + m.earnings, 0) ?? 0;
  const avgMonthly =
    data?.monthlyRevenue.length
      ? totalRevenue / data.monthlyRevenue.length
      : 0;
  const bestMonth =
    data?.monthlyRevenue.reduce(
      (best, m) => (m.earnings > best.earnings ? m : best),
      { month: "—", earnings: 0, appointments: 0 }
    ) ?? { month: "—", earnings: 0, appointments: 0 };

  const totalPayments = data
    ? data.recentPayments.reduce((sum, p) => sum + p.amount, 0)
    : 0;
  const totalPlatformFee = data
    ? data.recentPayments.reduce((sum, p) => sum + p.amount * 0.1, 0)
    : 0;
  const totalNetPayout = totalPayments - totalPlatformFee;

  const stats = data?.appointmentStats;

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="rounded-full bg-blue-100 p-4">
          <BarChart3 className="h-8 w-8 text-blue-600" />
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading || !data) {
    return <AnalyticsSkeleton />;
  }

  // ---------------------------------------------------------------------------
  // Peak hours data with max for gradient
  // ---------------------------------------------------------------------------

  const peakMax = Math.max(...data.peakHours.map((h) => h.bookings), 1);

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div className="space-y-8 pb-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comprehensive insights into your practice performance
        </p>
      </div>

      {/* ================================================================= */}
      {/* Section 1: Revenue Overview                                       */}
      {/* ================================================================= */}
      <section aria-labelledby="revenue-heading">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <CardTitle id="revenue-heading" className="text-lg">
                  Revenue Overview
                </CardTitle>
                <CardDescription>Monthly earnings over the last 6 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bar Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthlyRevenue}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                  <Bar
                    dataKey="earnings"
                    fill="#fb7185"
                    hoverFill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="border-none bg-blue-50/60 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-blue-700/80 uppercase tracking-wider">
                      Total Revenue (6 months)
                    </p>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-blue-800">
                    {formatCurrency(totalRevenue)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none bg-blue-50/60 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-blue-700/80 uppercase tracking-wider">
                      Average Monthly
                    </p>
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-blue-800">
                    {formatCurrency(avgMonthly)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none bg-blue-50/60 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-blue-700/80 uppercase tracking-wider">
                      Best Month
                    </p>
                    <ArrowUpRight className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-blue-800">
                    {formatCurrency(bestMonth.earnings)}
                  </p>
                  <p className="mt-0.5 text-xs text-blue-600">{bestMonth.month}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ================================================================= */}
      {/* Section 2: Earnings Breakdown Table                               */}
      {/* ================================================================= */}
      <section aria-labelledby="earnings-heading">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <IndianRupee className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <CardTitle id="earnings-heading" className="text-lg">
                  Earnings Breakdown
                </CardTitle>
                <CardDescription>
                  Recent payment transactions with platform fee deductions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("date")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Date
                        {sortField === "date" &&
                          (sortDirection === "asc" ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          ))}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("patientName")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Patient
                        {sortField === "patientName" &&
                          (sortDirection === "asc" ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          ))}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("service")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Service
                        {sortField === "service" &&
                          (sortDirection === "asc" ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          ))}
                      </span>
                    </TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => handleSort("amount")}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        Amount
                        {sortField === "amount" &&
                          (sortDirection === "asc" ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          ))}
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Platform Fee (10%)</TableHead>
                    <TableHead className="text-right">Net Payout</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.map((payment) => {
                    const fee = payment.amount * 0.1;
                    const net = payment.amount - fee;
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(payment.date)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.patientName}
                        </TableCell>
                        <TableCell>{payment.service}</TableCell>
                        <TableCell>{getModeBadge(payment.mode)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          -{formatCurrency(fee)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {formatCurrency(net)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-semibold">
                    <TableCell colSpan={4} className="text-foreground">
                      Total
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatCurrency(totalPayments)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -{formatCurrency(totalPlatformFee)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(totalNetPayout)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      {/* ================================================================= */}
      {/* Section 3: Patient Analytics                                      */}
      {/* ================================================================= */}
      <section aria-labelledby="patients-heading">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <CardTitle id="patients-heading" className="text-lg">
                  Patient Analytics
                </CardTitle>
                <CardDescription>
                  New patient trends and demographics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* New Patients Line Chart */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  New Patients per Month
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.newPatientsMonthly}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        allowDecimals={false}
                        className="text-muted-foreground"
                      />
                      <Tooltip content={<PatientTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gender Distribution Pie Chart */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  Gender Distribution
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.genderDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="gender"
                        label={renderPieLabel}
                        labelLine={false}
                      >
                        {data.genderDistribution.map((entry) => (
                          <Cell
                            key={entry.gender}
                            fill={GENDER_COLORS[entry.gender] ?? "#9ca3af"}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="mt-2 flex flex-wrap justify-center gap-4">
                  {data.genderDistribution.map((entry) => {
                    const total = data.genderDistribution.reduce((s: number, e: { count: number }) => s + e.count, 0);
                    const pct = total > 0 ? (entry.count / total) * 100 : 0;
                    return (
                      <div key={entry.gender} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: GENDER_COLORS[entry.gender] ?? "#9ca3af" }}
                        />
                        {entry.gender} ({pct.toFixed(0)}%)
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ================================================================= */}
      {/* Section 4: Appointment Analytics                                  */}
      {/* ================================================================= */}
      <section aria-labelledby="appointments-heading">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <CardTitle id="appointments-heading" className="text-lg">
                  Appointment Analytics
                </CardTitle>
                <CardDescription>
                  Booking patterns and consultation metrics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Cards 2x2 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Total Appointments */}
              <Card className="border-none bg-blue-50/60 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Calendar className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700/80 uppercase tracking-wider">
                        Total Appointments
                      </p>
                      <p className="mt-0.5 text-2xl font-bold text-blue-800">
                        {stats?.totalAppointments ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Online vs Offline */}
              <Card className="border-none bg-sky-50/60 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                      <Video className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider">
                        Online vs Offline
                      </p>
                      <p className="mt-0.5 text-2xl font-bold text-sky-700">
                        {stats?.onlineCount ?? 0} / {stats?.offlineCount ?? 0}
                      </p>
                      {/* Mini progress bar */}
                      {stats && (
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all"
                            style={{
                              width: `${
                                stats.totalAppointments
                                  ? (stats.onlineCount / stats.totalAppointments) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      )}
                      {stats && stats.totalAppointments > 0 && (
                        <div className="mt-1 flex justify-between text-[10px] text-sky-500">
                          <span>
                            Online{" "}
                            {((stats.onlineCount / stats.totalAppointments) * 100).toFixed(0)}%
                          </span>
                          <span>
                            Offline{" "}
                            {((stats.offlineCount / stats.totalAppointments) * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cancellation Rate */}
              <Card className="border-none bg-amber-50/60 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                      <TrendingDown className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-600/80 uppercase tracking-wider">
                        Cancellation Rate
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <p className="mt-0.5 text-2xl font-bold text-amber-700">
                          {stats && stats.totalAppointments > 0
                            ? ((stats.cancelledCount / stats.totalAppointments) * 100).toFixed(
                                1
                              )
                            : "0.0"}
                          %
                        </p>
                        {stats && stats.totalAppointments > 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              stats.cancelledCount / stats.totalAppointments > 0.15
                                ? "bg-red-100 text-red-600 border-red-200"
                                : "bg-emerald-100 text-emerald-600 border-emerald-200"
                            )}
                          >
                            {stats.cancelledCount / stats.totalAppointments > 0.15
                              ? "High"
                              : "Normal"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Avg Call Duration */}
              <Card className="border-none bg-violet-50/60 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                      <Clock className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-violet-600/80 uppercase tracking-wider">
                        Avg Call Duration
                      </p>
                      <p className="mt-0.5 text-2xl font-bold text-violet-700">
                        {stats?.averageCallDurationMinutes ?? 0} min
                      </p>
                      <p className="text-[10px] text-violet-400">From completed online bookings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Peak Hours Bar Chart */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Peak Booking Hours
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.peakHours}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                      className="text-muted-foreground"
                    />
                    <Tooltip content={<PeakHourTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                    <Bar dataKey="bookings" radius={[4, 4, 0, 0]} maxBarSize={36}>
                      {data.peakHours.map((entry, index) => {
                        const intensity = entry.bookings / peakMax;
                        // Gradient from blue (#38bdf8) to rose (#f43f5e)
                        const r = Math.round(56 + (244 - 56) * intensity);
                        const g = Math.round(189 + (63 - 189) * intensity);
                        const b = Math.round(248 + (94 - 248) * intensity);
                        return (
                          <Cell
                            key={`peak-${index}`}
                            fill={`rgb(${r}, ${g}, ${b})`}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}export { AnalyticsView };
