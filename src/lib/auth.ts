import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone Number", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;

        const { db } = await import("@/lib/db");

        // In dev mode, accept any 6-digit OTP
        const isDev = process.env.NODE_ENV === 'development';
        if (!isDev) {
          // Production: verify OTP from DB
          const otpRecord = await db.otpCode.findFirst({
            where: {
              phone: credentials.phone,
              code: credentials.otp,
              verified: false,
              expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
          });
          if (!otpRecord) return null;
          await db.otpCode.update({ where: { id: otpRecord.id }, data: { verified: true } });
        } else {
          // Dev: accept any 6-digit code
          if (credentials.otp.length !== 6 || !/^\d{6}$/.test(credentials.otp)) return null;
        }

        // Find or create user
        let user = await db.user.findUnique({ where: { phone: credentials.phone } });
        if (!user) {
          // Default to DOCTOR role for new users (original behavior)
          user = await db.user.create({
            data: { phone: credentials.phone, name: "", role: "DOCTOR" },
          });
        }

        // Must be a DOCTOR or STAFF
        if (user.role !== "DOCTOR" && user.role !== "STAFF") return null;

        if (user.role === "DOCTOR") {
          // Create blank DoctorProfile if it doesn't exist (first-time doctor)
          let doctor = await db.doctorProfile.findUnique({ where: { userId: user.id } });
          if (!doctor) {
            doctor = await db.doctorProfile.create({
              data: {
                userId: user.id,
                specialization: "",
                degree: "",
                experienceYears: 0,
                consultationFeeOnline: 0,
                consultationFeeOffline: 0,
                profileComplete: false,
              },
            });
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            profileComplete: doctor.profileComplete,
          };
        }

        // STAFF user — verify they have an active staff profile
        const staffProfile = await db.staffMember.findUnique({
          where: { userId: user.id },
          include: { doctor: true },
        });
        if (!staffProfile || !staffProfile.isActive) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profileComplete: true, // Staff don't need profile setup
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = String((user as any).id);
        token.role = String((user as unknown as Record<string, unknown>).role);
        token.profileComplete = Boolean((user as unknown as Record<string, unknown>).profileComplete);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).profileComplete = token.profileComplete;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "nurturee-doctor-portal-secret-key-2024",
};