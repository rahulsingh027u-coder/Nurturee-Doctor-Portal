import { NextResponse } from "next/server";
import { requireDoctorAuth } from '@/lib/require-doctor-auth';
import { db } from "@/lib/db";

// POST /api/clinics/staff — add staff to clinic (sees all doctors)
// body: { clinicId, name, phone, role, associationType, permissions }
export async function POST(req: Request) {
  try {
    const auth = await requireDoctorAuth();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const { clinicId, name, phone, role, associationType, permissions } = body;

    if (!clinicId || !name || !phone) {
      return NextResponse.json(
        { error: "clinicId, name, and phone are required" },
        { status: 400 }
      );
    }

    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Check for duplicate phone in same clinic
    const existing = await db.staffMember.findFirst({
      where: { clinicId, phone: String(phone) },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A staff member with this phone already exists in this clinic" },
        { status: 409 }
      );
    }

    const staff = await db.staffMember.create({
      data: {
        clinicId,
        name: String(name).trim(),
        phone: String(phone).trim(),
        role: String(role || "manager"),
        associationType: String(associationType || "full-time"),
        permissions: JSON.stringify(permissions || {}),
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error("Clinic staff POST error:", error);
    return NextResponse.json({ error: "Failed to add staff" }, { status: 500 });
  }
}
