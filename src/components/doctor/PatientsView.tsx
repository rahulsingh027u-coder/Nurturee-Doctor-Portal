"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Users,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ChevronRight,
  ArrowLeft,
  X,
  Heart,
  Clock,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PatientsViewProps {
  doctorId: string;
  onSelectPatient: (patientId: string, patientName: string) => void;
  onNewPrescription: (bookingId: string, patientName: string) => void;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  dob?: string | null;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  medicalHistory?: string | null;
  createdAt?: string | null;
  _bookingCount?: number;
  _lastVisit?: string | null;
}

interface VisitBooking {
  id: string;
  serviceName: string;
  mode: string;
  date: string;
  timeSlot: string;
  status: string;
  price: number;
  prescriptions?: { id: string }[];
}

interface PatientStats {
  total: number;
  newThisMonth: number;
  repeat: number;
}

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

function calculateAge(dob: string | null | undefined): string {
  if (!dob) return "—";
  try {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} yrs`;
  } catch {
    return "—";
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

function getModeLabel(mode: string): string {
  if (mode === "physical") return "In-Person";
  if (mode === "online") return "Online";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function getGenderLabel(gender: string | null | undefined): string {
  if (!gender) return "";
  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            accent
          )}
        >
          <Icon className="size-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="truncate text-xs font-medium text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PatientCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-blue-50 mb-4">
        <Users className="size-8 text-blue-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {search ? "No patients found" : "No patients yet"}
      </h3>
      <p className="max-w-sm text-sm text-gray-500">
        {search
          ? `No patients matching "${search}". Try a different search term.`
          : "Patients will appear here once they book their first consultation with you."}
      </p>
    </div>
  );
}

// ===========================================================================
// Main Component
// ===========================================================================

export default function PatientsView({
  doctorId,
  onSelectPatient,
  onNewPrescription,
}: PatientsViewProps) {
  // ── State ────────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stats, setStats] = useState<PatientStats>({
    total: 0,
    newThisMonth: 0,
    repeat: 0,
  });

  // Detail panel state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Visit history & medical history state
  const [visitBookings, setVisitBookings] = useState<VisitBooking[]>([]);
  const [bookingPrescriptionMap, setBookingPrescriptionMap] = useState<
    Record<string, boolean>
  >({});
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState("");
  const [savingHistory, setSavingHistory] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);

  // ── Debounced search ─────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Fetch patients ───────────────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ doctorId });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/patients?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch patients");
      const data: Patient[] = await res.json();
      setPatients(data);

      // Compute stats from data (only when no search filter)
      if (!debouncedSearch) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        setStats({
          total: data.length,
          newThisMonth: data.filter(
            (p) => p.createdAt && p.createdAt >= monthStart
          ).length,
          repeat: data.filter((p) => (p._bookingCount ?? 0) > 1).length,
        });
      }
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, debouncedSearch]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // ── Fetch visit history when a patient is selected ───────────────────────
  const fetchPatientDetails = useCallback(
    async (patient: Patient) => {
      setVisitsLoading(true);
      setSelectedPatient(patient);
      setMedicalHistory(patient.medicalHistory || "");
      setHistorySaved(false);
      setSheetOpen(true);

      try {
        // Fetch all bookings for this doctor, then filter by patientId
        const res = await fetch(
          `/api/bookings?doctorId=${encodeURIComponent(doctorId)}`
        );
        if (res.ok) {
          const allBookings: VisitBooking[] = await res.json();
          const patientBookings = allBookings.filter(
            (b) =>
              (b as unknown as { patientId?: string }).patientId === patient.id
          );
          setVisitBookings(patientBookings);
        }
      } catch {
        setVisitBookings([]);
      }

      // Fetch prescriptions to know which bookings have prescriptions
      try {
        const presRes = await fetch(
          `/api/prescriptions?doctorId=${encodeURIComponent(
            doctorId
          )}&patientId=${encodeURIComponent(patient.id)}`
        );
        if (presRes.ok) {
          const prescriptions: { bookingId?: string | null }[] =
            await presRes.json();
          const map: Record<string, boolean> = {};
          prescriptions.forEach((p) => {
            if (p.bookingId) map[p.bookingId] = true;
          });
          setBookingPrescriptionMap(map);
        }
      } catch {
        setBookingPrescriptionMap({});
      }

      setVisitsLoading(false);
    },
    [doctorId]
  );

  // ── Save medical history ─────────────────────────────────────────────────
  const handleSaveMedicalHistory = async () => {
    if (!selectedPatient) return;
    setSavingHistory(true);
    try {
      const res = await fetch(`/api/patients`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPatient.id,
          medicalHistory,
        }),
      });
      if (res.ok) {
        setHistorySaved(true);
        // Update the patient in local state
        setPatients((prev) =>
          prev.map((p) =>
            p.id === selectedPatient.id
              ? { ...p, medicalHistory }
              : p
          )
        );
        setSelectedPatient((prev) =>
          prev ? { ...prev, medicalHistory } : null
        );
        setTimeout(() => setHistorySaved(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setSavingHistory(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleViewProfile = (patient: Patient) => {
    onSelectPatient(patient.id, patient.name);
    fetchPatientDetails(patient);
  };

  const handleNewPrescription = (bookingId: string, patientName: string) => {
    onNewPrescription(bookingId, patientName);
    setSheetOpen(false);
  };

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      // Small delay so animation finishes before clearing
      setTimeout(() => {
        setSelectedPatient(null);
        setVisitBookings([]);
        setBookingPrescriptionMap({});
      }, 300);
    }
  };

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ============================================================= */}
      {/* HEADER + SEARCH                                                 */}
      {/* ============================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
            Patient Directory
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and review your patient records
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search by name or phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-white border-gray-200 focus-visible:ring-blue-300 focus-visible:border-blue-300"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* STATS ROW                                                       */}
      {/* ============================================================= */}
      {!loading && !debouncedSearch && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Patients"
            value={stats.total}
            icon={Users}
            accent="bg-gradient-to-br from-blue-600 to-indigo-500"
          />
          <StatCard
            label="New This Month"
            value={stats.newThisMonth}
            icon={User}
            accent="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
          <StatCard
            label="Repeat Patients"
            value={stats.repeat}
            icon={Heart}
            accent="bg-gradient-to-br from-amber-500 to-orange-500"
          />
        </div>
      )}

      {/* ============================================================= */}
      {/* PATIENT GRID                                                    */}
      {/* ============================================================= */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PatientCardSkeleton key={i} />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <EmptyState search={debouncedSearch} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const isFemale =
              patient.gender?.toLowerCase() === "female";
            const age = calculateAge(patient.dob);
            const bookingCount = patient._bookingCount ?? 0;

            return (
              <Card
                key={patient.id}
                className="group border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200"
              >
                <CardContent className="p-4 flex flex-col gap-4">
                  {/* ── Top row: avatar + name + badge ─────────────────── */}
                  <div className="flex items-start gap-3">
                    <Avatar className="size-12 shrink-0 border-2 border-white shadow-sm">
                      <AvatarFallback
                        className={cn(
                          "text-sm font-bold text-white",
                          isFemale
                            ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                            : "bg-gradient-to-br from-sky-400 to-blue-500"
                        )}
                      >
                        {getInitials(patient.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate leading-tight">
                        {patient.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium border-gray-200 text-gray-600 px-1.5 py-0"
                        >
                          {age !== "—" ? age : ""}
                          {age !== "—" && patient.gender ? " · " : ""}
                          {getGenderLabel(patient.gender)}
                        </Badge>
                        {bookingCount > 1 && (
                          <Badge
                            variant="outline"
                            className="text-[11px] font-medium border-blue-200 text-blue-700 bg-blue-50 px-1.5 py-0"
                          >
                            {bookingCount} visits
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Contact & location info ────────────────────────── */}
                  <div className="space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{patient.phone}</span>
                    </div>
                    {(patient.city || patient.pincode) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">
                          {[patient.city, patient.pincode]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Bottom row: last visit + button ─────────────────── */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="size-3.5" />
                      <span>
                        {patient._lastVisit
                          ? `Last: ${formatDate(patient._lastVisit)}`
                          : "No visits yet"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 h-8 text-xs font-medium px-3"
                      onClick={() => handleViewProfile(patient)}
                    >
                      View Profile
                      <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ============================================================= */}
      {/* PATIENT DETAIL SHEET (slide-in from right)                       */}
      {/* ============================================================= */}
      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 flex flex-col"
        >
          {selectedPatient && (
            <>
              {/* ── Sheet header ──────────────────────────────────────── */}
              <SheetHeader className="sr-only">
                <SheetTitle>Patient Details</SheetTitle>
              </SheetHeader>

              {/* Gradient header banner */}
              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 px-6 pt-8 pb-10">
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  aria-label="Close panel"
                >
                  <X className="size-4" />
                </button>

                <div className="flex items-center gap-4">
                  <Avatar className="size-16 border-3 border-white/30 shadow-lg">
                    <AvatarFallback
                      className={cn(
                        "text-lg font-bold text-white",
                        selectedPatient.gender?.toLowerCase() === "female"
                          ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                          : "bg-gradient-to-br from-sky-400 to-blue-500"
                      )}
                    >
                      {getInitials(selectedPatient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white min-w-0">
                    <h3 className="text-xl font-bold truncate">
                      {selectedPatient.name}
                    </h3>
                    <p className="text-blue-100 text-sm mt-0.5">
                      {calculateAge(selectedPatient.dob)}{" "}
                      {selectedPatient.gender
                        ? `· ${getGenderLabel(selectedPatient.gender)}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Scrollable content area ───────────────────────────── */}
              <ScrollArea className="flex-1 -mt-4">
                <div className="relative bg-white rounded-t-2xl px-6 pt-5 pb-6 space-y-6">
                  {/* Contact information */}
                  <section aria-label="Contact information">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50">
                          <Phone className="size-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">Phone</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedPatient.phone}
                          </p>
                        </div>
                      </div>

                      {selectedPatient.email && (
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50">
                            <FileText className="size-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {selectedPatient.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {(selectedPatient.address ||
                        selectedPatient.city ||
                        selectedPatient.pincode) && (
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50">
                            <MapPin className="size-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400">Address</p>
                            <p className="text-sm font-medium text-gray-900">
                              {[
                                selectedPatient.address,
                                selectedPatient.city,
                                selectedPatient.pincode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Medical history */}
                  <section aria-label="Medical history">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                      Medical History
                    </h4>
                    <Textarea
                      value={medicalHistory}
                      onChange={(e) => {
                        setMedicalHistory(e.target.value);
                        setHistorySaved(false);
                      }}
                      placeholder="Add medical history, allergies, past conditions, ongoing medications…"
                      rows={4}
                      className="resize-none border-gray-200 focus-visible:ring-blue-300 focus-visible:border-blue-300 text-sm"
                    />
                    <div className="flex items-center justify-between mt-2">
                      {historySaved && (
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <svg
                            className="size-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Saved
                        </span>
                      )}
                      {!historySaved && <span />}
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-medium px-4"
                        onClick={handleSaveMedicalHistory}
                        disabled={savingHistory}
                      >
                        {savingHistory ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-1.5 size-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Saving…
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </section>

                  <Separator />

                  {/* Visit history */}
                  <section aria-label="Visit history">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                      Visit History
                    </h4>

                    {visitsLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                          >
                            <Skeleton className="size-10 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : visitBookings.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <Calendar className="size-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">
                          No visit history with this doctor
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {visitBookings.map((booking) => {
                          const hasPrescription =
                            bookingPrescriptionMap[booking.id] ?? false;

                          return (
                            <div
                              key={booking.id}
                              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50/50 transition-colors group"
                            >
                              {/* Date icon */}
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-100 shadow-sm group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                                <Calendar className="size-4 text-blue-600" />
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-gray-900">
                                    {booking.serviceName || "Consultation"}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] font-semibold px-1.5 py-0 border",
                                      getStatusBadgeClasses(booking.status)
                                    )}
                                  >
                                    {getStatusLabel(booking.status)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {formatDate(booking.date)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {booking.timeSlot}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  <span>{getModeLabel(booking.mode)}</span>
                                  <span>·</span>
                                  <span>{formatCurrency(booking.price)}</span>
                                </div>
                              </div>

                              {/* Prescription button */}
                              <div className="shrink-0 pt-0.5">
                                {hasPrescription ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] font-medium text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800 px-2.5"
                                    onClick={() =>
                                      handleNewPrescription(
                                        booking.id,
                                        selectedPatient.name
                                      )
                                    }
                                  >
                                    <FileText className="size-3 mr-1" />
                                    View Rx
                                  </Button>
                                ) : booking.status === "completed" ||
                                  booking.status === "in-progress" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] font-medium text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800 px-2.5"
                                    onClick={() =>
                                      handleNewPrescription(
                                        booking.id,
                                        selectedPatient.name
                                      )
                                    }
                                  >
                                    <FileText className="size-3 mr-1" />
                                    New Rx
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <Separator />

                  {/* New Prescription CTA */}
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white font-medium h-11 shadow-sm"
                    onClick={() => {
                      // Find the most recent completed booking for this patient
                      const lastBooking = visitBookings.find(
                        (b) =>
                          b.status === "completed" ||
                          b.status === "in-progress"
                      );
                      if (lastBooking) {
                        handleNewPrescription(
                          lastBooking.id,
                          selectedPatient.name
                        );
                      }
                    }}
                    disabled={
                      !visitBookings.some(
                        (b) =>
                          b.status === "completed" ||
                          b.status === "in-progress"
                      )
                    }
                  >
                    <FileText className="size-4 mr-2" />
                    New Prescription for this Patient
                  </Button>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}export { PatientsView };
