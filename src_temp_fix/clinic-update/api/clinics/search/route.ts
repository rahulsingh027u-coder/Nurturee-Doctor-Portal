import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/clinics/search?q=xxx — search clinics by name (for "Join Clinic" flow)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const excludeDoctorId = searchParams.get("excludeDoctorId");

    if (!q || q.trim().length < 2) {
      return NextResponse.json([]);
    }

    // Get clinic IDs the doctor is already a member of
    let memberOfIds: string[] = [];
    if (excludeDoctorId) {
      const memberships = await db.clinicDoctor.findMany({
        where: { doctorId: excludeDoctorId, isActive: true },
        select: { clinicId: true },
      });
      memberOfIds = memberships.map((m) => m.clinicId);
    }

    const clinics = await db.clinic.findMany({
      where: {
        isActive: true,
        name: { contains: q.trim() },
        ...(memberOfIds.length > 0 ? { id: { notIn: memberOfIds } } : {}),
      },
      include: {
        _count: { select: { doctorMemberships: true, staffMembers: true } },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clinics);
  } catch (error) {
    console.error("Clinic search error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
