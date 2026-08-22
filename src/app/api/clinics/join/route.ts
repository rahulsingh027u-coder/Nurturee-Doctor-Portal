import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/clinics/join — doctor joins an existing clinic
// body: { clinicId, doctorId, department?, associationType? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clinicId, doctorId, department, associationType } = body;

    if (!clinicId || !doctorId) {
      return NextResponse.json({ error: "clinicId and doctorId are required" }, { status: 400 });
    }

    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const doctor = await db.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.clinicDoctor.findUnique({
      where: { clinicId_doctorId: { clinicId, doctorId } },
    });
    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ error: "Already a member of this clinic" }, { status: 409 });
      }
      // Re-activate
      const reactivated = await db.clinicDoctor.update({
        where: { id: existing.id },
        data: { isActive: true, department: department || existing.department, associationType: associationType || existing.associationType },
      });
      return NextResponse.json(reactivated);
    }

    const membership = await db.clinicDoctor.create({
      data: {
        clinicId,
        doctorId,
        department: department || "",
        associationType: associationType || "full-time",
      },
      include: { clinic: true },
    });

    // Set direct clinicId if doctor doesn't have one
    if (!doctor.clinicId) {
      await db.doctorProfile.update({ where: { id: doctorId }, data: { clinicId } });
    }

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("Clinic join error:", error);
    return NextResponse.json({ error: "Failed to join clinic" }, { status: 500 });
  }
}
