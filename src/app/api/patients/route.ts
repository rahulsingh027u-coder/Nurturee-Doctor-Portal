import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/patients?doctorId=xxx&search=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const search = searchParams.get("search") || "";

    // Get patients who have bookings with this doctor
    let resolvedDoctorId = doctorId;
    if (doctorId) {
      const profile = await db.doctorProfile.findUnique({ where: { userId: doctorId } });
      if (profile) resolvedDoctorId = profile.id;
    }

    const bookings = await db.booking.findMany({
      where: {
        doctorId: resolvedDoctorId || undefined,
        ...(search ? { patient: { OR: [{ name: { contains: search } }, { phone: { contains: search } }] } } : {}),
      },
      include: { patient: true },
      distinct: ["patientId"],
      orderBy: { date: "desc" },
    });

    const patients = bookings
      .filter((b) => b.patient)
      .map((b) => {
        const pCount = bookings.filter((bb) => bb.patientId === b.patientId).length;
        return { ...b.patient, _bookingCount: pCount, _lastVisit: b.date };
      })
      .filter((p, i, arr) => arr.findIndex((pp) => pp.id === p.id) === i);

    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH /api/patients — update patient (e.g. medicalHistory)
export async function PATCH(req: Request) {
  try {
    const { id, medicalHistory } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (medicalHistory !== undefined) data.medicalHistory = medicalHistory;

    const patient = await db.patient.update({ where: { id }, data });
    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}