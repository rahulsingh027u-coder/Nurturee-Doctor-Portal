"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  GraduationCap,
  Globe,
  MapPin,
  Search,
  Stethoscope,
  Video,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { DoctorListItem } from "@/lib/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseAvailableDays(daysStr: string): string {
  const days = daysStr
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !isNaN(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);

  if (days.length === 0) return "Not specified";
  if (days.length === 7) return "All days";

  // Find consecutive ranges
  const ranges: string[] = [];
  let start = days[0];
  let end = days[0];
  for (let i = 1; i < days.length; i++) {
    if (days[i] === end + 1) {
      end = days[i];
    } else {
      ranges.push(start === end ? DAY_NAMES[start] : `${DAY_NAMES[start]}-${DAY_NAMES[end]}`);
      start = days[i];
      end = days[i];
    }
  }
  ranges.push(start === end ? DAY_NAMES[start] : `${DAY_NAMES[start]}-${DAY_NAMES[end]}`);
  return ranges.join(", ");
}

function DoctorCardSkeleton() {
  return (
    <div className="rounded-xl border p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function DoctorListView() {
  const setView = useAppStore((s) => s.setView);
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeSpecialization, setActiveSpecialization] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListItem | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const fetchDoctors = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/doctors?list=true")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch doctors");
        return r.json();
      })
      .then((data) => {
        setDoctors(data as DoctorListItem[]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Something went wrong");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Extract unique specializations
  const specializations = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization));
    return Array.from(set).sort();
  }, [doctors]);

  // Filter doctors
  const filtered = useMemo(() => {
    let result = doctors;
    if (activeSpecialization) {
      result = result.filter((d) => d.specialization === activeSpecialization);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.user.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.degree.toLowerCase().includes(q)
      );
    }
    return result;
  }, [doctors, search, activeSpecialization]);

  const openBooking = (doctor: DoctorListItem) => {
    setSelectedDoctor(doctor);
    setBookingOpen(true);
  };

  const closeBooking = () => {
    setBookingOpen(false);
    // Small delay before clearing doctor so the modal close animation completes
    setTimeout(() => setSelectedDoctor(null), 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-white">
      {/* Header bar */}
      <div className="sticky top-0 z-10 border-b border-rose-100/60 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
          <button
            onClick={() => setView("home")}
            className="flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">Our Doctors</h1>
            <p className="text-xs text-muted-foreground">
              Verified specialists ready to consult
            </p>
          </div>
          {doctors.length > 0 && !loading && (
            <Badge
              variant="secondary"
              className="bg-rose-100 text-rose-700"
            >
              {filtered.length} doctor{filtered.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, specialization, or degree..."
            className="h-11 pl-10 pr-4"
          />
        </div>

        {/* Specialization filter chips */}
        {!loading && !error && specializations.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSpecialization(null)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                activeSpecialization === null
                  ? "border-rose-500 bg-rose-100 text-rose-700 shadow-sm"
                  : "border-border bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              }`}
            >
              <Stethoscope className="size-3" />
              All
            </button>
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() =>
                  setActiveSpecialization(
                    activeSpecialization === spec ? null : spec
                  )
                }
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeSpecialization === spec
                    ? "border-rose-500 bg-rose-100 text-rose-700 shadow-sm"
                    : "border-border bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-rose-100">
              <Stethoscope className="size-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Could not load doctors
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              onClick={fetchDoctors}
              className="mt-2 border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              Try again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && doctors.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-rose-100">
              <Stethoscope className="size-8 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No doctors available yet
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              We are onboarding verified specialists. Please check back soon!
            </p>
          </div>
        )}

        {/* No results */}
        {!loading && !error && doctors.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-slate-100">
              <Search className="size-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No doctors match your search
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setActiveSpecialization(null);
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Doctor cards grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onBook={() => openBooking(doctor)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedDoctor && bookingOpen && (
        <DoctorBookingModal
          doctor={selectedDoctor}
          open={bookingOpen}
          onClose={closeBooking}
        />
      )}
    </div>
  );
}

// ─── Individual Doctor Card ────────────────────────────────────────────

function DoctorCard({
  doctor,
  onBook,
}: {
  doctor: DoctorListItem;
  onBook: () => void;
}) {
  const initials = doctor.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hasOnline = doctor.consultationFeeOnline > 0;
  const hasOffline = doctor.consultationFeeOffline > 0;
  const daysLabel = parseAvailableDays(doctor.availableDays);

  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:border-rose-200 hover:shadow-md">
      {/* Top row: avatar + info */}
      <div className="flex items-start gap-3">
        <Avatar className="size-14 shrink-0">
          {doctor.user.avatar ? (
            <img
              src={doctor.user.avatar}
              alt={doctor.user.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-rose-400 to-pink-500 text-base font-bold text-white">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900">
            Dr. {doctor.user.name}
          </h3>
          <p className="mt-0.5 truncate text-xs font-medium text-rose-600">
            {doctor.specialization}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="size-3" />
              {doctor.degree}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3" />
              {doctor.experienceYears} yr{doctor.experienceYears !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {doctor.bio && (
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
          {doctor.bio}
        </p>
      )}

      {/* Fees */}
      <div className="flex flex-wrap gap-2">
        {hasOnline && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5">
            <Video className="size-3.5 text-rose-500" />
            <span className="text-xs text-rose-700">Online</span>
            <span className="text-xs font-bold text-rose-800">
              ₹{doctor.consultationFeeOnline.toLocaleString("en-IN")}
            </span>
          </div>
        )}
        {hasOffline && (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5">
            <MapPin className="size-3.5 text-amber-600" />
            <span className="text-xs text-amber-700">In-Home</span>
            <span className="text-xs font-bold text-amber-800">
              ₹{doctor.consultationFeeOffline.toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>

      {/* Area & Languages */}
      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
        {doctor.area && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {doctor.area}
          </span>
        )}
        {doctor.languages && (
          <span className="inline-flex items-center gap-1">
            <Globe className="size-3" />
            {doctor.languages}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {doctor.availableFrom} – {doctor.availableTo} • {daysLabel}
        </span>
      </div>

      {/* Book button */}
      <button
        onClick={onBook}
        className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]"
      >
        Book Consultation
      </button>
    </div>
  );
}

// ─── Import the modal (defined in same directory) ───────────────────────

// Forward-declare: actual component is DoctorBookingModal below
import { DoctorBookingModal } from "./DoctorBookingModal";