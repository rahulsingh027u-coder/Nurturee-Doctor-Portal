import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, doctorId, practiceType, ...data } = body;
    if (!userId || !practiceType) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const clinic = await prisma.clinic.create({
      data: {
        name: data.name || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        phone: data.phone || "",
        email: data.email || "",
        logo: data.logo || null,
        department: data.department || "",
        type: practiceType,
        registrationNo: data.registrationNo || "",
        specialties: JSON.stringify(data.specialties || []),
        facilities: JSON.stringify(data.facilities || []),
        bedCapacity: data.bedCapacity || 0,
        emergency24x7: data.emergency24x7 || false,
        website: data.website || "",
        description: data.description || "",
        operatingHours: JSON.stringify(data.operatingHours || {}),
      },
    });

    if (doctorId) {
      await prisma.doctorProfile.update({
        where: { id: doctorId },
        data: { clinicId: clinic.id, profileComplete: true, specialization: data.specialization || "", degree: data.degree || "" },
      });
    }

    return NextResponse.json({ success: true, clinicId: clinic.id });
  } catch (error: any) {
    console.error("Error saving organization:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
