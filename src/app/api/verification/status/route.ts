import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role !== "DOCTOR") return NextResponse.json({ error: "Only doctors can view verification" }, { status: 403 });
    const verifications = await (db as any).verification.findMany({ where: { entityType: "doctor", entityId: userId }, orderBy: { createdAt: "desc" } });
    const doctorProfile = await db.doctorProfile.findUnique({ where: { userId }, select: { verified: true } as any });
    return NextResponse.json({
      success: true,
      verifications: verifications.map((v: any) => ({ id: v.id, status: v.status, package: v.package, documents: JSON.parse(v.documents || "[]"), reviewNotes: v.reviewNotes, attemptCount: v.attemptCount, isSuspended: v.isSuspended, suspensionReason: v.suspensionReason, submittedAt: v.createdAt, reviewedAt: v.reviewedAt, reviewedBy: v.reviewedBy })),
      doctor: doctorProfile,
    });
  } catch (error) {
    console.error("Doctor verification status error:", error);
    return NextResponse.json({ error: "Failed to fetch verification status" }, { status: 500 });
  }
}
