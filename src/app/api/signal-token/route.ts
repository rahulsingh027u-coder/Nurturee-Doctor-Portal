import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { SignJWT } from "jose";
import { authOptions } from "@/lib/auth";

const SECRET = new TextEncoder().encode(
  process.env.SIGNAL_JWT_SECRET ??
    process.env.NURTUREE_JWT_SECRET ??
    process.env.JWT_SECRET ?? (() => { throw new Error("SIGNAL_JWT_SECRET or JWT_SECRET env var is required"); })()
);

export async function GET() {
  if (!SECRET.length) {
    return NextResponse.json({ error: "Signal JWT secret not configured" }, { status: 500 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id?: string; role?: string };
  if (user.role !== "DOCTOR" && user.role !== "STAFF") {
    return NextResponse.json({ error: "Only doctors/staff can use video calls" }, { status: 403 });
  }
  const token = await new SignJWT({ id: user.id, role: "doctor" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("nurturee")
    .setExpirationTime("1h")
    .sign(SECRET);
  return NextResponse.json({ token });
}
