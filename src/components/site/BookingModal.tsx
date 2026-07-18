"use client";

import { useState } from "react";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Loader2,
  MapPin,
  Video,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { TIME_SLOTS } from "@/lib/data";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Step = "mode" | "schedule" | "address" | "review";

export function BookingModal() {
  const {
    isBookingOpen,
    bookingDraft,
    closeBooking,
    setDraftMode,
    setDraftDate,
    setDraftTime,
    setDraftAddress,
    setDraftNotes,
    confirmBooking,
    setView,
    toast,
  } = useAppStore();

  const service = bookingDraft.service;
  // Lazy initial state — the modal is remounted via React `key` (bookingSessionId)
  // each time openBooking is called, so this initializer runs fresh per booking session.
  const [step, setStep] = useState<Step>(() =>
    service?.mode === "both" ? "mode" : "schedule"
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(
    null
  );

  // Address form state
  const [addr, setAddr] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "Gurugram",
    pincode: "",
    landmark: "",
  });

  if (!service) return null;

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  const handleConfirm = () => {
    if (bookingDraft.mode === "physical") {
      setDraftAddress({
        fullName: addr.fullName,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2 || undefined,
        city: addr.city,
        pincode: addr.pincode,
        landmark: addr.landmark || undefined,
      });
    }
    setSubmitting(true);
    // Simulate admin assignment (1.2s)
    setTimeout(() => {
      const id = confirmBooking();
      if (id) {
        setConfirmedBookingId(id);
        setSubmitting(false);
        toast("Booking confirmed! Caregiver assigned.", "success");
      } else {
        setSubmitting(false);
        toast("Please complete all required fields.", "error");
      }
    }, 1200);
  };

  const canGoToSchedule =
    bookingDraft.mode !== null &&
    (service.mode === "both" || service.mode === bookingDraft.mode);

  const canGoToAddress =
    bookingDraft.date !== null && bookingDraft.timeSlot !== null;

  const isAddressValid =
    addr.fullName.trim() &&
    addr.phone.trim().length >= 10 &&
    addr.line1.trim() &&
    addr.pincode.trim().length === 6;

  const canConfirm =
    bookingDraft.date !== null &&
    bookingDraft.timeSlot !== null &&
    (bookingDraft.mode === "online" || isAddressValid);

  // -------- Success screen --------
  if (confirmedBookingId) {
    return (
      <Dialog open={isBookingOpen} onOpenChange={(o) => !o && closeBooking()}>
        <DialogContent className="max-w-md overflow-hidden rounded-2xl p-0 sm:max-w-md">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Check className="size-8" />
            </div>
            <h2 className="text-xl font-bold">Booking Confirmed!</h2>
            <p className="mt-1 text-sm text-emerald-50">
              Your booking ID is{" "}
              <span className="font-mono font-semibold">
                {confirmedBookingId}
              </span>
            </p>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm leading-relaxed text-slate-700">
              An admin-approved, fully-verified caregiver has been assigned to
              your booking. You can now view their profile — name, date of
              birth, address, emergency contact, masked Aadhaar, police
              verification reference and video verification — before they
              arrive.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => {
                  closeBooking();
                  setView("caregiver-profile");
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
              >
                View Caregiver Profile
              </button>
              <button
                onClick={() => {
                  closeBooking();
                  setView("bookings");
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
              >
                Go to My Bookings
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // -------- Booking flow --------
  const stepOrder: Step[] =
    service.mode === "both"
      ? ["mode", "schedule", ...(bookingDraft.mode === "physical" ? ["address"] : []), "review"]
      : ["schedule", ...(service.mode === "physical" ? ["address"] : []), "review"];

  const currentIdx = stepOrder.indexOf(step);
  const goNext = () => {
    if (currentIdx < stepOrder.length - 1) setStep(stepOrder[currentIdx + 1]);
  };
  const goPrev = () => {
    if (currentIdx > 0) setStep(stepOrder[currentIdx - 1]);
  };

  return (
    <Dialog open={isBookingOpen} onOpenChange={(o) => !o && closeBooking()}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-2xl p-0 sm:max-w-lg nice-scroll">
        <DialogHeader className="border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle className="text-base font-bold sm:text-lg">
            Book: {service.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground sm:text-sm">
            {service.duration} •{" "}
            {service.mode === "both"
              ? `₹${service.onlinePrice?.toLocaleString("en-IN")} online / ₹${service.inHomePrice?.toLocaleString("en-IN")} at-home`
              : `₹${service.price.toLocaleString("en-IN")} ${service.priceUnit}`}
          </DialogDescription>

          {/* Step indicator */}
          <div className="mt-3 flex items-center gap-1.5">
            {stepOrder.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= currentIdx ? "bg-blue-600" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="px-5 py-5">
          {/* STEP: MODE */}
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
                  desc: "Video call — no address needed. Best for follow-ups & minor queries.",
                  price: service.onlinePrice,
                },
                {
                  value: "physical" as const,
                  icon: MapPin,
                  title: "In-Home Visit",
                  desc: "Doctor / caregiver visits your home. Address required.",
                  price: service.inHomePrice,
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setDraftMode(opt.value);
                    setTimeout(goNext, 150);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    bookingDraft.mode === opt.value
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-border hover:border-blue-300 hover:bg-blue-50/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      opt.value === "online"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-indigo-50 text-indigo-600"
                    )}
                  >
                    <opt.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{opt.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {opt.desc}
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-700">
                      ₹{opt.price?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP: SCHEDULE */}
          {step === "schedule" && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                  <CalendarIcon className="size-4" /> Select date
                </Label>
                <div className="rounded-lg border border-border p-2">
                  <Calendar
                    mode="single"
                    selected={
                      bookingDraft.date ? new Date(bookingDraft.date) : undefined
                    }
                    onSelect={(d) =>
                      d && setDraftDate(format(d, "yyyy-MM-dd"))
                    }
                    disabled={(d) => isBefore(d, today) || d > maxDate}
                    initialFocus
                    className="mx-auto"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="size-4" /> Select time slot
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setDraftTime(slot)}
                      className={cn(
                        "rounded-lg border p-2 text-xs font-medium transition-all",
                        bookingDraft.timeSlot === slot
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
                          : "border-border text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP: ADDRESS (physical only) */}
          {step === "address" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Service address
              </p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="fullName" className="text-xs">
                    Full name *
                  </Label>
                  <Input
                    id="fullName"
                    value={addr.fullName}
                    onChange={(e) =>
                      setAddr((a) => ({ ...a, fullName: e.target.value }))
                    }
                    placeholder="e.g. Priya Sharma"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs">
                    Phone number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    value={addr.phone}
                    onChange={(e) =>
                      setAddr((a) => ({
                        ...a,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    placeholder="10-digit mobile"
                  />
                </div>
                <div>
                  <Label htmlFor="line1" className="text-xs">
                    Flat / House no, Building *
                  </Label>
                  <Input
                    id="line1"
                    value={addr.line1}
                    onChange={(e) =>
                      setAddr((a) => ({ ...a, line1: e.target.value }))
                    }
                    placeholder="e.g. C-204, Heritage One"
                  />
                </div>
                <div>
                  <Label htmlFor="line2" className="text-xs">
                    Sector / Locality
                  </Label>
                  <Input
                    id="line2"
                    value={addr.line2}
                    onChange={(e) =>
                      setAddr((a) => ({ ...a, line2: e.target.value }))
                    }
                    placeholder="e.g. Sector 61"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" className="text-xs">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={addr.city}
                      onChange={(e) =>
                        setAddr((a) => ({ ...a, city: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode" className="text-xs">
                      Pincode *
                    </Label>
                    <Input
                      id="pincode"
                      inputMode="numeric"
                      value={addr.pincode}
                      onChange={(e) =>
                        setAddr((a) => ({
                          ...a,
                          pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="6-digit"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="landmark" className="text-xs">
                    Landmark
                  </Label>
                  <Input
                    id="landmark"
                    value={addr.landmark}
                    onChange={(e) =>
                      setAddr((a) => ({ ...a, landmark: e.target.value }))
                    }
                    placeholder="e.g. Near Fortis Hospital"
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
                    <dt className="text-muted-foreground">Service</dt>
                    <dd className="font-medium text-right">{service.name}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Mode</dt>
                    <dd className="font-medium capitalize">
                      {bookingDraft.mode === "online" ? "Online" : "In-home visit"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Date</dt>
                    <dd className="font-medium">
                      {bookingDraft.date
                        ? format(new Date(bookingDraft.date), "EEE, dd MMM yyyy")
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Time</dt>
                    <dd className="font-medium">{bookingDraft.timeSlot ?? "—"}</dd>
                  </div>
                  {bookingDraft.mode === "physical" && addr.line1 && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Address</dt>
                      <dd className="text-right text-xs">
                        {addr.fullName}, {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}{" "}
                        {addr.pincode}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 border-t border-border pt-2">
                    <dt className="font-semibold">Total</dt>
                    <dd className="font-bold text-blue-700">
                      ₹
                      {(
                        bookingDraft.mode === "online"
                          ? service.onlinePrice ?? service.price
                          : service.inHomePrice ?? service.price
                      ).toLocaleString("en-IN")}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <Label htmlFor="notes" className="text-xs">
                  Notes for caregiver / doctor (optional)
                </Label>
                <Textarea
                  id="notes"
                  value={bookingDraft.notes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="e.g. Baby has mild fever since morning. Please carry thermometer."
                  rows={3}
                />
              </div>

              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                After confirmation, our admin will assign a verified caregiver.
                You will see their full profile and documents before they
                arrive.
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
              onClick={closeBooking}
              className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}

          {step !== "review" ? (
            <button
              onClick={goNext}
              disabled={
                (step === "mode" && !canGoToSchedule) ||
                (step === "schedule" && !canGoToAddress) ||
                (step === "address" && !isAddressValid)
              }
              className="inline-flex h-10 items-center gap-1 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              Next <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || submitting}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Assigning
                  caregiver…
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
