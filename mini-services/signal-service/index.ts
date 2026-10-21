import { Server } from "socket.io";

const PORT = 3003;
const io = new Server(PORT, {
  cors: { origin: ["https://nurturee.in", "https://doctor.nurturee.in", "http://localhost:3001", "http://localhost:3002"] },
});

console.log(`[signal-service] Running on port ${PORT}`);

// Track online peers
const peers = new Map<string, { socketId: string; role: string; doctorId?: string; patientId?: string }>();

io.on("connection", (socket) => {
  console.log(`[signal] Connected: ${socket.id}`);

  // Register peer
  socket.on("register", (data: { peerId: string; role: string; doctorId?: string; patientId?: string }) => {
    peers.set(data.peerId, { socketId: socket.id, ...data });
    socket.data = data;
    console.log(`[signal] Registered: ${data.peerId} (${data.role})`);
  });

  // Forward signaling messages
  socket.on("signal", (data: { to: string; kind: string; payload: unknown }) => {
    const target = peers.get(data.to);
    if (target) {
      io.to(target.socketId).emit("signal", {
        from: socket.data.peerId,
        kind: data.kind,
        payload: data.payload,
      });
    }
  });

  // Lock time slot notification
  socket.on("lock-slot", (data: { bookingId: string; toPeerId: string }) => {
    const target = peers.get(data.toPeerId);
    if (target) {
      io.to(target.socketId).emit("slot-locked", { bookingId: data.bookingId, from: socket.data.peerId });
    }
  });

  socket.on("unlock-slot", (data: { bookingId: string; toPeerId: string }) => {
    const target = peers.get(data.toPeerId);
    if (target) {
      io.to(target.socketId).emit("slot-unlocked", { bookingId: data.bookingId, from: socket.data.peerId });
    }
  });

  // New booking notification
  socket.on("notify-booking", (data: { doctorId: string; booking: unknown }) => {
    for (const [, peer] of peers) {
      if (peer.role === "doctor" && peer.doctorId === data.doctorId) {
        io.to(peer.socketId).emit("new-booking", data.booking);
      }
    }
  });

  // Prescription sent notification
  socket.on("notify-prescription", (data: { patientId: string; prescription: unknown }) => {
    for (const [, peer] of peers) {
      if (peer.role === "customer" && peer.patientId === data.patientId) {
        io.to(peer.socketId).emit("prescription-received", data.prescription);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`[signal] Disconnected: ${socket.id}`);
    for (const [peerId, peer] of peers) {
      if (peer.socketId === socket.id) {
        peers.delete(peerId);
        break;
      }
    }
  });
});