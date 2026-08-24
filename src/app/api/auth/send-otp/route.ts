import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const isDev = true;
    const otp = isDev ? "123456" : String(Math.floor(100000 + Math.random() * 900000));

    // Find or create user as DOCTOR
    let user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      user = await db.user.create({
        data: { phone, name: "", role: "DOCTOR" },
      });
    }

    // If user exists but is not a DOCTOR, reject
    if (user.role !== "DOCTOR") {
      return NextResponse.json({ error: "This number is registered as a customer. Please use a different number." }, { status: 403 });
    }

    // Delete old unverified OTPs
    await db.otpCode.deleteMany({ where: { phone, verified: false } });

    await db.otpCode.create({
      data: {
        phone,
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, message: "OTP sent", devOtp: isDev ? otp : undefined });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}