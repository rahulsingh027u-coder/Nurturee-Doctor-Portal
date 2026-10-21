import { NextResponse } from "next/server";
import { requireDoctorAuth } from '@/lib/require-doctor-auth';
import { db } from "@/lib/db";

// POST /api/clinics/doctors — add/remove/update doctors in a clinic
// body: { clinicId, doctorIds, action: "add"|"remove" } | { membershipId, department, associationType, action: "update" }
export async function POST(req: Request) {
  try {
    const auth = await requireDoctorAuth();
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const { clinicId, doctorIds, action, membershipId, department, associationType } = body;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    // ── Update a single membership (department, association type) ──
    if (action === "update") {
      if (!membershipId) return NextResponse.json({ error: "membershipId required" }, { status: 400 });

      const data: Record<string, unknown> = {};
      if (department !== undefined) data.department = String(department).trim();
      if (associationType !== undefined) data.associationType = String(associationType);

      const updated = await db.clinicDoctor.update({
        where: { id: membershipId },
        data,
        include: { doctor: { include: { user: { select: { name: true, phone: true, avatar: true } } } } },
      });
      return NextResponse.json(updated);
    }

    // ── Add or remove doctors ──
    if (!clinicId || !doctorIds || !Array.isArray(doctorIds)) {
      return NextResponse.json(
        { error: "clinicId and doctorIds are required" },
        { status: 400 }
      );
    }

    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    if (action === "add") {
      // Add doctors to clinic via ClinicDoctor join table
      for (const docId of doctorIds) {
        // Check if already a member
        const existing = await db.clinicDoctor.findUnique({
          where: { clinicId_doctorId: { clinicId, doctorId: docId } },
        });
        if (existing) {
          // Re-activate if inactive
          await db.clinicDoctor.update({
            where: { id: existing.id },
            data: { isActive: true, department: body.department || existing.department, associationType: body.associationType || existing.associationType },
          });
        } else {
          await db.clinicDoctor.create({
            data: {
              clinicId,
              doctorId: docId,
 department: body.department || "",
              associationType: body.associationType || "full-time",
            },
          });
        }

        // Also set direct clinicId if doctor doesn't have one (backward compat)
        const doc = await db.doctorProfile.findUnique({ where: { id: docId }, select: { clinicId: true } });
        if (doc && !doc.clinicId) {
          await db.doctorProfile.update({ where: { id: docId }, data: { clinicId } });
        }
      }
    } else if (action === "remove") {
      for (const docId of doctorIds) {
        await db.clinicDoctor.deleteMany({
          where: { clinicId, doctorId: docId },
        });
        // Clear direct clinicId if it matches
        const doc = await db.doctorProfile.findUnique({ where: { id: docId }, select: { clinicId: true } });
        if (doc?.clinicId === clinicId) {
          await db.doctorProfile.update({ where: { id: docId }, data: { clinicId: null } });
        }
      }
    }

    // Return updated clinic with memberships
    const updated = await db.clinic.findUnique({
      where: { id: clinicId },
      include: {
        doctorMemberships: {
          where: { isActive: true },
          include: {
            doctor: { include: { user: { select: { name: true, phone: true, avatar: true } } } },
          },
          orderBy: { joinedAt: "asc" },
        },
        staffMembers: {
          include: { user: { select: { name: true, phone: true, avatar: true } } },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Clinic doctors POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}