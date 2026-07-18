import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/bookings?doctorId=xxx&date=xxx&status=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (doctorId) {
      // Resolve User ID to DoctorProfile ID
      const profile = await db.doctorProfile.findUnique({ where: { userId: doctorId } });
      where.doctorId = profile ? profile.id : doctorId;
    }
    if (status) where.status = status;
    if (date) where.date = date;
    if (from && to) {
      where.date = { gte: from, lte: to };
    } else if (from) {
      where.date = { gte: from };
    }

    const bookings = await db.booking.findMany({
      where,
      include: { patient: true },
      orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
      take: 200,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/bookings — create a new booking (doctor consultation from customer)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      doctorId,
      patientName,
      patientPhone,
      patientGender,
      mode,
      date,
      timeSlot,
      notes,
      price,
      serviceName,
      category,
    } = body as {
      doctorId?: string;
      patientName?: string;
      patientPhone?: string;
      patientGender?: string;
      mode?: string;
      date?: string;
      timeSlot?: string;
      notes?: string;
      price?: number;
      serviceName?: string;
      category?: string;
    };

    if (!doctorId || !patientName || !patientPhone || !date || !timeSlot || !price) {
      return NextResponse.json(
        { error: "doctorId, patientName, patientPhone, date, timeSlot, and price are required" },
        { status: 400 }
      );
    }

    // Upsert patient (match by phone, or create new)
    const existingPatient = await db.patient.findUnique({
      where: { phone: patientPhone },
    });

    let patientId: string;
    if (existingPatient) {
      // Update name/gender if they changed
      patientId = existingPatient.id;
      await db.patient.update({
        where: { id: patientId },
        data: {
          name: patientName,
          ...(patientGender ? { gender: patientGender } : {}),
        },
      });
    } else {
      const patient = await db.patient.create({
        data: {
          name: patientName,
          phone: patientPhone,
          gender: patientGender || "Other",
        },
      });
      patientId = patient.id;
    }

    // Create the booking
    const booking = await db.booking.create({
      data: {
        patientId,
        doctorId,
        serviceId: "",
        serviceName: serviceName || "Doctor Consultation",
        category: category || "doctor",
        mode: mode || "online",
        date,
        timeSlot,
        notes: notes || null,
        price,
        status: "pending",
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
    const { id, status, callDuration, cancelReason } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (callDuration !== undefined) data.callDuration = callDuration;
    if (cancelReason) data.cancelReason = cancelReason;

    const booking = await db.booking.update({ where: { id }, data });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}