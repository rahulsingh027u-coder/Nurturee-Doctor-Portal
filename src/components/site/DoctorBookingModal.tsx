"use client";

import { useState, useMemo } from "react";
import {
  addDays,
  format,
  getDay,
  isBefore,
  isSameDay,
  startOfDay,
} from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Loader2,
  MapPin,
  Video,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";
import type { DoctorListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = "mode" | "date" | "time" | "patient" | "review";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DoctorBookingModal({
  doctor,
  open,
  onClose,
}: {
  doctor: DoctorListItem;
  open: boolean;
  onClose: () => void;
}) {
  const { toast, setView } = useAppStore();

  const hasOnline = doctor.consultationFeeOnline > 0;
  const hasOffline = doctor.consultationFeeOffline > 0;
  const needsModeStep = hasOnline && hasOffline;

  const [step, setStep] = useState<Step>(() =>
    needsModeStep ? "mode" : "date"
  );
  const [mode, setMode] = useState<"online" | "physical" | null>(
    needsModeStep ? null : hasOnline ? "online" : "physical"
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientGender, setPatientGender] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  // Parse doctor's available day numbers
  const availableDayNumbers = useMemo(() => {
    return doctor.availableDays
      .split(",")
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d) && d >= 0 && d <= 6);
  }, [doctor.availableDays]);

  // Generate 45-min time slots
  const timeSlots = useMemo(() => {
    const [fromH, fromM] = doctor.availableFrom.split(":").map(Number);
    const [toH, toM] = doctor.availableTo.split(":").map(Number);
    const startMin = fromH * 60 + fromM;
    const endMin = toH * 60 + toM;
    const slots: string[] = [];
    let cursor = startMin;
    while (cursor + 45 <= endMin) {
      const h = Math.floor(cursor / 60);
      const m = cursor % 60;
      const endH = Math.floor((cursor + 45) / 60);
      const endM = (cursor + 45) % 60;
      const pad = (n: number) => n.toString().padStart(2, "0");
      slots.push(`${pad(h)}:${pad(m)} - ${pad(endH)}:${pad(endM)}`);
      cursor += 45;
    }
    return slots;
  }, [doctor.availableFrom, doctor.availableTo]);

  // Steps array for progress bar
  const stepOrder: Step[] = needsModeStep
    ? ["mode", "date", "time", "patient", "review"]
    : ["date", "time", "patient", "review"];
  const currentIdx = stepOrder.indexOf(step);

  const goNext = () => {
    if (currentIdx < stepOrder.length - 1) {
      setStep(stepOrder[currentIdx + 1]);
    }
  };
  const goPrev = () => {
    if (currentIdx > 0) setStep(stepOrder[currentIdx - 1]);
  };

  // Calendar day disable logic
  const isDayDisabled = (d: Date) => {
    if (isBefore(d, today) || d > maxDate) return true;
    // Check if the day of week is in the doctor's available days
    const jsDay = getDay(d); // 0=Sun
    // The DB stores 0=Sun, 1=Mon, ... 6=Sat (same as JS getDay)
    return !availableDayNumbers.includes(jsDay);
  };

  const currentPrice =
    mode === "online"
      ? doctor.consultationFeeOnline
      : mode === "physical"
      ? doctor.consultationFeeOffline
      : 0;

  const handleConfirm = async () => {
    if (!mode || !selectedDate || !selectedTimeSlot || !patientName.trim() || !patientPhone.trim()) return;

    setSubmitting(true);
    try {
      const serviceName =
        mode === "online"
          ? `Online Consultation - Dr. ${doctor.user.name}`
          : `In-Home Visit - Dr. ${doctor.user.name}`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          patientGender: patientGender || "Other",
          mode,
          date: format(selectedDate, "yyyy-MM-dd"),
          timeSlot: selectedTimeSlot,
          notes: notes.trim() || undefined,
          price: currentPrice,
          serviceName,
          category: "doctor",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Booking failed" }));
        throw new Error(err.error || "Booking failed");
      }

      setConfirmed(true);
      toast("Booking confirmed!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Booking failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = doctor.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // ─── Success screen ─────────────────────────────────────────────────
  if (confirmed) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md overflow-hidden rounded-2xl p-0 sm:max-w-md">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Check className="size-8" />
            </div>
            <h2 className="text-xl font-bold">Booking Confirmed!</h2>
            <p className="mt-1 text-sm text-rose-100">
              Your consultation with Dr. {doctor.user.name} has been booked.
            </p>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm leading-relaxed text-slate-700">
              {mode === "online"
                ? "You will receive a video call link before your appointment. Please ensure a stable internet connection."
                : "The doctor will visit you at your location. Please ensure someone is available at the given address and time."}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  setView("bookings");
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
              >
                View My Bookings
              </button>
              <button
                onClick={onClose}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
              >
                Browse More Doctors
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Booking flow ───────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-2xl p-0 sm:max-w-lg nice-scroll">
        <DialogHeader className="border-b border-border/60 px-5 py-4 text-left">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 shrink-0">
              {doctor.user.avatar ? (
                <img
                  src={doctor.user.avatar}
                  alt={doctor.user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-rose-400 to-pink-500 text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-base font-bold sm:text-lg">
                Dr. {doctor.user.name}
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-muted-foreground sm:text-sm">
                {doctor.specialization} • {doctor.degree}
              </DialogDescription>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mt-3 flex items-center gap-1.5">
            {stepOrder.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= currentIdx ? "bg-rose-500" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="px-5 py-5">
          {/* STEP: MODE SELECTION */}
          {step === "mode" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Choose consultation type
              </p>
              {[
                {
                  value: "online" as const,
                  icon: Video,
                  title: "Online Consultation",
                  desc: "Video call — consult from the comfort of your home.",
                  price: doctor.consultationFeeOnline,
                },
                {
                  value: "physical" as const,
                  icon: MapPin,
                  title: "In-Home Visit",
                  desc: "Doctor visits your home for a personal consultation.",
                  price: doctor.consultationFeeOffline,
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setMode(opt.value);
                    setTimeout(goNext, 150);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    mode === opt.value
                      ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500"
                      : "border-border hover:border-rose-300 hover:bg-rose-50/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      opt.value === "online"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-amber-100 text-amber-600"
                    )}
                  >
                    <opt.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{opt.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {opt.desc}
                    </p>
                    <p className="mt-1 text-sm font-medium text-rose-700">
                      ₹{opt.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP: DATE PICKER */}
          {step === "date" && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                  <CalendarIcon className="size-4" /> Select date
                </Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Only available days for Dr. {doctor.user.name} are selectable.
                </p>
                <div className="rounded-lg border border-border p-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    disabled={isDayDisabled}
                    initialFocus
                    className="mx-auto"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: TIME SLOT */}
          {step === "time" && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="size-4" /> Select time slot
                </Label>
                <p className="mb-3 text-xs text-muted-foreground">
                  Each slot is 45 minutes ({doctor.availableFrom} –{" "}
                  {doctor.availableTo})
                </p>
                {selectedDate && (
                  <p className="mb-2 text-xs font-medium text-rose-600">
                    {format(selectedDate, "EEE, dd MMM yyyy")}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto nice-scroll">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={cn(
                        "rounded-lg border p-2.5 text-xs font-medium transition-all",
                        selectedTimeSlot === slot
                          ? "border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500"
                          : "border-border text-slate-700 hover:border-rose-300 hover:bg-rose-50/50"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP: PATIENT DETAILS */}
          {step === "patient" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Patient details
              </p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="doc-patient-name" className="text-xs">
                    Patient name *
                  </Label>
                  <Input
                    id="doc-patient-name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                  />
                </div>
                <div>
                  <Label htmlFor="doc-patient-phone" className="text-xs">
                    Phone number *
                  </Label>
                  <Input
                    id="doc-patient-phone"
                    type="tel"
                    inputMode="numeric"
                    value={patientPhone}
                    onChange={(e) =>
                      setPatientPhone(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="10-digit mobile"
                  />
                </div>
                <div>
                  <Label htmlFor="doc-patient-gender" className="text-xs">
                    Gender
                  </Label>
                  <Select value={patientGender} onValueChange={setPatientGender}>
                    <SelectTrigger id="doc-patient-gender" className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="doc-notes" className="text-xs">
                    Notes for doctor (optional)
                  </Label>
                  <Textarea
                    id="doc-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Follow-up for fever, kindly keep previous reports handy"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: REVIEW */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-slate-50/50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Review your booking
                </h3>
                <dl className="mt-3 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Doctor</dt>
                    <dd className="font-medium text-right">
                      Dr. {doctor.user.name}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Specialization</dt>
                    <dd className="font-medium text-right">
                      {doctor.specialization}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Mode</dt>
                    <dd className="font-medium capitalize">
                      {mode === "online" ? "Online (Video)" : "In-Home Visit"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium">
                      {selectedDate
                        ? format(selectedDate, "EEE, dd MMM yyyy")
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Time</dt>
                    <dd className="font-medium">{selectedTimeSlot ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Patient</dt>
                    <dd className="font-medium text-right">
                      {patientName}
                      {patientGender && patientGender !== "Prefer not to say"
                        ? ` (${patientGender})`
                        : ""}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{patientPhone}</dd>
                  </div>
                  {notes.trim() && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Notes</dt>
                      <dd className="max-w-[60%] text-right text-xs">
                        {notes.trim()}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 border-t border-border pt-2">
                    <dt className="font-semibold">Consultation Fee</dt>
                    <dd className="font-bold text-rose-700">
                      ₹{currentPrice.toLocaleString("en-IN")}
                    </dd>
                  </div>
                </dl>
              </div>

              <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {mode === "online"
                  ? "After confirmation, you will receive instructions for the video call before your appointment."
                  : "The doctor will visit your location. Please ensure someone is available at the given time."}
              </p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3">
          {currentIdx > 0 ? (
            <button
              onClick={goPrev}
              className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}

          {step !== "review" ? (
            <button
              onClick={goNext}
              disabled={
                (step === "mode" && !mode) ||
                (step === "date" && !selectedDate) ||
                (step === "time" && !selectedTimeSlot) ||
                (step === "patient" &&
                  (!patientName.trim() || patientPhone.trim().length < 10))
              }
              className="inline-flex h-10 items-center gap-1 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              Next <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Booking…
                </>
              ) : (
                <>
                  <Check className="size-4" /> Confirm Booking
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}