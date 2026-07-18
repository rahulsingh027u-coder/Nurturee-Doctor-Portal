"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Video,
  Stethoscope,
  Phone,
  Clock,
  CalendarDays,
  Video as VideoIcon,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CAREGIVERS, SERVICES } from "@/lib/data";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Doctor Console — a hidden view (accessible via #doctor in the URL hash
 * or the discreet "Doctor Portal" link in the footer) that lets a doctor:
 *   1. See all bookings assigned to them
 *   2. Lock a customer's time slot (notifies the customer)
 *   3. Start a video call that rings the customer
 *
 * In production this would be a separate authenticated portal; for the demo
 * it shares the same origin so we can use BroadcastChannel as the WebRTC
 * signaling channel between two browser tabs.
 */
export function DoctorConsoleView() {
  const {
    bookings,
    slotStates,
    callStatus,
    activeCallBookingId,
    vcm,
    setView,
    initVideoCall,
    doctorLockSlot,
    doctorUnlockSlot,
    doctorStartCall,
    toast,
  } = useAppStore();

  const [copied, setCopied] = useState(false);
  const [peerToCall, setPeerToCall] = useState<string>("");

  // Make sure VCM is initialised
  useEffect(() => {
    initVideoCall();
  }, [initVideoCall]);

  const activeBookings = bookings.filter(
    (b) => b.status !== "cancelled"
  );

  const handleLock = (bookingId: string, alreadyLocked: boolean) => {
    if (alreadyLocked) {
      doctorUnlockSlot(bookingId);
      toast("Slot unlocked.", "default");
    } else {
      doctorLockSlot(bookingId);
    }
  };

  const handleStartCall = async (bookingId: string) => {
    if (!vcm) {
      toast("Video call system not ready. Please refresh.", "error");
      return;
    }
    if (!peerToCall.trim()) {
      toast(
        "Enter the customer's Peer ID (shown on their My Bookings page).",
        "error"
      );
      return;
    }
    await doctorStartCall(bookingId, peerToCall.trim());
  };

  const copyPeerId = () => {
    if (!vcm) return;
    navigator.clipboard.writeText(vcm.peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => setView("home")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-blue-700"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </button>

        {/* Header */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-xs font-medium">
                <Stethoscope className="size-3" /> Doctor Portal
              </span>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                Doctor Console
              </h1>
              <p className="mt-1 text-sm text-rose-50">
                Lock patient time slots and start secure video consultations.
              </p>
            </div>
            <div className="rounded-xl bg-white/15 p-3 text-right backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-wider text-rose-100">
                Your Peer ID
              </p>
              <div className="flex items-center gap-1">
                <code className="font-mono text-xs font-bold">
                  {vcm?.peerId ?? "—"}
                </code>
                <button
                  onClick={copyPeerId}
                  className="rounded p-1 hover:bg-white/20"
                  aria-label="Copy peer ID"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-300" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Setup instructions */}
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-blue-600" />
            <div className="space-y-1">
              <p className="font-semibold">How to test the video call</p>
              <ol className="ml-4 list-decimal space-y-0.5 text-xs text-blue-800/90">
                <li>
                  Open this same app in a <strong>second browser tab</strong>{" "}
                  (same browser, same URL).
                </li>
                <li>
                  In the second tab, go to{" "}
                  <strong>My Bookings</strong> — you&apos;ll see a{" "}
                  <strong>Peer ID</strong> on each booking card.
                </li>
                <li>
                  Copy that Peer ID and paste it in the{" "}
                  <strong>Customer Peer ID</strong> field below, then click{" "}
                  <strong>Lock &amp; Start Call</strong>.
                </li>
                <li>
                  The customer tab will ring — accept the call there. Both
                  cameras connect peer-to-peer.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Bookings list */}
        <h2 className="mb-3 text-lg font-semibold">
          Patient Bookings ({activeBookings.length})
        </h2>

        {activeBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <CalendarDays className="mx-auto size-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium">No patient bookings yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Once a customer books a service, it will appear here for you to
              lock and call.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBookings.map((b) => {
              const service = SERVICES.find((s) => s.id === b.serviceId);
              const caregiver = CAREGIVERS.find((c) => c.id === b.caregiverId);
              const slot = slotStates[b.id] ?? { locked: false, ringing: false };
              const isThisCallActive =
                activeCallBookingId === b.id &&
                (callStatus === "connecting" || callStatus === "connected");

              return (
                <div
                  key={b.id}
                  className={cn(
                    "rounded-xl border bg-card p-4 shadow-sm sm:p-5",
                    slot.locked ? "border-emerald-300 bg-emerald-50/40" : "border-border/60",
                    isThisCallActive && "border-blue-400 ring-2 ring-blue-400/30"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold sm:text-base">
                          {b.serviceName}
                        </h3>
                        {slot.locked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            <Lock className="size-2.5" /> Slot Locked
                          </span>
                        )}
                        {isThisCallActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                            <span className="size-1.5 animate-pulse rounded-full bg-blue-600" />
                            Call Active
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {b.id}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3 text-blue-600" />
                          {format(new Date(b.date), "EEE, dd MMM yyyy")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3 text-blue-600" />
                          {b.timeSlot}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <VideoIcon className="size-3 text-blue-600" />
                          {b.mode === "online" ? "Online" : "In-home"}
                        </span>
                        <span className="font-semibold text-blue-700">
                          ₹{b.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                      {b.address && (
                        <p className="mt-1 text-xs text-slate-600">
                          📍 {b.address.fullName} • {b.address.phone} •{" "}
                          {b.address.line1}
                          {b.address.line2 ? `, ${b.address.line2}` : ""},{" "}
                          {b.address.city} {b.address.pincode}
                        </p>
                      )}
                      {b.notes && (
                        <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
                          📝 {b.notes}
                        </p>
                      )}
                    </div>

                    {/* Assigned caregiver chip */}
                    {caregiver && (
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
                        <div
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white",
                            caregiver.photoColor
                          )}
                        >
                          {caregiver.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="text-[10px]">
                          <p className="font-medium text-slate-700">
                            {caregiver.name}
                          </p>
                          <p className="text-slate-500">
                            {caregiver.specialization}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action row */}
                  {!isThisCallActive && (
                    <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:gap-3">
                      <button
                        onClick={() => handleLock(b.id, slot.locked)}
                        className={cn(
                          "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all active:scale-95",
                          slot.locked
                            ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        )}
                      >
                        {slot.locked ? (
                          <>
                            <Unlock className="size-3.5" /> Unlock Slot
                          </>
                        ) : (
                          <>
                            <Lock className="size-3.5" /> Lock Slot
                          </>
                        )}
                      </button>

                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          placeholder="Customer Peer ID (from their My Bookings)"
                          value={peerToCall}
                          onChange={(e) => setPeerToCall(e.target.value)}
                          className="h-9 flex-1 rounded-lg border border-border bg-white px-3 text-xs font-mono"
                        />
                        <button
                          onClick={() => handleStartCall(b.id)}
                          disabled={!slot.locked}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-40"
                          title={
                            slot.locked
                              ? "Start video call"
                              : "Lock the slot first"
                          }
                        >
                          <Video className="size-3.5" /> Start Call
                        </button>
                      </div>
                    </div>
                  )}

                  {isThisCallActive && (
                    <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2 animate-pulse rounded-full bg-blue-600" />
                        {callStatus === "connected"
                          ? "Call connected — switch to the video call panel to manage."
                          : "Connecting…"}
                      </span>
                      <Phone className="size-3.5" />
                    </div>
                  )}

                  {!slot.locked && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      💡 Lock the slot first to notify the customer, then start
                      the call.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 rounded-xl border border-border/60 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">
            About this doctor portal
          </p>
          <p className="mt-1 leading-relaxed">
            This is a built-in demo of the doctor portal that lives inside the
            customer app for testing. In production, the doctor portal will be
            a separate authenticated website (and Android/iOS app) that shares
            the same database. The video call uses WebRTC peer-to-peer
            connection — no video data passes through any server.
          </p>
        </div>
      </div>
    </div>
  );
}
