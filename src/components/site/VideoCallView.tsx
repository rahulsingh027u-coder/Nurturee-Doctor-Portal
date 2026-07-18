"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Phone,
  X,
  Loader2,
  User,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CAREGIVERS, SERVICES } from "@/lib/data";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Full-screen video call overlay. Renders above all other UI when:
 *   - The customer has an incoming call (`incomingCall` set) — shows ringing UI
 *   - The customer/doctor has an active call (`activeCallBookingId` set)
 */
export function VideoCallView() {
  const {
    incomingCall,
    activeCallBookingId,
    callStatus,
    localStream,
    remoteStream,
    bookings,
    vcm,
    acceptIncomingCall,
    rejectIncomingCall,
    endActiveCall,
  } = useAppStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationRef = useRef<HTMLSpanElement>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  // The booking context for the call (either incoming or active)
  const callBookingId = incomingCall?.bookingId ?? activeCallBookingId;
  const booking = bookings.find((b) => b.id === callBookingId);
  const service = booking
    ? SERVICES.find((s) => s.id === booking.serviceId)
    : null;
  const caregiver = booking
    ? CAREGIVERS.find((c) => c.id === booking.caregiverId)
    : null;

  // Bind local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer (starts when connected). Uses a ref to avoid
  // setState-in-effect; updates DOM directly via the span ref.
  useEffect(() => {
    if (callStatus !== "connected") return;
    let seconds = 0;
    const formatDuration = (s: number) => {
      const mm = Math.floor(s / 60).toString().padStart(2, "0");
      const ss = (s % 60).toString().padStart(2, "0");
      return `${mm}:${ss}`;
    };
    if (durationRef.current) durationRef.current.textContent = "00:00";
    const interval = setInterval(() => {
      seconds += 1;
      if (durationRef.current) durationRef.current.textContent = formatDuration(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Nothing to render
  if (!incomingCall && !activeCallBookingId) return null;

  const isRinging = !!incomingCall && callStatus === "ringing";
  const isConnecting = callStatus === "connecting";
  const isConnected = callStatus === "connected";

  const handleToggleMute = () => {
    if (!vcm) return;
    const newMuted = vcm.toggleMute();
    setMuted(newMuted);
  };

  const handleToggleCamera = () => {
    if (!vcm) return;
    const newOff = vcm.toggleCamera();
    setCameraOff(newOff);
  };

  // ===== Ringing (incoming call) UI =====
  if (isRinging) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 pt-safe">
          <div>
            <p className="text-xs font-medium text-emerald-400">Incoming video call</p>
            <p className="text-[10px] text-slate-400">Nurturee secure connection</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">Ringing</span>
          </div>
        </div>

        {/* Center: caller info */}
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="relative mb-6">
            <div
              className={cn(
                "flex size-32 items-center justify-center rounded-full bg-gradient-to-br text-4xl font-bold shadow-2xl",
                caregiver?.photoColor ?? "from-blue-500 to-indigo-600"
              )}
            >
              {caregiver?.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("") ?? "DR"}
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
            <div className="absolute -inset-3 animate-pulse rounded-full border-2 border-emerald-400/40" />
          </div>

          <h2 className="text-2xl font-bold">{caregiver?.name ?? "Doctor"}</h2>
          <p className="mt-1 text-sm text-slate-300">
            {caregiver?.specialization ?? "Nurturee Specialist"}
          </p>
          <p className="mt-3 rounded-full bg-white/10 px-4 py-1.5 text-xs text-slate-200">
            {service?.name ?? "Consultation"} •{" "}
            {booking ? format(new Date(booking.date), "dd MMM yyyy") : ""}
          </p>
        </div>

        {/* Bottom: accept/reject */}
        <div className="flex items-center justify-center gap-8 px-6 pb-10 pb-safe">
          <button
            onClick={rejectIncomingCall}
            className="flex flex-col items-center gap-2"
            aria-label="Reject call"
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-rose-600 shadow-lg transition-all hover:bg-rose-700 active:scale-95">
              <PhoneOff className="size-7" />
            </div>
            <span className="text-xs font-medium text-slate-300">Decline</span>
          </button>
          <button
            onClick={acceptIncomingCall}
            className="flex flex-col items-center gap-2"
            aria-label="Accept call"
          >
            <div className="flex size-16 animate-bounce items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 transition-all hover:bg-emerald-600 active:scale-95">
              <Phone className="size-7" />
            </div>
            <span className="text-xs font-medium text-emerald-300">Accept</span>
          </button>
        </div>
      </div>
    );
  }

  // ===== Active call UI =====
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-900 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 pt-safe">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {caregiver?.name ?? "Doctor"}
          </p>
          <p className="truncate text-xs text-slate-400">
            {service?.name ?? "Consultation"}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
            isConnected && "bg-emerald-500/20 text-emerald-300",
            isConnecting && "bg-amber-500/20 text-amber-300",
            callStatus === "failed" && "bg-rose-500/20 text-rose-300"
          )}
        >
          {isConnected && (
            <>
              <span className="size-2 rounded-full bg-emerald-400" />
              <span ref={durationRef}>00:00</span>
            </>
          )}
          {isConnecting && (
            <>
              <Loader2 className="size-3 animate-spin" />
              Connecting…
            </>
          )}
          {callStatus === "failed" && (
            <>
              <span className="size-2 rounded-full bg-rose-400" />
              Connection failed
            </>
          )}
        </div>
      </div>

      {/* Remote video (full) */}
      <div className="relative flex-1 overflow-hidden bg-slate-950">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="size-full object-cover"
          muted={false}
        />
        {/* If no remote stream yet, show placeholder */}
        {!remoteStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className={cn(
                "flex size-24 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-bold",
                caregiver?.photoColor ?? "from-blue-500 to-indigo-600"
              )}
            >
              {caregiver?.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("") ?? <User className="size-10" />}
            </div>
            <p className="text-sm text-slate-400">
              {isConnecting
                ? "Waiting for the other side to connect…"
                : "Connecting to secure line…"}
            </p>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute right-3 top-3 size-32 overflow-hidden rounded-xl border-2 border-white/20 bg-slate-800 shadow-lg sm:size-40">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="size-full -scale-x-100 object-cover"
          />
          {!localStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <Loader2 className="size-6 animate-spin text-slate-500" />
            </div>
          )}
          {cameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <VideoOff className="size-6 text-slate-400" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium">
            You
          </div>
        </div>

        {/* Booking info strip */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-[10px] text-slate-300">Booking</p>
          <p className="font-mono text-xs font-semibold">
            {callBookingId}
          </p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-5 pb-safe sm:gap-6">
        <button
          onClick={handleToggleMute}
          className={cn(
            "flex size-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 sm:size-14",
            muted ? "bg-rose-600" : "bg-white/10 hover:bg-white/20"
          )}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>
        <button
          onClick={handleToggleCamera}
          className={cn(
            "flex size-12 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 sm:size-14",
            cameraOff ? "bg-rose-600" : "bg-white/10 hover:bg-white/20"
          )}
          aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {cameraOff ? (
            <VideoOff className="size-5" />
          ) : (
            <VideoIcon className="size-5" />
          )}
        </button>
        <button
          onClick={endActiveCall}
          className="flex size-14 items-center justify-center rounded-full bg-rose-600 shadow-lg shadow-rose-600/40 transition-all hover:bg-rose-700 active:scale-95 sm:size-16"
          aria-label="End call"
        >
          <PhoneOff className="size-6" />
        </button>
      </div>
    </div>
  );
}
