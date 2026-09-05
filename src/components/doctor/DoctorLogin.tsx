"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Phone, Shield, Stethoscope, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface DoctorLoginProps {
  onLoginSuccess: (userId: string) => void;
}

const INDIAN_FLAG_EMOJI = "\u{1F1EE}\u{1F1F3}";

export default function DoctorLogin({ onLoginSuccess }: DoctorLoginProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDev = process.env.NODE_ENV === "development";

  const handleSendOtp = async () => {
    setError(null);

    const raw = phone.replace(/\D/g, "");
    if (raw.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: raw }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send OTP. Please try again.");
      }

      setOtpSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    const raw = phone.replace(/\D/g, "");
    setVerifyingOtp(true);
    try {
      const result = await signIn("phone-otp", {
        phone: raw,
        otp,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid OTP. Please check and try again.");
      }

      onLoginSuccess((result as any)?.user?.id ?? "doctor");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verification failed. Please try again."
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    // Google OAuth setup is future work — show placeholder behaviour for now.
    setTimeout(() => {
      setGoogleLoading(false);
      setError("Google Sign-In will be available soon.");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-4xl w-full overflow-hidden rounded-2xl shadow-xl">
        {/* ─── Left: Branding Panel ─── */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl md:rounded-r-none md:rounded-l-2xl flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 size-44 rounded-full bg-indigo-300/20 blur-xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center gap-6">
            {/* Logo / Icon */}
            <div className="flex items-center justify-center size-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Stethoscope className="size-8 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Nurturee
            </h1>
            <p className="text-lg font-medium text-blue-100">
              Doctor Portal
            </p>

            {/* Tagline */}
            <div className="flex items-center gap-2 mt-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3">
              <Shield className="size-5 text-white/90 shrink-0" />
              <span className="text-sm leading-relaxed text-white/95">
                Trusted Care for Your Loved Ones
              </span>
            </div>

            {/* Illustration placeholder area */}
            <div className="mt-4 flex items-end justify-center gap-3 opacity-60">
              <div className="flex flex-col items-center gap-1">
                <div className="size-12 rounded-full bg-white/20" />
                <div className="w-16 h-2 rounded-full bg-white/15" />
              </div>
              <div className="flex flex-col items-center gap-1 translate-y-1">
                <div className="size-14 rounded-full bg-white/25" />
                <div className="w-20 h-2 rounded-full bg-white/20" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="size-12 rounded-full bg-white/20" />
                <div className="w-16 h-2 rounded-full bg-white/15" />
              </div>
            </div>

            <p className="text-xs text-blue-200/70 mt-4 max-w-xs">
              Secure, HIPAA-compliant access for verified healthcare professionals.
            </p>
          </div>
        </div>

        {/* ─── Right: Login Form ─── */}
        <Card className="rounded-2xl md:rounded-l-none border-0 md:border shadow-none md:shadow-xl flex flex-col justify-center bg-white">
          <CardHeader className="px-6 sm:px-8 pt-8 sm:pt-10">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome, Doctor
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access your dashboard and patient consultations.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-8 sm:pb-10">
            {/* Error Toast */}
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Tabs defaultValue="phone-otp" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="phone-otp" className="gap-1.5">
                  <Phone className="size-4" />
                  Phone OTP
                </TabsTrigger>
                <TabsTrigger value="google" className="gap-1.5">
                  {/* Simple inline SVG for the Google "G" icon */}
                  <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </TabsTrigger>
              </TabsList>

              {/* ─── Phone OTP Tab ─── */}
              <TabsContent value="phone-otp" className="mt-6 space-y-5">
                {/* Dev hint */}
                {isDev && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                    <span className="font-semibold">Demo:</span> use phone{" "}
                    <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
                      9876543210
                    </code>
                    , OTP:{" "}
                    <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
                      123456
                    </code>
                  </div>
                )}

                {/* Phone number input */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-0">
                    <div className="flex items-center gap-1.5 rounded-l-md border border-r-0 border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground select-none">
                      <span role="img" aria-label="India">
                        {INDIAN_FLAG_EMOJI}
                      </span>
                      <span className="font-medium">+91</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(digits);
                        // Clear OTP if phone changes after it was sent
                        if (otpSent) {
                          setOtpSent(false);
                          setOtp("");
                        }
                      }}
                      className="rounded-l-none"
                      disabled={sendingOtp || verifyingOtp}
                      aria-label="10-digit phone number"
                    />
                  </div>
                </div>

                {/* Send OTP button */}
                {!otpSent && (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md"
                    size="lg"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || phone.replace(/\D/g, "").length !== 10}
                  >
                    {sendingOtp ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Phone className="size-4" />
                        Send OTP
                      </>
                    )}
                  </Button>
                )}

                {/* OTP input (visible after sending) */}
                {otpSent && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <p className="text-xs text-muted-foreground">
                        We sent a 6-digit code to{" "}
                        <span className="font-medium text-foreground">
                          +91 {phone}
                        </span>
                      </p>
                      <InputOTP
                        id="otp"
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        disabled={verifyingOtp}
                        containerClassName="justify-center"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {/* Resend / Change number */}
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <button
                        type="button"
                        className="text-blue-700 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp("");
                        }}
                        disabled={verifyingOtp}
                      >
                        Change number
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        type="button"
                        className="text-blue-700 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || verifyingOtp}
                      >
                        {sendingOtp ? "Resending..." : "Resend OTP"}
                      </button>
                    </div>

                    {/* Verify button */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md"
                      size="lg"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length !== 6}
                    >
                      {verifyingOtp ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="size-4" />
                          Verify &amp; Login
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ─── Google Sign In Tab ─── */}
              <TabsContent value="google" className="mt-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Sign in quickly with your Google account linked to your
                    doctor profile.
                  </p>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full max-w-xs gap-3 h-12 text-base font-medium"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    {googleLoading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                          fill="#EA4335"
                        />
                      </svg>
                    )}
                    Continue with Google
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Google Sign-In will be available soon.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}export { DoctorLogin };
