import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/staff?doctorId=xxx | ?userId=xxx
// userId path: staff login — if clinicId set, return ALL clinic doctors
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const userId = searchParams.get("userId");

    if (userId) {
      const staff = await db.staffMember.findUnique({
        where: { userId },
        include: {
          doctor: { include: { user: { select: { name: true, phone: true, avatar: true } } } },
          clinic: true,
          user: { select: { name: true, phone: true } },
        },
      });
      if (!staff) return NextResponse.json({ error: "Not a staff member" }, { status: 404 });

      // If clinic staff — load all clinic doctors for the switcher
      if (staff.clinicId) {
        const clinicDoctors = await db.clinicDoctor.findMany({
          where: { clinicId: staff.clinicId, isActive: true },
          include: {
            doctor: { include: { user: { select: { name: true, phone: true, avatar: true } } } },
          },
          orderBy: { joinedAt: "asc" },
        });
        return NextResponse.json({
          ...staff,
          clinicDoctors: clinicDoctors.map((cd) => ({
            id: cd.doctor.id,
            name: cd.doctor.user.name,
            specialization: cd.doctor.specialization,
            degree: cd.doctor.degree,
            department: cd.department,
            associationType: cd.associationType,
            avatar: cd.doctor.user.avatar,
          })),
        });
      }

      return NextResponse.json(staff);
    }

    if (!doctorId) {
      return NextResponse.json({ error: "doctorId or userId required" }, { status: 400 });
    }

    const staff = await db.staffMember.findMany({
      where: { doctorId },
      include: { user: { select: { name: true, phone: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Staff GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/staff — create a staff member (tied to a single doctor)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { doctorId, name, phone, role, permissions } = body;

    if (!doctorId || !name || !phone) {
      return NextResponse.json({ error: "doctorId, name, and phone are required" }, { status: 400 });
    }

    const existing = await db.staffMember.findFirst({
      where: { doctorId, phone: String(phone) },
    });
    if (existing) {
      return NextResponse.json({ error: "A staff member with this phone already exists" }, { status: 409 });
    }

    const staff = await db.staffMember.create({
      data: {
        doctorId,
        name: String(name).trim(),
        phone: String(phone).trim(),
        role: String(role || "receptionist"),
        permissions: JSON.stringify(permissions || {}),
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error("Staff POST error:", error);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}

// PUT /api/staff?id=xxx
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const body = await req.json();
    const { name, role, permissions, isActive } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (role !== undefined) data.role = String(role);
    if (permissions !== undefined) data.permissions = JSON.stringify(permissions);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const staff = await db.staffMember.update({ where: { id }, data });
    return NextResponse.json(staff);
  } catch (error: unknown) {
    console.error("Staff PUT error:", error);
    const code = (error as { code?: string }).code;
    if (code === "P2025") return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/staff?id=xxx
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const staff = await db.staffMember.findUnique({ where: { id } });
    if (staff?.userId) {
      await db.user.delete({ where: { id: staff.userId } }).catch(() => {});
    }

    await db.staffMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Staff DELETE error:", error);
    const code = (error as { code?: string }).code;
    if (code === "P2025") return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}