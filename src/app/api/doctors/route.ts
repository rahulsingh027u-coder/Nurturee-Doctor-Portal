import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/doctors?phone=xxx | ?userId=xxx | ?list=true
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const userId = searchParams.get("userId");
    const list = searchParams.get("list");

    // List all active doctors (for customer-facing doctor listing)
    if (list === "true") {
      const doctors = await db.doctorProfile.findMany({
        where: { isActive: true, profileComplete: true },
        include: { user: { select: { name: true, phone: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(doctors);
    }

    let doctor;
    if (phone) {
      const user = await db.user.findUnique({ where: { phone } });
      if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
      doctor = await db.doctorProfile.findUnique({ where: { userId: user.id }, include: { user: true } });
    } else if (userId) {
      doctor = await db.doctorProfile.findUnique({ where: { userId }, include: { user: true } });
    }

    if (!doctor) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Doctors GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT /api/doctors — create or update doctor profile + user name
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, email, ...profileData } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Update user name/email if user still exists (handles DB resets / stale sessions)
    const userExists = await db.user.findUnique({ where: { id: userId } }).catch(() => null);
    if (userExists && name) {
      await db.user.update({ where: { id: userId }, data: { name } });
    }
    if (userExists && email && typeof email === "string" && email.trim()) {
      try {
        await db.user.update({ where: { id: userId }, data: { email: email.trim() } });
      } catch (updateErr: unknown) {
        const prismaErr = updateErr as { code?: string; message?: string };
        if (prismaErr.code === "P2002") {
          return NextResponse.json({ error: "This email is already registered with another account." }, { status: 409 });
        }
        throw updateErr;
      }
    }

    // Upsert doctor profile
    const existing = await db.doctorProfile.findUnique({ where: { userId } });

    // Build typed profile data with explicit type coercion
    const profilePayload: Record<string, string | number | boolean | null> = {};

    if (profileData.specialization !== undefined)
      profilePayload.specialization = String(profileData.specialization);
    if (profileData.degree !== undefined)
      profilePayload.degree = String(profileData.degree);
    if (profileData.experienceYears !== undefined)
      profilePayload.experienceYears = parseInt(profileData.experienceYears, 10) || 0;
    if (profileData.consultationFeeOnline !== undefined)
      profilePayload.consultationFeeOnline = parseInt(profileData.consultationFeeOnline, 10) || 0;
    if (profileData.consultationFeeOffline !== undefined)
      profilePayload.consultationFeeOffline = parseInt(profileData.consultationFeeOffline, 10) || 0;
    if (profileData.registrationNo !== undefined)
      profilePayload.registrationNo = profileData.registrationNo ? String(profileData.registrationNo) : null;
    if (profileData.area !== undefined)
      profilePayload.area = String(profileData.area || "");
    if (profileData.languages !== undefined)
      profilePayload.languages = String(profileData.languages || "");
    if (profileData.availableFrom !== undefined)
      profilePayload.availableFrom = String(profileData.availableFrom);
    if (profileData.availableTo !== undefined)
      profilePayload.availableTo = String(profileData.availableTo);
    if (profileData.availableDays !== undefined)
      profilePayload.availableDays = String(profileData.availableDays);
    if (profileData.bio !== undefined)
      profilePayload.bio = profileData.bio ? String(profileData.bio) : null;
    if (profileData.profileComplete !== undefined)
      profilePayload.profileComplete = Boolean(profileData.profileComplete);
    if (profileData.isActive !== undefined)
      profilePayload.isActive = Boolean(profileData.isActive);

    let doctor;
    if (existing) {
      doctor = await db.doctorProfile.update({ where: { userId }, data: profilePayload });
    } else {
      doctor = await db.doctorProfile.create({
        data: { userId, ...profilePayload },
      });
    }

    return NextResponse.json(doctor);
  } catch (error: unknown) {
    console.error("Doctors PUT error:", error);
    const msg = error instanceof Error ? error.message : "Failed to save profile";
    const code = (error as { code?: string }).code;
    return NextResponse.json({ error: msg, code }, { status: 500 });
  }
}