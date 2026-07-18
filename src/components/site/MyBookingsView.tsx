"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Video,
  XCircle,
  Eye,
  Lock,
  Phone,
  Copy,
  Radio,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CAREGIVERS } from "@/lib/data";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  "pending-assignment": {
    label: "Pending assignment",
    cls: "bg-amber-100 text-amber-800",
  },
  "caregiver-assigned": {
    label: "Caregiver assigned",
    cls: "bg-emerald-100 text-emerald-800",
  },
  "in-progress": {
    label: "In progress",
    cls: "bg-blue-100 text-blue-800",
  },
  completed: { label: "Completed", cls: "bg-slate-200 text-slate-800" },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-800" },
};

export function MyBookingsView() {
  const bookings = useAppStore((s) => s.bookings);
  const setView = useAppStore((s) => s.setView);
  const viewCaregiver = useAppStore((s) => s.viewCaregiver);
  const cancelBooking = useAppStore((s) => s.cancelBooking);
  const toast = useAppStore((s) => s.toast);
  const slotStates = useAppStore((s) => s.slotStates);
  const incomingCall = useAppStore((s) => s.incomingCall);
  const acceptIncomingCall = useAppStore((s) => s.acceptIncomingCall);
  const rejectIncomingCall = useAppStore((s) => s.rejectIncomingCall);
  const vcm = useAppStore((s) => s.vcm);

  const copyMyPeerId = () => {
    if (!vcm) return;
    navigator.clipboard.writeText(vcm.peerId);
    toast("Peer ID copied — share with the doctor to receive calls.", "success");
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => setView("home")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-blue-700"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </button>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My Bookings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your service requests, view assigned caregivers and cancel if
          plans change.
        </p>

        {/* My Peer ID card (for video call setup) */}
        {vcm && bookings.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-blue-900">
                  Your Peer ID for video calls
                </p>
                <p className="font-mono text-[11px] text-blue-700">
                  {vcm.peerId}
                </p>
              </div>
            </div>
            <button
              onClick={copyMyPeerId}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-300 bg-white px-2.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
            >
              <Copy className="size-3" /> Copy
            </button>
          </div>
        )}

        {/* Incoming call banner */}
        {incomingCall && (
          <div className="mt-4 animate-pulse rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Phone className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    Incoming Video Call
                  </p>
                  <p className="text-xs text-emerald-800">
                    Your doctor is calling you for booking{" "}
                    <span className="font-mono">{incomingCall.bookingId}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={rejectIncomingCall}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-rose-300 bg-white px-3 text-xs font-medium text-rose-700 hover:bg-rose-50"
                >
                  Decline
                </button>
                <button
                  onClick={acceptIncomingCall}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95"
                >
                  <Video className="size-3.5" /> Join
                </button>
              </div>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <CalendarDays className="mx-auto size-10 text-slate-300" />
            <h2 className="mt-3 text-base font-semibold">No bookings yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a service to make your first booking.
            </p>
            <button
              onClick={() => setView("home")}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {bookings.map((b) => {
              const caregiver = CAREGIVERS.find((c) => c.id === b.caregiverId);
              const status = STATUS_LABEL[b.status];
              const slot = slotStates[b.id] ?? { locked: false, ringing: false };
              const isIncoming = incomingCall?.bookingId === b.id;

              return (
                <div
                  key={b.id}
                  className={cn(
                    "rounded-xl border bg-card p-4 shadow-sm sm:p-5 transition-all",
                    slot.locked && !isIncoming && "border-emerald-300 bg-emerald-50/40",
                    isIncoming && "border-2 border-emerald-500 ring-2 ring-emerald-400/40 animate-pulse"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold sm:text-base">
                          {b.serviceName}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.cls}`}
                        >
                          {status.label}
                        </span>
                        {slot.locked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                            <Lock className="size-2.5" /> Slot Locked — Join Now
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {b.id}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-blue-700">
                      ₹{b.price.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2 sm:text-sm">
                    <p className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-blue-600" />
                      {format(new Date(b.date), "EEE, dd MMM yyyy")}
                    </p>
                    <p className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 text-blue-600" />
                      {b.timeSlot}
                    </p>
                    <p className="inline-flex items-center gap-1.5">
                      {b.mode === "online" ? (
                        <>
                          <Video className="size-3.5 text-rose-600" /> Online
                          consultation
                        </>
                      ) : (
                        <>
                          <MapPin className="size-3.5 text-indigo-600" />
                          In-home visit
                        </>
                      )}
                    </p>
                    {b.address && (
                      <p className="inline-flex items-start gap-1.5 sm:col-span-2">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-indigo-600" />
                        <span className="text-xs">
                          {b.address.fullName} • {b.address.phone} •{" "}
                          {b.address.line1}
                          {b.address.line2 ? `, ${b.address.line2}` : ""},{" "}
                          {b.address.city} {b.address.pincode}
                          {b.address.landmark
                            ? ` — ${b.address.landmark}`
                            : ""}
                        </span>
                      </p>
                    )}
                  </div>

                  {b.notes && (
                    <p className="mt-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
                      <strong>Note:</strong> {b.notes}
                    </p>
                  )}

                  {/* Assigned caregiver mini-card */}
                  {caregiver && b.status === "caregiver-assigned" && (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${caregiver.photoColor} text-xs font-bold text-white`}
                      >
                        {caregiver.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-emerald-900">
                          Assigned caregiver
                        </p>
                        <p className="text-sm font-semibold text-emerald-900">
                          {caregiver.name} • {caregiver.specialization}
                        </p>
                      </div>
                      <button
                        onClick={() => viewCaregiver(caregiver.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-xs font-medium text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95"
                      >
                        <Eye className="size-3.5" /> View
                      </button>
                    </div>
                  )}

                  {/* Actions: Join call (when locked/ringing) + View caregiver + Cancel */}
                  {b.status === "caregiver-assigned" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {/* Join Video Call — shown when slot is locked OR call is ringing */}
                      {(slot.locked || isIncoming) && (
                        <button
                          onClick={() => {
                            if (isIncoming) {
                              acceptIncomingCall();
                            } else if (slot.pendingOffer && slot.remotePeerId) {
                              // We have a pending offer — accept via store
                              acceptIncomingCall();
                            } else {
                              toast(
                                "Waiting for doctor to start the call. The video panel will open automatically when the doctor calls.",
                                "default"
                              );
                            }
                          }}
                          className={cn(
                            "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 sm:flex-none",
                            isIncoming
                              ? "animate-pulse bg-emerald-600 hover:bg-emerald-700"
                              : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:shadow-md"
                          )}
                        >
                          <Video className="size-3.5" />
                          {isIncoming ? "Answer Video Call" : "Join Video Call"}
                        </button>
                      )}
                      {caregiver && (
                        <button
                          onClick={() => viewCaregiver(caregiver.id)}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:flex-none"
                        >
                          <Eye className="size-3.5" /> View Caregiver
                        </button>
                      )}
                      <button
                        onClick={() => {
                          cancelBooking(b.id);
                          toast("Booking cancelled.", "default");
                        }}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        <XCircle className="size-3.5" /> Cancel
                      </button>
                    </div>
                  )}

                  {/* Status hint */}
                  {b.status === "caregiver-assigned" &&
                    !slot.locked &&
                    !isIncoming && (
                      <p className="mt-2 text-[11px] text-slate-500">
                        💡 Your doctor will lock your time slot closer to the
                        appointment. You&apos;ll get a notification here when
                        they do.
                      </p>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
