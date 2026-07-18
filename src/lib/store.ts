"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppView, Booking, CustomerDocument, Service, VideoCallStatus } from "./types";
import { CAREGIVERS } from "./data";
import { VideoCallManager } from "./videoCall";

interface BookingDraftAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  landmark?: string;
}

interface BookingDraft {
  service: Service | null;
  mode: "physical" | "online" | null;
  date: string | null; // ISO yyyy-mm-dd
  timeSlot: string | null;
  address: BookingDraftAddress | null;
  notes: string;
}

/** Per-booking slot lock + incoming-call state (not persisted — runtime only). */
interface SlotState {
  /** True when the doctor has locked this slot — customer sees a "join now" badge. */
  locked: boolean;
  /** True when an incoming video call is ringing for this booking. */
  ringing: boolean;
  /** Remote peer (doctor) id for the active/incoming call. */
  remotePeerId?: string;
  /** Offer SDP for an incoming call (held until customer accepts). */
  pendingOffer?: RTCSessionDescriptionInit;
}

interface IncomingCallInfo {
  bookingId: string;
  fromPeerId: string;
  sdp: RTCSessionDescriptionInit;
}

interface AppState {
  // Navigation
  view: AppView;
  setView: (v: AppView) => void;

  // Booking draft (in-progress booking modal state)
  bookingDraft: BookingDraft;
  isBookingOpen: boolean;
  /** Increments each time openBooking is called — used as React key to reset modal state cleanly. */
  bookingSessionId: number;
  openBooking: (service: Service) => void;
  closeBooking: () => void;
  setDraftMode: (m: "physical" | "online") => void;
  setDraftDate: (d: string) => void;
  setDraftTime: (t: string) => void;
  setDraftAddress: (a: BookingDraftAddress) => void;
  setDraftNotes: (n: string) => void;
  resetDraft: () => void;
  confirmBooking: () => string | null; // returns booking id or null

  // Persisted bookings
  bookings: Booking[];
  cancelBooking: (id: string) => void;

  // Caregiver currently being viewed (post-assignment detail)
  activeCaregiverId: string | null;
  viewCaregiver: (caregiverId: string) => void;

  // Customer documents (prescriptions / reports)
  documents: CustomerDocument[];
  addDocument: (doc: CustomerDocument) => void;
  deleteDocument: (id: string) => void;

  // ============ Video Call ============
  /** Singleton VideoCallManager instance (created lazily on client). */
  vcm: VideoCallManager | null;
  /** Initialise the VCM + signal listeners (call once on app mount). */
  initVideoCall: () => void;
  /** Per-booking slot/call state, keyed by bookingId. */
  slotStates: Record<string, SlotState>;
  /** Currently active call's bookingId (when call panel is open). */
  activeCallBookingId: string | null;
  /** Current call status (separate from per-booking ringing). */
  callStatus: VideoCallStatus;
  /** Incoming call info when ringing. */
  incomingCall: IncomingCallInfo | null;
  /** Local + remote media streams (held here so UI can bind). */
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  /** Customer actions */
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  endActiveCall: () => void;
  /** Doctor (caller) actions */
  doctorLockSlot: (bookingId: string) => void;
  doctorUnlockSlot: (bookingId: string) => void;
  doctorStartCall: (bookingId: string, remotePeerId: string) => Promise<void>;
  /** Internal — set by signal listener */
  _setSlotState: (bookingId: string, patch: Partial<SlotState>) => void;
  _setCallStatus: (status: VideoCallStatus) => void;
  _setStreams: (local?: MediaStream | null, remote?: MediaStream | null) => void;

  // Toast helper (simple bridge — uses window event)
  toast: (msg: string, type?: "default" | "success" | "error") => void;
}

const emptyDraft: BookingDraft = {
  service: null,
  mode: null,
  date: null,
  timeSlot: null,
  address: null,
  notes: "",
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: "home",
      setView: (v) => {
        set({ view: v });
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      },

      bookingDraft: emptyDraft,
      isBookingOpen: false,
      bookingSessionId: 0,
      openBooking: (service) => {
        const defaultMode: "physical" | "online" =
          service.mode === "online" ? "online" : "physical";
        set((s) => ({
          bookingDraft: {
            ...emptyDraft,
            service,
            mode: service.mode === "both" ? defaultMode : defaultMode,
          },
          isBookingOpen: true,
          bookingSessionId: s.bookingSessionId + 1,
        }));
      },
      closeBooking: () => set({ isBookingOpen: false }),
      setDraftMode: (m) =>
        set((s) => ({ bookingDraft: { ...s.bookingDraft, mode: m } })),
      setDraftDate: (d) =>
        set((s) => ({ bookingDraft: { ...s.bookingDraft, date: d } })),
      setDraftTime: (t) =>
        set((s) => ({ bookingDraft: { ...s.bookingDraft, timeSlot: t } })),
      setDraftAddress: (a) =>
        set((s) => ({ bookingDraft: { ...s.bookingDraft, address: a } })),
      setDraftNotes: (n) =>
        set((s) => ({ bookingDraft: { ...s.bookingDraft, notes: n } })),
      resetDraft: () => set({ bookingDraft: emptyDraft }),

      confirmBooking: () => {
        const draft = get().bookingDraft;
        if (!draft.service || !draft.mode || !draft.date || !draft.timeSlot)
          return null;
        if (draft.mode === "physical" && !draft.address) return null;

        // Simulate admin assigning an approved caregiver based on category
        const candidates = CAREGIVERS.filter((c) => {
          if (draft.service!.category === "doctor") {
            return c.id.startsWith("cg-006") || c.specialization.toLowerCase().includes("gynae");
          }
          if (draft.service!.category === "eldercare") {
            return (
              c.specialization.toLowerCase().includes("elder") ||
              c.specialization.toLowerCase().includes("dementia")
            );
          }
          // childcare / nanny
          return (
            c.specialization.toLowerCase().includes("newborn") ||
            c.specialization.toLowerCase().includes("nanny") ||
            c.specialization.toLowerCase().includes("postnatal") ||
            c.specialization.toLowerCase().includes("jappa")
          );
        });
        const chosen =
          candidates[Math.floor(Math.random() * candidates.length)] ||
          CAREGIVERS[0];

        const id = `BK-${Date.now().toString(36).toUpperCase()}`;
        const newBooking: Booking = {
          id,
          serviceId: draft.service.id,
          serviceName: draft.service.name,
          category: draft.service.category,
          mode: draft.mode,
          date: draft.date,
          timeSlot: draft.timeSlot,
          address: draft.mode === "physical" ? draft.address! : undefined,
          notes: draft.notes || undefined,
          price:
            draft.mode === "online" && draft.service.onlinePrice
              ? draft.service.onlinePrice
              : draft.mode === "physical" && draft.service.inHomePrice
              ? draft.service.inHomePrice
              : draft.service.price,
          status: "caregiver-assigned",
          caregiverId: chosen.id,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          bookings: [newBooking, ...s.bookings],
          isBookingOpen: false,
          bookingDraft: emptyDraft,
          activeCaregiverId: chosen.id,
        }));

        return id;
      },

      bookings: [],
      cancelBooking: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, status: "cancelled" } : b
          ),
        })),

      activeCaregiverId: null,
      viewCaregiver: (caregiverId) =>
        set({ activeCaregiverId: caregiverId, view: "caregiver-profile" }),

      documents: [],
      addDocument: (doc) =>
        set((s) => ({ documents: [doc, ...s.documents] })),
      deleteDocument: (id) =>
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      // ============ Video Call ============
      vcm: null,
      slotStates: {},
      activeCallBookingId: null,
      callStatus: "idle",
      incomingCall: null,
      localStream: null,
      remoteStream: null,

      initVideoCall: () => {
        if (typeof window === "undefined") return;
        const existing = get().vcm;
        if (existing) return; // already initialised

        const vcm = new VideoCallManager({
          onLocalStream: (stream) => get()._setStreams(stream, undefined),
          onRemoteStream: (stream) => get()._setStreams(undefined, stream),
          onStatusChange: (status) => get()._setCallStatus(status),
        });
        vcm.start();

        // Listen for signaling events from BroadcastChannel
        const handler = (e: Event) => {
          const detail = (e as CustomEvent).detail as {
            kind: string;
            bookingId: string;
            from?: string;
            sdp?: RTCSessionDescriptionInit;
          };

          switch (detail.kind) {
            case "lock-slot": {
              get()._setSlotState(detail.bookingId, { locked: true });
              // Only toast if customer is not the one who locked it (different tab)
              if (detail.from !== vcm.peerId) {
                get().toast(
                  "Your time slot has been locked by the doctor. Tap Join Video Call when ready.",
                  "success"
                );
                // Play a soft beep via Web Audio
                try {
                  const ctx = new (window.AudioContext ||
                    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.frequency.value = 880;
                  gain.gain.value = 0.1;
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.15);
                  osc.onended = () => ctx.close();
                } catch {
                  // ignore
                }
              }
              break;
            }
            case "unlock-slot": {
              get()._setSlotState(detail.bookingId, { locked: false });
              break;
            }
            case "incoming-call": {
              // Customer receives an incoming call
              get()._setSlotState(detail.bookingId, {
                ringing: true,
                remotePeerId: detail.from,
                pendingOffer: detail.sdp,
              });
              set({
                incomingCall: {
                  bookingId: detail.bookingId,
                  fromPeerId: detail.from!,
                  sdp: detail.sdp!,
                },
                callStatus: "ringing",
              });
              get().toast(
                "Incoming video call from your doctor — tap Join to answer.",
                "default"
              );
              break;
            }
            case "call-ended": {
              get()._setSlotState(detail.bookingId, {
                ringing: false,
                pendingOffer: undefined,
              });
              set({
                activeCallBookingId: null,
                callStatus: "idle",
                incomingCall: null,
                localStream: null,
                remoteStream: null,
              });
              get().toast("Video call ended.", "default");
              break;
            }
            case "call-rejected": {
              set({
                activeCallBookingId: null,
                callStatus: "idle",
              });
              get().toast("Call was rejected.", "default");
              break;
            }
          }
        };
        window.addEventListener("nurturee-signal", handler);

        // Store vcm + handler reference for cleanup (we never actually clean up
        // in this demo — it lives for the page lifetime)
        set({ vcm });
      },

      _setSlotState: (bookingId, patch) =>
        set((s) => ({
          slotStates: {
            ...s.slotStates,
            [bookingId]: { locked: false, ringing: false, ...s.slotStates[bookingId], ...patch },
          },
        })),

      _setCallStatus: (status) => set({ callStatus: status }),

      _setStreams: (local, remote) =>
        set((s) => ({
          localStream: local !== undefined ? local : s.localStream,
          remoteStream: remote !== undefined ? remote : s.remoteStream,
        })),

      // ===== Doctor actions =====
      doctorLockSlot: (bookingId) => {
        const vcm = get().vcm;
        if (!vcm) return;
        // Broadcast lock via signaling channel
        const bc = new BroadcastChannel("nurturee-video");
        bc.postMessage({ kind: "lock-slot", bookingId, from: vcm.peerId });
        bc.close();
        get()._setSlotState(bookingId, { locked: true });
        get().toast("Slot locked. Customer has been notified.", "success");
      },

      doctorUnlockSlot: (bookingId) => {
        const vcm = get().vcm;
        if (!vcm) return;
        const bc = new BroadcastChannel("nurturee-video");
        bc.postMessage({ kind: "unlock-slot", bookingId, from: vcm.peerId });
        bc.close();
        get()._setSlotState(bookingId, { locked: false });
      },

      doctorStartCall: async (bookingId, remotePeerId) => {
        const vcm = get().vcm;
        if (!vcm) {
          get().toast("Video call not initialised.", "error");
          return;
        }
        set({ activeCallBookingId: bookingId });
        try {
          await vcm.startCall(bookingId, remotePeerId);
        } catch (err) {
          console.error("doctorStartCall failed:", err);
          get().toast(
            "Could not access camera/microphone. Please grant permission.",
            "error"
          );
          set({ activeCallBookingId: null });
        }
      },

      // ===== Customer actions =====
      acceptIncomingCall: async () => {
        const { incomingCall, vcm } = get();
        if (!incomingCall || !vcm) return;
        set({
          activeCallBookingId: incomingCall.bookingId,
          callStatus: "connecting",
        });
        try {
          await vcm.acceptCall(
            incomingCall.bookingId,
            incomingCall.fromPeerId,
            incomingCall.sdp
          );
          // Clear ringing state
          get()._setSlotState(incomingCall.bookingId, {
            ringing: false,
            pendingOffer: undefined,
          });
          set({ incomingCall: null });
        } catch (err) {
          console.error("acceptIncomingCall failed:", err);
          get().toast(
            "Could not access camera/microphone. Please grant permission.",
            "error"
          );
          set({
            activeCallBookingId: null,
            callStatus: "idle",
            incomingCall: null,
          });
        }
      },

      rejectIncomingCall: () => {
        const { incomingCall, vcm } = get();
        if (!incomingCall || !vcm) return;
        vcm.rejectCall(incomingCall.bookingId, incomingCall.fromPeerId);
        get()._setSlotState(incomingCall.bookingId, {
          ringing: false,
          pendingOffer: undefined,
        });
        set({ incomingCall: null, callStatus: "idle" });
        get().toast("Call rejected.", "default");
      },

      endActiveCall: () => {
        const { vcm } = get();
        if (vcm) vcm.endCall();
        set({
          activeCallBookingId: null,
          callStatus: "idle",
          incomingCall: null,
          localStream: null,
          remoteStream: null,
        });
      },

      toast: (msg, type = "default") => {
        if (typeof window === "undefined") return;
        window.dispatchEvent(
          new CustomEvent("nurturee-toast", { detail: { msg, type } })
        );
      },
    }),
    {
      name: "nurturee-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // SSR-safe noop storage
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      // Only persist bookings & documents, not transient UI state
      partialize: (s) => ({
        bookings: s.bookings,
        documents: s.documents,
      }),
    }
  )
);
