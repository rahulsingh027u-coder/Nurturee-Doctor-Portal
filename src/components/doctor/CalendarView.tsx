"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DayPicker,
  type DayProps,
  getDefaultClassNames,
} from "react-day-picker";
import {
  format,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  isSameDay,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Video,
  FileText,
  CalendarX,
  Grid,
  List,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarViewProps {
  doctorId: string;
  onSelectBooking: (bookingId: string) => void;
  onNewPrescription: (bookingId: string, patientName: string) => void;
}

interface Booking {
  id: string;
  patientId?: string | null;
  patient?: { id: string; name: string; phone?: string } | null;
  serviceName: string;
  mode: string;
  date: string;
  timeSlot: string;
  status: string;
  price?: number;
  prescriptions?: unknown[];
}

interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookingId?: string | null;
}

interface DayBookingInfo {
  hasOnline: boolean;
  hasPhysical: boolean;
  count: number;
}

type ViewMode = "list" | "slots";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[11px] font-medium">
          Confirmed
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[11px] font-medium">
          Pending
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[11px] font-medium">
          Completed
        </Badge>
      );
    case "in-progress":
      return (
        <Badge className="bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-50 text-[11px] font-medium">
          In Progress
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 text-[11px] font-medium">
          Cancelled
        </Badge>
      );
    case "no-show":
      return (
        <Badge className="bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 text-[11px] font-medium">
          No Show
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[11px] font-medium">
          {status}
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Custom Day component for react-day-picker v9
// ---------------------------------------------------------------------------

function CustomDay({ date, displayMonth, ...dayProps }: DayProps) {
  const dayBookingInfo = (date as Date & { _bookingInfo?: DayBookingInfo })._bookingInfo;

  return (
    <div className="relative flex flex-col items-center w-full h-full">
      {/* Forward to original DayButton rendering */}
      <button
        {...dayProps}
        className={cn(
          "rdp-day_button size-8 p-0 font-normal text-sm inline-flex items-center justify-center rounded-md transition-colors",
          dayProps.className
        )}
      >
        {format(date, "d")}
      </button>
      {/* Dot indicators for bookings */}
      <div className="flex items-center justify-center gap-0.5 mt-0.5 h-1.5">
        {dayBookingInfo?.hasOnline && (
          <span className="size-1.5 rounded-full bg-blue-600 shrink-0" />
        )}
        {dayBookingInfo?.hasPhysical && (
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CalendarView({
  doctorId,
  onSelectBooking,
  onNewPrescription,
}: CalendarViewProps) {
  const defaultClassNames = getDefaultClassNames();

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Data state
  const [monthBookings, setMonthBookings] = useState<Booking[]>([]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // -------------------------------------------------------------------------
  // Build a map of date → booking info for the current month
  // -------------------------------------------------------------------------
  const bookingDayMap = useCallback((): Map<string, DayBookingInfo> => {
    const map = new Map<string, DayBookingInfo>();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    for (const day of days) {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayBookingsForMap = monthBookings.filter(
        (b) => b.date === dateStr && b.status !== "cancelled"
      );
      if (dayBookingsForMap.length > 0) {
        map.set(dateStr, {
          hasOnline: dayBookingsForMap.some((b) => b.mode === "online"),
          hasPhysical: dayBookingsForMap.some((b) => b.mode === "physical"),
          count: dayBookingsForMap.length,
        });
      }
    }
    return map;
  }, [currentMonth, monthBookings]);

  // -------------------------------------------------------------------------
  // Fetch month bookings (for calendar dots)
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function fetchMonthBookings() {
      setLoadingBookings(true);
      try {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const from = format(monthStart, "yyyy-MM-dd");
        const to = format(monthEnd, "yyyy-MM-dd");
        const res = await fetch(
          `/api/bookings?doctorId=${doctorId}&from=${from}&to=${to}`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setMonthBookings(Array.isArray(data) ? data : []);
        }
      } catch {
        // Silently handle
      } finally {
        if (!cancelled) setLoadingBookings(false);
      }
    }
    fetchMonthBookings();
    return () => {
      cancelled = true;
    };
  }, [doctorId, currentMonth]);

  // -------------------------------------------------------------------------
  // Fetch day bookings & time slots when selected date changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    async function fetchDayData() {
      setLoadingDay(true);
      setLoadingSlots(true);
      try {
        const [bookingsRes, slotsRes] = await Promise.all([
          fetch(`/api/bookings?doctorId=${doctorId}&date=${dateStr}`),
          fetch(`/api/analytics?doctorId=${doctorId}&date=${dateStr}`),
        ]);

        if (bookingsRes.ok && !cancelled) {
          const data = await bookingsRes.json();
          setDayBookings(Array.isArray(data) ? data : []);
        }
        if (slotsRes.ok && !cancelled) {
          const data = await slotsRes.json();
          setTimeSlots(Array.isArray(data?.timeSlots) ? data.timeSlots : []);
        }
      } catch {
        // Silently handle
      } finally {
        if (!cancelled) {
          setLoadingDay(false);
          setLoadingSlots(false);
        }
      }
    }
    fetchDayData();
    return () => {
      cancelled = true;
    };
  }, [doctorId, selectedDate]);

  // -------------------------------------------------------------------------
  // Navigation handlers
  // -------------------------------------------------------------------------
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  }, []);

  // -------------------------------------------------------------------------
  // Build booking info map for custom day rendering
  // -------------------------------------------------------------------------
  const dayMap = bookingDayMap();

  // -------------------------------------------------------------------------
  // Find booking for a time slot
  // -------------------------------------------------------------------------
  function getBookingForSlot(slot: TimeSlot): Booking | undefined {
    if (!slot.bookingId) return undefined;
    return dayBookings.find((b) => b.id === slot.bookingId);
  }

  // -------------------------------------------------------------------------
  // Check if a completed booking has no prescription
  // -------------------------------------------------------------------------
  function needsPrescription(booking: Booking): boolean {
    if (booking.status !== "completed") return false;
    return (
      !booking.prescriptions || (Array.isArray(booking.prescriptions) && booking.prescriptions.length === 0)
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-blue-100">
            <CalendarDays className="size-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Calendar</h2>
            <p className="text-sm text-muted-foreground">
              Manage your appointments & schedule
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={cn(
              "h-8 gap-1.5 text-xs",
              viewMode === "list" && "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
            )}
          >
            <List className="size-3.5" />
            List
          </Button>
          <Button
            variant={viewMode === "slots" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("slots")}
            className={cn(
              "h-8 gap-1.5 text-xs",
              viewMode === "slots" && "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
            )}
          >
            <Grid className="size-3.5" />
            Slots
          </Button>
        </div>
      </div>

      {/* Main layout: Calendar + Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Card */}
        <Card className="lg:col-span-5 border-0 shadow-md">
          <CardHeader className="pb-0">
            {/* Custom navigation bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="size-8 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <h3 className="text-base font-semibold min-w-[160px] text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  className="size-8 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-8 text-xs rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              >
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            {loadingBookings ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Skeleton className="h-[260px] w-full rounded-lg" />
              </div>
            ) : (
              <>
                <style>{`
                /* ── Rose-themed DayPicker overrides ── */
                .rdp-root {
                  --rdp-accent-color: rgb(225 29 72);
                  --rdp-accent-background-color: rgb(254 205 211);
                  --rdp-today-color: rgb(225 29 72);
                  margin: 0;
                  width: 100%;
                }

                /* Month grid */
                .rdp-month_grid {
                  border-collapse: separate;
                  border-spacing: 0;
                  width: 100%;
                }

                /* Weekday headers */
                .rdp-weekday {
                  font-size: 0.75rem;
                  font-weight: 600;
                  color: rgb(107 114 128);
                  padding: 0.25rem 0;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  text-align: center;
                }
                .rdp-weekdays {
                  margin-bottom: 0.25rem;
                }

                /* Day cell */
                .rdp-day {
                  padding: 0.125rem;
                  position: relative;
                }
                .rdp-day_button {
                  position: relative;
                  z-index: 1;
                }

                /* Today */
                .rdp-today .rdp-day_button {
                  background-color: rgb(254 205 211 / 0.5);
                  color: rgb(225 29 72);
                  font-weight: 700;
                }

                /* Selected */
                .rdp-selected .rdp-day_button {
                  background-color: rgb(225 29 72);
                  color: white;
                  font-weight: 600;
                  box-shadow: 0 0 0 2px rgb(225 29 72 / 0.3);
                }
                .rdp-selected.rdp-today .rdp-day_button {
                  background-color: rgb(225 29 72);
                  color: white;
                }

                /* Outside days */
                .rdp-outside .rdp-day_button {
                  color: rgb(209 213 219);
                }

                /* Focused */
                .rdp-focused .rdp-day_button {
                  outline: 2px solid rgb(225 29 72);
                  outline-offset: -2px;
                }

                /* Hover */
                .rdp-day_button:not(.rdp-selected):not(.rdp-disabled):hover {
                  background-color: rgb(254 205 211 / 0.4);
                  color: rgb(190 18 60);
                }

                /* Nav buttons (hidden – using custom nav) */
                .rdp-nav {
                  display: none;
                }

                /* Caption (hidden – using custom nav) */
                .rdp-month_caption {
                  display: none;
                }

                /* Dot container height compensation */
                .rdp-week {
                  min-height: 2.75rem;
                }
              `}</style>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                showOutsideDays
                fixedWeeks
                components={{
                  Day: (props: DayProps) => {
                    if (!props.date || isNaN(props.date.getTime())) return null;
                    const dateStr = format(props.date, "yyyy-MM-dd");
                    const info = dayMap.get(dateStr);
                    // Attach booking info to the date for the custom renderer
                    const enrichedDate = Object.assign(props.date, {
                      _bookingInfo: info || undefined,
                    }) as Date & { _bookingInfo?: DayBookingInfo };
                    return (
                      <CustomDay
                        {...props}
                        date={enrichedDate}
                      />
                    );
                  },
                }}
                classNames={{
                  root: defaultClassNames.root,
                  months: "flex flex-col",
                  month: "space-y-1",
                  weekdays: defaultClassNames.weekdays,
                  weekday: defaultClassNames.weekday,
                  week: defaultClassNames.week,
                  weeks: defaultClassNames.weeks,
                  month_grid: defaultClassNames.month_grid,
                }}
              />
              </>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-5 mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-600" />
                <span className="text-[11px] text-muted-foreground">Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-muted-foreground">Physical</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Panel */}
        <div className="lg:col-span-7">
          <Card className="border-0 shadow-md h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {selectedDate ? (
                    <>
                      Appointments for{" "}
                      <span className="text-blue-700">
                        {isToday(selectedDate)
                          ? "Today"
                          : format(selectedDate, "EEE, MMM d, yyyy")}
                      </span>
                    </>
                  ) : (
                    "Select a date"
                  )}
                </CardTitle>
                {selectedDate && (
                  <Badge variant="outline" className="text-xs font-medium border-blue-200 text-blue-700 bg-blue-50">
                    {dayBookings.filter((b) => b.status !== "cancelled").length} appointment
                    {dayBookings.filter((b) => b.status !== "cancelled").length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Loading skeleton */}
              {loadingDay && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/30"
                    >
                      <Skeleton className="h-12 w-20 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loadingDay && selectedDate && dayBookings.length === 0 && viewMode === "list" && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex items-center justify-center size-16 rounded-2xl bg-blue-50 mb-4">
                    <CalendarX className="size-8 text-blue-300" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    No appointments for this day
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    You have no scheduled appointments on{" "}
                    {format(selectedDate, "MMM d, yyyy")}
                  </p>
                </div>
              )}

              {/* List View */}
              {!loadingDay && viewMode === "list" && dayBookings.length > 0 && (
                <ScrollArea className="max-h-[480px]">
                  <div className="space-y-3 pr-3">
                    {dayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="group relative flex items-stretch gap-4 p-4 rounded-xl border border-border/50 bg-card hover:shadow-md hover:border-blue-200/50 transition-all duration-200 cursor-pointer"
                        onClick={() => onSelectBooking(booking.id)}
                      >
                        {/* Time slot column */}
                        <div className="flex flex-col items-center justify-center min-w-[72px] bg-blue-50 rounded-lg px-3 py-2">
                          <Clock className="size-3.5 text-blue-600 mb-1" />
                          <span className="text-sm font-bold text-blue-800 leading-tight">
                            {booking.timeSlot || "N/A"}
                          </span>
                        </div>

                        {/* Info column */}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-base font-semibold text-foreground truncate">
                              {booking.patient?.name || "Unknown Patient"}
                            </span>
                            {/* Mode badge */}
                            <Badge
                              className={cn(
                                "text-[10px] font-semibold px-1.5 py-0",
                                booking.mode === "online"
                                  ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              )}
                            >
                              {booking.mode === "online" ? (
                                <Video className="size-2.5 mr-0.5" />
                              ) : (
                                <Stethoscope className="size-2.5 mr-0.5" />
                              )}
                              {booking.mode === "online" ? "Online" : "Physical"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {booking.serviceName || "Consultation"}
                          </p>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(booking.status)}

                            {booking.mode === "online" && booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[11px] gap-1 px-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectBooking(booking.id);
                                }}
                              >
                                <Video className="size-3" />
                                Start Video Call
                              </Button>
                            )}

                            {needsPrescription(booking) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[11px] gap-1 px-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNewPrescription(
                                    booking.id,
                                    booking.patient?.name || "Unknown"
                                  );
                                }}
                              >
                                <FileText className="size-3" />
                                Write Rx
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center">
                          <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Slots View */}
              {!loadingSlots && viewMode === "slots" && (
                <ScrollArea className="max-h-[480px]">
                  {timeSlots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex items-center justify-center size-16 rounded-2xl bg-blue-50 mb-4">
                        <CalendarX className="size-8 text-blue-300" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        No time slots configured
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[200px]">
                        Time slots are not set up for this date
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pr-3">
                      {timeSlots.map((slot) => {
                        const booking = getBookingForSlot(slot);
                        const isAvailable = !slot.isBooked || !booking;

                        return (
                          <div
                            key={slot.id}
                            className={cn(
                              "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 min-h-[72px]",
                              isAvailable
                                ? "border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                                : "border-solid border-blue-300 bg-blue-100/50 cursor-pointer hover:shadow-md"
                            )}
                            onClick={() => {
                              if (booking) onSelectBooking(booking.id);
                            }}
                          >
                            <Clock className="size-3.5 text-muted-foreground mb-1" />
                            <span className="text-xs font-bold text-foreground">
                              {slot.startTime}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {slot.endTime}
                            </span>
                            {booking && (
                              <div className="mt-1.5 text-center">
                                <p className="text-[10px] font-medium text-blue-800 truncate max-w-[80px]">
                                  {booking.patient?.name || "Booked"}
                                </p>
                              </div>
                            )}
                            {isAvailable && (
                              <span className="text-[9px] font-medium text-blue-500 mt-1">
                                Available
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}export { CalendarView };
