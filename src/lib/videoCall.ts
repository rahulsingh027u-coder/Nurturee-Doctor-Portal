"use client";

/**
 * WebRTC video call manager for the Nurturee customer ↔ doctor portal.
 *
 * Since both portals run on the same origin (the doctor portal is reachable
 * via `#doctor`), we use BroadcastChannel as the signaling channel — no
 * WebSocket server needed. Two browser tabs (customer + doctor) exchange
 * SDP offer/answer and ICE candidates over BroadcastChannel, then establish
 * a direct RTCPeerConnection for audio + video.
 *
 * Signaling protocol (all messages broadcast on channel "nurturee-video"):
 *
 *   { kind: "lock-slot",     bookingId, from }
 *   { kind: "unlock-slot",   bookingId, from }
 *   { kind: "call-offer",    bookingId, from, to, sdp }
 *   { kind: "call-answer",   bookingId, from, to, sdp }
 *   { kind: "ice",           bookingId, from, to, candidate }
 *   { kind: "call-end",      bookingId, from, to }
 *   { kind: "call-rejected", bookingId, from, to }
 */

export type SignalMessage =
  | { kind: "lock-slot"; bookingId: string; from: string }
  | { kind: "unlock-slot"; bookingId: string; from: string }
  | {
      kind: "call-offer";
      bookingId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      kind: "call-answer";
      bookingId: string;
      from: string;
      to: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      kind: "ice";
      bookingId: string;
      from: string;
      to: string;
      candidate: RTCIceCandidateInit;
    }
  | { kind: "call-end"; bookingId: string; from: string; to: string }
  | { kind: "call-rejected"; bookingId: string; from: string; to: string };

export type CallRole = "caller" | "callee";

export interface VideoCallEvents {
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onStatusChange?: (status: "connecting" | "connected" | "ended" | "failed") => void;
  onIceConnectionChange?: (state: RTCIceConnectionState) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export class VideoCallManager {
  readonly peerId: string;
  private channel: BroadcastChannel | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private events: VideoCallEvents = {};
  private currentBookingId: string | null = null;
  private currentRole: CallRole | null = null;
  private remotePeerId: string | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  constructor(events: VideoCallEvents = {}) {
    this.peerId = `peer-${Math.random().toString(36).slice(2, 10)}`;
    this.events = events;
  }

  /** Start listening for signaling messages. */
  start() {
    if (typeof window === "undefined") return;
    this.channel = new BroadcastChannel("nurturee-video");
    this.channel.onmessage = (e: MessageEvent<SignalMessage>) =>
      this.handleSignal(e.data);
  }

  /** Stop everything: close peer connection + signaling channel. */
  stop() {
    this.endCall();
    this.channel?.close();
    this.channel = null;
  }

  private send(msg: SignalMessage) {
    this.channel?.postMessage(msg);
  }

  private async handleSignal(msg: SignalMessage) {
    // Filter: ignore messages not for me (unless broadcast like lock-slot)
    if ("to" in msg && msg.to !== this.peerId) return;
    // Ignore my own echoes
    if (msg.from === this.peerId) return;

    switch (msg.kind) {
      case "lock-slot":
      case "unlock-slot":
        // Handled by store via subscription — fire a custom event
        window.dispatchEvent(
          new CustomEvent("nurturee-signal", { detail: msg })
        );
        break;

      case "call-offer":
        // Incoming call — notify store
        this.currentBookingId = msg.bookingId;
        this.currentRole = "callee";
        this.remotePeerId = msg.from;
        window.dispatchEvent(
          new CustomEvent("nurturee-signal", {
            detail: {
              kind: "incoming-call",
              bookingId: msg.bookingId,
              from: msg.from,
              sdp: msg.sdp,
            },
          })
        );
        break;

      case "call-answer":
        // Caller receives answer
        if (this.pc && this.currentRole === "caller") {
          try {
            await this.pc.setRemoteDescription(
              new RTCSessionDescription(msg.sdp)
            );
            // Flush any pending ICE candidates
            for (const c of this.pendingCandidates) {
              try {
                await this.pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (err) {
                console.warn("addIceCandidate (flush) failed:", err);
              }
            }
            this.pendingCandidates = [];
          } catch (err) {
            console.error("setRemoteDescription (answer) failed:", err);
          }
        }
        break;

      case "ice":
        if (this.pc) {
          try {
            // If we don't have remote description yet (caller side), queue
            if (
              this.currentRole === "caller" &&
              !this.pc.remoteDescription
            ) {
              this.pendingCandidates.push(msg.candidate);
            } else {
              await this.pc.addIceCandidate(
                new RTCIceCandidate(msg.candidate)
              );
            }
          } catch (err) {
            console.warn("addIceCandidate failed:", err);
          }
        }
        break;

      case "call-end":
        this.events.onStatusChange?.("ended");
        window.dispatchEvent(
          new CustomEvent("nurturee-signal", {
            detail: { kind: "call-ended", bookingId: msg.bookingId },
          })
        );
        this.cleanupCall();
        break;

      case "call-rejected":
        this.events.onStatusChange?.("ended");
        window.dispatchEvent(
          new CustomEvent("nurturee-signal", {
            detail: { kind: "call-rejected", bookingId: msg.bookingId },
          })
        );
        this.cleanupCall();
        break;
    }
  }

  /** Caller (doctor) starts a call: get local media, create offer, send. */
  async startCall(bookingId: string, remotePeerId: string): Promise<void> {
    this.currentBookingId = bookingId;
    this.currentRole = "caller";
    this.remotePeerId = remotePeerId;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.events.onLocalStream?.(this.localStream);

      this.pc = this.createPeerConnection();
      this.localStream.getTracks().forEach((t) => this.pc!.addTrack(t, this.localStream!));

      this.events.onStatusChange?.("connecting");

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      this.send({
        kind: "call-offer",
        bookingId,
        from: this.peerId,
        to: remotePeerId,
        sdp: offer,
      });
    } catch (err) {
      console.error("startCall failed:", err);
      this.events.onStatusChange?.("failed");
      this.cleanupCall();
      throw err;
    }
  }

  /** Callee (customer) accepts the incoming call: get media, answer. */
  async acceptCall(
    bookingId: string,
    remotePeerId: string,
    offerSdp: RTCSessionDescriptionInit
  ): Promise<void> {
    this.currentBookingId = bookingId;
    this.currentRole = "callee";
    this.remotePeerId = remotePeerId;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.events.onLocalStream?.(this.localStream);

      this.pc = this.createPeerConnection();
      this.localStream.getTracks().forEach((t) => this.pc!.addTrack(t, this.localStream!));

      await this.pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.send({
        kind: "call-answer",
        bookingId,
        from: this.peerId,
        to: remotePeerId,
        sdp: answer,
      });

      this.events.onStatusChange?.("connecting");
    } catch (err) {
      console.error("acceptCall failed:", err);
      this.events.onStatusChange?.("failed");
      this.cleanupCall();
      throw err;
    }
  }

  /** Reject an incoming call. */
  rejectCall(bookingId: string, remotePeerId: string): void {
    this.send({
      kind: "call-rejected",
      bookingId,
      from: this.peerId,
      to: remotePeerId,
    });
    this.cleanupCall();
  }

  /** End an active call. */
  endCall(): void {
    if (this.currentBookingId && this.remotePeerId) {
      this.send({
        kind: "call-end",
        bookingId: this.currentBookingId,
        from: this.peerId,
        to: this.remotePeerId,
      });
    }
    this.cleanupCall();
  }

  /** Toggle mute on local audio track. Returns new muted state. */
  toggleMute(): boolean {
    if (!this.localStream) return false;
    const audio = this.localStream.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      return !audio.enabled; // true = muted
    }
    return false;
  }

  /** Toggle local camera. Returns new state (true = camera off). */
  toggleCamera(): boolean {
    if (!this.localStream) return false;
    const video = this.localStream.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      return !video.enabled; // true = off
    }
    return false;
  }

  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.ontrack = (e) => {
      this.remoteStream = e.streams[0];
      this.events.onRemoteStream?.(this.remoteStream);
      this.events.onStatusChange?.("connected");
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && this.currentBookingId && this.remotePeerId) {
        this.send({
          kind: "ice",
          bookingId: this.currentBookingId,
          from: this.peerId,
          to: this.remotePeerId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      this.events.onIceConnectionChange?.(pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        this.events.onStatusChange?.("failed");
      }
    };

    return pc;
  }

  private cleanupCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.remoteStream = null;
    this.currentBookingId = null;
    this.currentRole = null;
    this.remotePeerId = null;
    this.pendingCandidates = [];
  }
}
