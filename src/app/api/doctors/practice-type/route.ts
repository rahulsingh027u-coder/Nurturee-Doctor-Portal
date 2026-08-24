import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    const { userId, practiceType } = await req.json();
    if (!userId || !practiceType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const updated = await db.doctorProfile.update({
      where: { userId },
      data: { practiceType },
    });
    return NextResponse.json({ success: true, practiceType: updated.practiceType });
  } catch (error) {
    console.error("Practice type save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
