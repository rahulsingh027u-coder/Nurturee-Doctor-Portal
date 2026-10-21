import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export interface DoctorAuth {
  ok: true;
  userId: string;
  doctorProfileId: string | null;
  role: string;
}

export interface AuthFail {
  ok: false;
  response: NextResponse;
}

export async function requireDoctorAuth(): Promise<DoctorAuth | AuthFail> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (!userId || (role !== "DOCTOR" && role !== "STAFF")) {
    return { ok: false, response: NextResponse.json({ error: "Invalid session" }, { status: 403 }) };
  }
  let doctorProfileId: string | null = null;
  try {
    const profile = await db.doctorProfile.findUnique({ where: { userId }, select: { id: true } });
    doctorProfileId = profile?.id ?? null;
  } catch {}
  return { ok: true, userId, doctorProfileId, role };
}

export async function checkDoctorOwnership(doctorIdParam: string | null, auth: DoctorAuth): Promise<NextResponse | null> {
  if (!doctorIdParam) return null;
  const allowed = new Set<string>([auth.userId]);
  if (auth.doctorProfileId) allowed.add(auth.doctorProfileId);
  if (!allowed.has(doctorIdParam)) {
    return NextResponse.json({ error: "Access denied: you can only access your own resources" }, { status: 403 });
  }
  return null;
}
