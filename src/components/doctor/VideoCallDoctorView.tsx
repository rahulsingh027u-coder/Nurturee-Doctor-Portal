"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  Clock,
  User,
  Camera,
  Monitor,
  CheckCircle,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VideoCallDoctorViewProps {
  doctorId: string;
  doctorName: string;
}

/** Booking row returned from /api/bookings (with patient relation). */
interface BookingRow {
  id: string;
  patientId?: string | null;
  patient?: { id: string; name: string; phone: string } | null;
  serviceName: string;
  date: string;
  timeSlot: string;
  mode: string;
  status: string;
  callDuration?: number | null;
  prescriptions?: { id: string }[];
}

interface RecentCall extends BookingRow {
  callDuration: number;
}

type CallPhase =
  | "idle"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended"
  | "failed";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const SIGNAL_URL = "/?XTransformPort=3003";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCallDuration(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  if (min === 0) return `${sec} sec`;
  return `${min} min ${sec} sec`;
}

function formatTimerDisplay(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VideoCallDoctorView({
  doctorId,
  doctorName,
}: VideoCallDoctorViewProps) {
  // ── Tabs ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("available");

  // ── Data ──────────────────────────────────────────────────────────────
  const [availableBookings, setAvailableBookings] = useState<BookingRow[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // ── Call state ────────────────────────────────────────────────────────
  const [callPhase, setCallPhase] = useState<CallPhase>("idle");
  const [currentBooking, setCurrentBooking] = useState<BookingRow | null>(
    null
  );
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callEndedDuration, setCallEndedDuration] = useState(0);
  const [showEndedScreen, setShowEndedScreen] = useState(false);
  const [showPrescriptionPrompt, setShowPrescriptionPrompt] = useState(false);

  // ── Draggable PiP ─────────────────────────────────────────────────────
  const [pipPosition, setPipPosition] = useState({ x: 20, y: 20 });
  const pipDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const peerIdRef = useRef<string>(
    `doctor-${Math.random().toString(36).slice(2, 10)}`
  );

  // ── Fetch available bookings (today, confirmed, online, no prescription yet) ──
  const fetchAvailable = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      // Fetch all confirmed/in-progress online bookings for today
      const res = await fetch(
        `/api/bookings?doctorId=${doctorId}&date=${today}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const allTodayBookings: BookingRow[] = await res.json();

      // Filter: online, confirmed, no prescriptions yet
      // We also need to check prescriptions separately
      const prescriptionRes = await fetch(
        `/api/prescriptions?doctorId=${doctorId}`
      );
      const prescriptions: { bookingId?: string }[] = prescriptionRes.ok
        ? await prescriptionRes.json()
        : [];
      const bookingIdsWithRx = new Set(
        prescriptions.map((p) => p.bookingId).filter(Boolean)
      );

      const filtered = allTodayBookings.filter(
        (b) =>
          b.mode === "online" &&
          (b.status === "confirmed" || b.status === "in-progress") &&
          !bookingIdsWithRx.has(b.id)
      );

      setAvailableBookings(filtered);
    } catch (err) {
      console.error("Failed to fetch available bookings:", err);
    } finally {
      setLoadingAvailable(false);
    }
  }, [doctorId]);

  // ── Fetch recent calls (completed online bookings with callDuration) ──
  const fetchRecent = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const res = await fetch(
        `/api/bookings?doctorId=${doctorId}&status=completed`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const allCompleted: BookingRow[] = await res.json();

      // Filter: online mode, has callDuration
      const filtered = allCompleted
        .filter((b) => b.mode === "online" && b.callDuration != null && b.callDuration > 0)
        .slice(0, 20) as RecentCall[];

      setRecentCalls(filtered);
    } catch (err) {
      console.error("Failed to fetch recent calls:", err);
    } finally {
      setLoadingRecent(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchAvailable();
    fetchRecent();
  }, [fetchAvailable, fetchRecent]);

  // ── Socket.IO connection ──────────────────────────────────────────────
  useEffect(() => {
    const socket: Socket = io(SIGNAL_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[VideoCallDoctor] Socket connected:", socket.id);
      socket.emit("register", {
        peerId: peerIdRef.current,
        role: "doctor",
        doctorId,
      });
    });

    socket.on("signal", async (data: { from: string; kind: string; payload: unknown }) => {
      const { from, kind, payload } = data;
      const pc = pcRef.current;

      switch (kind) {
        case "call-answer": {
          if (pc) {
            try {
              await pc.setRemoteDescription(
                new RTCSessionDescription(payload as RTCSessionDescriptionInit)
              );
              // Flush pending ICE candidates
              for (const c of pendingCandidatesRef.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch {
                  // ignore
                }
              }
              pendingCandidatesRef.current = [];
            } catch (err) {
              console.error("setRemoteDescription (answer) error:", err);
            }
          }
          break;
        }

        case "ice": {
          if (pc) {
            try {
              if (!pc.remoteDescription) {
                pendingCandidatesRef.current.push(
                  payload as RTCIceCandidateInit
                );
              } else {
                await pc.addIceCandidate(
                  new RTCIceCandidate(payload as RTCIceCandidateInit)
                );
              }
            } catch {
              // ignore
            }
          }
          break;
        }

        case "call-end": {
          handleEndCall();
          break;
        }

        case "call-rejected": {
          setCallPhase("failed");
          setTimeout(() => {
            resetCallState();
          }, 2000);
          break;
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("[VideoCallDoctor] Socket disconnected");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [doctorId]);

  // ── Bind streams to video elements ────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ── Call timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (callPhase === "connected") {
      callStartTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - callStartTimeRef.current) / 1000
        );
        setCallDuration(elapsed);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callPhase]);

  // ── Create RTCPeerConnection ──────────────────────────────────────────
  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.ontrack = (e) => {
      if (e.streams[0]) {
        setRemoteStream(e.streams[0]);
        setCallPhase("connected");
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current && currentBooking) {
        socketRef.current.emit("signal", {
          to: currentBooking.patientId,
          kind: "ice",
          payload: e.candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        setCallPhase("failed");
        setTimeout(() => resetCallState(), 2000);
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // ── Start call ────────────────────────────────────────────────────────
  const handleStartCall = async (booking: BookingRow) => {
    try {
      setCurrentBooking(booking);
      setCallPhase("ringing");
      setCallDuration(0);

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      // Create peer connection and add tracks
      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      setCallPhase("connecting");

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send via WebSocket
      socketRef.current?.emit("signal", {
        to: booking.patientId,
        kind: "call-offer",
        payload: offer,
      });
    } catch (err) {
      console.error("Failed to start call:", err);
      setCallPhase("failed");
      setTimeout(() => resetCallState(), 2000);
    }
  };

  // ── End call ──────────────────────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    const pc = pcRef.current;
    const socket = socketRef.current;
    const stream = localStream;

    // Send call-end signal
    if (socket && currentBooking) {
      socket.emit("signal", {
        to: currentBooking.patientId,
        kind: "call-end",
      });
    }

    // Update booking with call duration via API
    if (currentBooking && callDuration > 0) {
      fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentBooking.id,
          status: "completed",
          callDuration,
        }),
      }).catch(() => {});
    }

    // Capture final duration before cleanup
    const finalDuration = callDuration;

    // Stop local stream tracks
    stream?.getTracks().forEach((t) => t.stop());

    // Close peer connection
    pc?.close();
    pcRef.current = null;
    pendingCandidatesRef.current = [];

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);

    // Show ended screen
    setCallEndedDuration(finalDuration);
    setCallPhase("ended");
    setShowEndedScreen(true);
  }, [currentBooking, localStream, callDuration]);

  // ── Reset call state ──────────────────────────────────────────────────
  const resetCallState = useCallback(() => {
    setCallPhase("idle");
    setCurrentBooking(null);
    setCallDuration(0);
    setCallEndedDuration(0);
    setShowEndedScreen(false);
    setShowPrescriptionPrompt(false);
    setRemoteStream(null);
    setLocalStream(null);
    setIsMuted(false);
    setIsCameraOff(false);

    const pc = pcRef.current;
    const stream = localStream;
    stream?.getTracks().forEach((t) => t.stop());
    pc?.close();
    pcRef.current = null;
    pendingCandidatesRef.current = [];

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Refresh data
    fetchAvailable();
    fetchRecent();
  }, [localStream, fetchAvailable, fetchRecent]);

  // ── Toggle mic ────────────────────────────────────────────────────────
  const handleToggleMic = useCallback(() => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, [localStream]);

  // ── Toggle camera ─────────────────────────────────────────────────────
  const handleToggleCamera = useCallback(() => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  }, [localStream]);

  // ── Prescription prompt handlers ──────────────────────────────────────
  const handleGoToPrescription = () => {
    setShowPrescriptionPrompt(false);
    setShowEndedScreen(false);
    resetCallState();
    // Dispatch a custom event so the parent can navigate to the prescription view
    window.dispatchEvent(
      new CustomEvent("doctor-navigate", { detail: "prescriptions" })
    );
  };

  const handleSkipPrescription = () => {
    setShowPrescriptionPrompt(false);
    setShowEndedScreen(false);
    resetCallState();
  };

  // ── Draggable PiP handlers ────────────────────────────────────────────
  const handlePipPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pipDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pipPosition.x,
      origY: pipPosition.y,
    };
  };

  const handlePipPointerMove = (e: React.PointerEvent) => {
    if (!pipDragRef.current) return;
    const dx = e.clientX - pipDragRef.current.startX;
    const dy = e.clientY - pipDragRef.current.startY;
    setPipPosition({
      x: pipDragRef.current.origX + dx,
      y: pipDragRef.current.origY + dy,
    });
  };

  const handlePipPointerUp = () => {
    pipDragRef.current = null;
  };

  // =====================================================================
  // Active Call UI (full-screen overlay)
  // =====================================================================
  if (callPhase !== "idle") {
    // ── Call Ended Screen ───────────────────────────────────────────────
    if (showEndedScreen && callPhase === "ended") {
      return (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-gray-900 text-white">
          <div className="flex flex-col items-center gap-6 px-6 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-blue-600/20">
              <CheckCircle className="size-10 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Call Ended</h2>
              <p className="mt-2 text-gray-400">
                Duration:{" "}
                <span className="font-medium text-white">
                  {formatCallDuration(callEndedDuration)}
                </span>
              </p>
            </div>

            {!showPrescriptionPrompt && currentBooking && (
              <div className="mt-4 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="size-5 text-blue-500" />
                  <p className="text-sm font-medium text-gray-200">
                    Would you like to write a prescription for this patient?
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleGoToPrescription}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                  >
                    Yes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSkipPrescription}
                    className="flex-1 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
                  >
                    No
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={resetCallState}
              variant="ghost"
              className="mt-4 text-gray-400 hover:text-white hover:bg-white/10"
            >
              Back to Video Consultations
            </Button>
          </div>
        </div>
      );
    }

    // ── Active / Connecting / Ringing Call Screen ───────────────────────
    const patientName = currentBooking?.patient?.name ?? "Patient";

    return (
      <div className="fixed inset-0 z-[90] flex flex-col bg-gray-900 text-white select-none">
        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="relative z-20 flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{patientName}</p>
            <p className="truncate text-xs text-gray-400">
              Online Consultation
            </p>
          </div>
          <div className="flex items-center gap-2">
            {callPhase === "connected" && (
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-300 tabular-nums">
                  {formatTimerDisplay(callDuration)}
                </span>
              </div>
            )}
            {callPhase === "connecting" && (
              <div className="flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1">
                <Loader2 className="size-3 animate-spin text-amber-300" />
                <span className="text-xs font-medium text-amber-300">
                  Connecting
                </span>
              </div>
            )}
            {callPhase === "ringing" && (
              <div className="flex items-center gap-2 rounded-full bg-blue-600/20 px-3 py-1">
                <span className="size-2 rounded-full bg-blue-500 animate-ping" />
                <span className="text-xs font-medium text-blue-300">
                  Ringing
                </span>
              </div>
            )}
            {callPhase === "failed" && (
              <div className="flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1">
                <AlertCircle className="size-3 text-red-300" />
                <span className="text-xs font-medium text-red-300">
                  Failed
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Remote video (full screen) ───────────────────────────────── */}
        <div className="relative flex-1 overflow-hidden bg-gray-950">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="size-full object-cover"
            muted={false}
          />

          {/* Placeholder when no remote stream */}
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl font-bold shadow-2xl">
                {getInitials(patientName)}
              </div>
              {callPhase === "ringing" && (
                <>
                  <p className="text-lg font-medium text-gray-200">
                    Calling {patientName}...
                  </p>
                  <p className="text-sm text-gray-500">
                    Waiting for patient to answer
                  </p>
                </>
              )}
              {callPhase === "connecting" && (
                <>
                  <Loader2 className="size-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-400">
                    Establishing secure connection...
                  </p>
                </>
              )}
              {callPhase === "failed" && (
                <>
                  <AlertCircle className="size-8 text-red-400" />
                  <p className="text-sm text-gray-400">
                    Connection failed. The patient may be unreachable.
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── Local video PiP (draggable) ────────────────────────────── */}
          <div
            className="absolute z-10 overflow-hidden rounded-2xl border-2 border-white/20 bg-gray-800 shadow-2xl"
            style={{
              width: 200,
              height: 150,
              right: pipPosition.x,
              bottom: pipPosition.y,
            }}
            onPointerDown={handlePipPointerDown}
            onPointerMove={handlePipPointerMove}
            onPointerUp={handlePipPointerUp}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="size-full -scale-x-100 object-cover"
            />

            {/* Camera off overlay */}
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="size-8 text-gray-500" />
              </div>
            )}

            {/* No stream yet */}
            {!localStream && !isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <Loader2 className="size-6 animate-spin text-gray-600" />
              </div>
            )}

            {/* "You" label */}
            <div className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
              You
            </div>
          </div>
        </div>

        {/* ── Bottom control bar (pill shaped) ─────────────────────────── */}
        <div className="relative z-20 flex items-center justify-center pb-6 pt-4">
          <div className="flex items-center gap-3 rounded-full bg-gray-800/80 px-5 py-3 shadow-xl backdrop-blur-md">
            {/* Mic toggle */}
            <button
              onClick={handleToggleMic}
              className={cn(
                "flex size-12 items-center justify-center rounded-full transition-all active:scale-95",
                isMuted
                  ? "bg-blue-700 shadow-lg shadow-blue-700/30"
                  : "bg-white/10 hover:bg-white/20"
              )}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff className="size-5" />
              ) : (
                <Mic className="size-5" />
              )}
            </button>

            {/* Camera toggle */}
            <button
              onClick={handleToggleCamera}
              className={cn(
                "flex size-12 items-center justify-center rounded-full transition-all active:scale-95",
                isCameraOff
                  ? "bg-blue-700 shadow-lg shadow-blue-700/30"
                  : "bg-white/10 hover:bg-white/20"
              )}
              aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
            >
              {isCameraOff ? (
                <VideoOff className="size-5" />
              ) : (
                <Video className="size-5" />
              )}
            </button>

            {/* End call */}
            <button
              onClick={handleEndCall}
              className="flex size-14 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/40 transition-all hover:bg-red-700 active:scale-95"
              aria-label="End call"
            >
              <PhoneOff className="size-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // Main View (Video Consultations)
  // =====================================================================
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Video Consultations
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your online appointments and video calls
        </p>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="available">Available Now</TabsTrigger>
          <TabsTrigger value="recent">Recent Calls</TabsTrigger>
        </TabsList>

        {/* ── Available Now Tab ─────────────────────────────────────────── */}
        <TabsContent value="available" className="mt-6">
          {loadingAvailable ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <p className="mt-3 text-sm text-gray-500">
                Loading available consultations...
              </p>
            </div>
          ) : availableBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/50 py-20">
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-50">
                <Video className="size-7 text-blue-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-700">
                No available consultations
              </h3>
              <p className="mt-1 max-w-xs text-center text-sm text-gray-500">
                There are no confirmed online bookings for today that need
                consultation.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="group overflow-hidden border-0 shadow-sm ring-1 ring-gray-200/80 transition-all hover:shadow-md hover:ring-blue-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                          {getInitials(booking.patient?.name ?? "PA")}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-sm font-semibold text-gray-900">
                            {booking.patient?.name ?? "Unknown Patient"}
                          </CardTitle>
                          <p className="truncate text-xs text-gray-500">
                            {booking.patient?.phone ?? "—"}
                          </p>
                        </div>
                      </div>
                      <Badge className="shrink-0 border-0 bg-emerald-50 text-emerald-700">
                        Confirmed
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="size-3.5 shrink-0 text-blue-500" />
                      <span>{booking.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Monitor className="size-3.5 shrink-0 text-blue-500" />
                      <span className="truncate">{booking.serviceName}</span>
                    </div>

                    <Button
                      onClick={() => handleStartCall(booking)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98]"
                    >
                      <Phone className="mr-2 size-4" />
                      Start Call
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Recent Calls Tab ──────────────────────────────────────────── */}
        <TabsContent value="recent" className="mt-6">
          {loadingRecent ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <p className="mt-3 text-sm text-gray-500">
                Loading recent calls...
              </p>
            </div>
          ) : recentCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/50 py-20">
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-50">
                <Clock className="size-7 text-blue-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-700">
                No recent calls
              </h3>
              <p className="mt-1 max-w-xs text-center text-sm text-gray-500">
                Completed video consultations will appear here.
              </p>
            </div>
          ) : (
            <Card className="border-0 shadow-sm ring-1 ring-gray-200/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-700">
                  Call History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Patient</th>
                        <th className="px-6 py-3">Duration</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentCalls.map((call) => (
                        <tr
                          key={call.id}
                          className="transition-colors hover:bg-blue-50/40"
                        >
                          <td className="whitespace-nowrap px-6 py-3.5 text-gray-600">
                            <div className="flex items-center gap-2">
                              <Camera className="size-3.5 text-gray-400" />
                              {format(new Date(call.date), "dd MMM yyyy")}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex size-7 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-700">
                                {getInitials(
                                  call.patient?.name ?? "PA"
                                )}
                              </div>
                              <span className="font-medium text-gray-800">
                                {call.patient?.name ?? "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-3.5 text-gray-600">
                            {formatCallDuration(call.callDuration)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-3.5">
                            <Badge
                              variant="secondary"
                              className="border-0 bg-emerald-50 text-emerald-700"
                            >
                              <CheckCircle className="mr-1 size-3" />
                              Completed
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}export { VideoCallDoctorView };
