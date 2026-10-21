import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role !== "DOCTOR") return NextResponse.json({ error: "Only doctors can submit verification" }, { status: 403 });
    const doctorProfile = await db.doctorProfile.findUnique({ where: { userId } });
    if (!doctorProfile) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    if (doctorProfile.verified) return NextResponse.json({ error: "Already verified" }, { status: 400 });
    if ((doctorProfile as any).isSuspended) return NextResponse.json({ error: "Account suspended", reason: (doctorProfile as any).suspensionReason }, { status: 403 });
    const body = await req.json();
    const { documents } = body as { documents?: any[] };
    if (!documents || !Array.isArray(documents) || documents.length === 0) return NextResponse.json({ error: "At least one document is required" }, { status: 400 });
    const existing = await (db as any).verification.findFirst({ where: { entityType: "doctor", entityId: userId }, orderBy: { createdAt: "desc" } });
    const now = new Date().toISOString();
    const docsJson = JSON.stringify(documents.map((d) => ({ type: d.type, url: d.url || d.fileData || "", name: d.name || "", size: d.size || 0, verified: false, uploadedAt: now })));
    if (existing) {
      const updated = await (db as any).verification.update({ where: { id: existing.id }, data: { status: "resubmitted", documents: docsJson, attemptCount: existing.attemptCount + 1, reviewNotes: null, reviewedAt: null, reviewedBy: null } });
      return NextResponse.json({ success: true, verification: updated, message: "Documents resubmitted for review" });
    }
    const verification = await (db as any).verification.create({ data: { entityType: "doctor", entityId: userId, status: "pending", package: "nmc", documents: docsJson, attemptCount: 1 } });

    // Also create a matching Doctor table entry (admin portal queries this table)
    const existingDoctor = await (db as any).doctor.findUnique({ where: { id: userId } });
    if (!existingDoctor) {
      await (db as any).doctor.create({
        data: {
          id: userId,
          name: "Dr. " + (session.user as any).name || "Unknown",
          email: (session.user as any).email || "",
          phone: "0000000000",
          password: "$2a$10$dummy",
          specialty: doctorProfile.specialization || "General Physician",
          qualifications: doctorProfile.degree || "",
          experience: doctorProfile.experienceYears || 0,
        }
      });
    }
    return NextResponse.json({ success: true, verification, message: "Documents submitted for review" });
  } catch (error) {
    console.error("Doctor verification submit error:", error);
    return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 });
  }
}
