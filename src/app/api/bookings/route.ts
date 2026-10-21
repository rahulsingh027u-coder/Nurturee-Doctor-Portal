import { NextResponse } from "next/server";
import { requireDoctorAuth, checkDoctorOwnership } from '@/lib/require-doctor-auth';
import { db } from "@/lib/db";

// GET /api/bookings?doctorId=xxx&date=xxx&status=xxx
// doctorId param is User.id from NextAuth session.
// We resolve ALL possible IDs (User.id, DoctorProfile.id, Doctor.id) so the
// doctor sees bookings from every source (portal POST + customer app).
export async function GET(req: Request) {
  try {
    const auth = await requireDoctorAuth();
    if (!auth.ok) return auth.response;
    const { searchParams } = new URL(req.url);
    const doctorIdParam = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (doctorIdParam) {
      const ownershipError = await checkDoctorOwnership(doctorIdParam, auth);
      if (ownershipError) return ownershipError;
      const possibleIds = new Set<string>([doctorIdParam]);

      // Find DoctorProfile by userId
      const profile = await db.doctorProfile.findUnique({ where: { userId: doctorIdParam } });
      if (profile) possibleIds.add(profile.id);

      // Find the User to get their phone + email
      const user = await db.user.findUnique({ where: { id: doctorIdParam } });

      // Find Doctor records matching by phone OR email (customer app uses Doctor.id)
      if (user) {
        const doctors = await db.doctor.findMany({
          where: {
            OR: [
              ...(user.phone ? [{ phone: user.phone }] : []),
              ...(user.email ? [{ email: user.email }] : []),
            ],
          },
          select: { id: true },
        });
        doctors.forEach((d) => possibleIds.add(d.id));
      }

      where.doctorId = { in: Array.from(possibleIds) };
    }

    if (status) where.status = status;
    if (date) where.date = date;
    if (from && to) {
      where.date = { gte: from, lte: to };
    } else if (from) {
      where.date = { gte: from };
    }

    const bookings = await (db as any).booking.findMany({
      where,
      include: { patient: true },
      orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
      take: 200,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/bookings — create a new booking (doctor consultation from customer)
export async function POST(req: Request) {
  try {
    const auth = await requireDoctorAuth();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const {
      doctorId, patientName, patientPhone, patientGender, mode,
      date, timeSlot, notes, price, serviceName, category,
    } = body as any;

    if (!doctorId || !patientName || !patientPhone || !date || !timeSlot || !price) {
      return NextResponse.json(
        { error: "doctorId, patientName, patientPhone, date, timeSlot, and price are required" },
        { status: 400 }
      );
    }

    const existingPatient = await db.patient.findUnique({ where: { phone: patientPhone } as any });
    let patientId: string;
    if (existingPatient) {
      patientId = existingPatient.id;
      await db.patient.update({
        where: { id: patientId },
        data: { name: patientName, ...(patientGender ? { gender: patientGender } : {}) },
      });
    } else {
      const patient = await db.patient.create({
        data: { name: patientName, phone: patientPhone, gender: patientGender || "Other" },
      });
      patientId = patient.id;
    }

    const booking = await (db as any).booking.create({
      data: {
        patientId, doctorId, serviceId: "",
        serviceName: serviceName || "Doctor Consultation",
        category: category || "doctor", mode: mode || "online",
        date, timeSlot, notes: notes || null, price, status: "pending",
      },
      include: { patient: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

// PATCH /api/bookings — update booking status
export async function PATCH(req: Request) {
  try {
    const auth = await requireDoctorAuth();
    if (!auth.ok) return auth.response;
    const { id, status, callDuration, cancelReason } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (callDuration !== undefined) data.callDuration = callDuration;
    if (cancelReason) data.cancelReason = cancelReason;

    const booking = await (db as any).booking.update({ where: { id }, data });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
