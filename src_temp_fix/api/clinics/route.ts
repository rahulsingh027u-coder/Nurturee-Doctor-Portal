import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/clinics?doctorId=xxx — list all clinics a doctor belongs to (via ClinicDoctor join)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    if (doctorId) {
      // Get ALL clinics this doctor is a member of (via ClinicDoctor join table)
      const memberships = await db.clinicDoctor.findMany({
        where: { doctorId, isActive: true },
        include: {
          clinic: {
            include: {
              doctorMemberships: {
                where: { isActive: true },
                include: {
                  doctor: {
                    include: { user: { select: { name: true, phone: true, avatar: true } } },
                  },
                },
                orderBy: { joinedAt: "asc" },
              },
              staffMembers: {
                include: { user: { select: { name: true, phone: true, avatar: true } } },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });

      // Also check if doctor has a direct clinicId (primary clinic not yet migrated)
      const doctor = await db.doctorProfile.findUnique({
        where: { id: doctorId },
        select: { clinicId: true },
      });

      // Build deduplicated clinic list with membership info
      const clinicMap = new Map<string, any>();

      for (const m of memberships) {
        const c = m.clinic;
        if (clinicMap.has(c.id)) continue;
        clinicMap.set(c.id, {
          ...c,
          _membership: {
            id: m.id,
            department: m.department,
            associationType: m.associationType,
            joinedAt: m.joinedAt,
          },
          doctors: c.doctorMemberships.map((dm) => ({
            id: dm.doctor.id,
            specialization: dm.doctor.specialization,
            degree: dm.doctor.degree,
            department: dm.department,
            associationType: dm.associationType,
            user: dm.doctor.user,
          })),
          staffMembers: c.staffMembers,
        });
      }

      // Handle legacy direct clinicId (if not already in memberships)
      if (doctor?.clinicId && !clinicMap.has(doctor.clinicId)) {
        const directClinic = await db.clinic.findUnique({
          where: { id: doctor.clinicId },
          include: {
            doctors: {
              include: { user: { select: { name: true, phone: true, avatar: true } } },
            },
            staffMembers: {
              include: { user: { select: { name: true, phone: true, avatar: true } } },
            },
          },
        });
        if (directClinic) {
          clinicMap.set(directClinic.id, {
            ...directClinic,
            _membership: {
              id: "legacy",
              department: "",
              associationType: "full-time",
              joinedAt: directClinic.createdAt,
            },
          });
        }
      }

      return NextResponse.json(Array.from(clinicMap.values()));
    }

    // No doctorId — list all clinics (admin view)
    const clinics = await db.clinic.findMany({
      include: {
        _count: { select: { doctors: true, staffMembers: true, doctorMemberships: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(clinics);
  } catch (error) {
    console.error("Clinics GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/clinics — create a clinic + add creator as member
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, address, city, phone, email, department, type, createdById } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Clinic name is required" }, { status: 400 });
    }

    const clinic = await db.clinic.create({
      data: {
        name: String(name).trim(),
        address: String(address || "").trim(),
        city: String(city || "").trim(),
        phone: phone ? String(phone).trim() : null,
        email: email ? String(email).trim() : null,
        department: String(department || "").trim(),
        type: String(type || "clinic"),
      },
      include: {
        _count: { select: { doctors: true, staffMembers: true, doctorMemberships: true } },
      },
    });

    // Add creator as primary clinic member
    if (createdById) {
      await db.doctorProfile.update({
        where: { id: createdById },
        data: { clinicId: clinic.id },
      });
      // Also create ClinicDoctor membership
      await db.clinicDoctor.create({
        data: {
          clinicId: clinic.id,
          doctorId: createdById,
          associationType: "full-time",
          department: String(department || "").trim(),
        },
      });
    }

    return NextResponse.json(clinic, { status: 201 });
  } catch (error) {
    console.error("Clinics POST error:", error);
    return NextResponse.json({ error: "Failed to create clinic" }, { status: 500 });
  }
}

// PUT /api/clinics?id=xxx — update clinic details
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const body = await req.json();
    const { name, address, city, phone, email, department, type, isActive, operatingHours } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (address !== undefined) data.address = String(address).trim();
    if (city !== undefined) data.city = String(city).trim();
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (email !== undefined) data.email = email ? String(email).trim() : null;
    if (department !== undefined) data.department = String(department || "").trim();
    if (type !== undefined) data.type = String(type || "clinic");
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (operatingHours !== undefined) data.operatingHours = JSON.stringify(operatingHours);

    const clinic = await db.clinic.update({
      where: { id },
      data,
      include: { _count: { select: { doctors: true, staffMembers: true, doctorMemberships: true } } },
    });

    return NextResponse.json(clinic);
  } catch (error: unknown) {
    console.error("Clinics PUT error:", error);
    const code = (error as { code?: string }).code;
    if (code === "P2025") return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/clinics?id=xxx — delete clinic + cleanup
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // Remove clinicId from all doctors pointing here
    await db.doctorProfile.updateMany({
      where: { clinicId: id },
      data: { clinicId: null },
    });

    // ClinicDoctor entries auto-delete (onDelete: Cascade)
    // StaffMembers with clinicId auto-delete (onDelete: Cascade)

    await db.clinic.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Clinics DELETE error:", error);
    const code = (error as { code?: string }).code;
    if (code === "P2025") return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
