"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Video,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CAREGIVERS } from "@/lib/data";
import { format } from "date-fns";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-slate-900 break-words">{value}</p>
      </div>
    </div>
  );
}

function VerifiedPill({
  label,
  done,
  date,
}: {
  label: string;
  done: boolean;
  date?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      {done ? (
        <BadgeCheck className="size-4 shrink-0 text-emerald-600" />
      ) : (
        <ShieldCheck className="size-4 shrink-0 text-slate-400" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {date && (
          <p className="text-[10px] text-muted-foreground">
            Verified on {format(new Date(date), "dd MMM yyyy")}
          </p>
        )}
      </div>
    </div>
  );
}

export function CaregiverProfileView() {
  const setView = useAppStore((s) => s.setView);
  const activeCaregiverId = useAppStore((s) => s.activeCaregiverId);
  const bookings = useAppStore((s) => s.bookings);
  const caregiver = CAREGIVERS.find((c) => c.id === activeCaregiverId);
  const linkedBooking = bookings.find((b) => b.caregiverId === activeCaregiverId);

  if (!caregiver) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          No caregiver assigned yet.
        </p>
        <button
          onClick={() => setView("home")}
          className="mt-3 text-sm font-medium text-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const initials = caregiver.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => setView("bookings")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-blue-700"
        >
          <ArrowLeft className="size-4" /> Back to Bookings
        </button>

        {/* Hero card */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-6 text-white">
            <div className="flex items-start gap-4">
              <div
                className={`flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${caregiver.photoColor} text-2xl font-bold text-white shadow-lg ring-4 ring-white/20`}
              >
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold sm:text-2xl">
                    {caregiver.name}
                  </h1>
                  <BadgeCheck className="size-5 text-emerald-300" />
                </div>
                <p className="mt-0.5 text-sm text-blue-100">
                  {caregiver.specialization}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-100">
                  <span>{caregiver.experienceYears} yrs experience</span>
                  <span>•</span>
                  <span>{caregiver.area}</span>
                  <span>•</span>
                  <span>{caregiver.gender}, {caregiver.age} yrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verified badges strip */}
          <div className="border-b border-border/60 bg-emerald-50/50 px-6 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-800">
              <span className="inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="size-3.5" /> Admin-approved
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <ShieldCheck className="size-3.5" /> Aadhaar verified
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <ShieldCheck className="size-3.5" /> Police verified
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Video className="size-3.5" /> Video verified
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Stethoscope className="size-3.5" /> Medical fitness cleared
              </span>
            </div>
          </div>
        </div>

        {/* Linked booking */}
        {linkedBooking && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <p className="text-xs font-semibold text-blue-900">
              Assigned to booking
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-blue-800">
              <span className="font-mono font-semibold">
                {linkedBooking.id}
              </span>
              <span>•</span>
              <span>{linkedBooking.serviceName}</span>
              <span>•</span>
              <span>
                {format(new Date(linkedBooking.date), "EEE, dd MMM yyyy")}
              </span>
              <span>•</span>
              <span>{linkedBooking.timeSlot}</span>
              <span>•</span>
              <span className="capitalize">{linkedBooking.mode}</span>
            </div>
          </div>
        )}

        {/* Two-column profile */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Left: personal */}
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <User className="size-4 text-blue-600" /> Personal Details
            </h2>
            <div className="divide-y divide-border/40">
              <InfoRow
                icon={User}
                label="Full name"
                value={caregiver.name}
              />
              <InfoRow
                icon={Calendar}
                label="Date of birth"
                value={`${format(new Date(caregiver.dob), "dd MMM yyyy")} (${caregiver.age} yrs)`}
              />
              <InfoRow
                icon={User}
                label="Gender"
                value={caregiver.gender}
              />
              <InfoRow
                icon={User}
                label="Marital status"
                value={caregiver.maritalStatus}
              />
              <InfoRow
                icon={MapPin}
                label="Residential address"
                value={caregiver.address}
              />
              <InfoRow
                icon={Sparkles}
                label="Specialization"
                value={caregiver.specialization}
              />
              <InfoRow
                icon={Stethoscope}
                label="Experience"
                value={`${caregiver.experienceYears} years`}
              />
              <InfoRow
                icon={User}
                label="Languages"
                value={caregiver.languages.join(", ")}
              />
            </div>
          </div>

          {/* Right: emergency contact + verification */}
          <div className="space-y-4">
            {/* Emergency contact */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-900">
                <Phone className="size-4 text-rose-600" /> Emergency Contact
              </h2>
              <p className="text-xs text-rose-800/80">
                Verified contact of mother / father / guardian / spouse — for
                Nurturee team use in any emergency involving the caregiver.
              </p>
              <div className="mt-3 space-y-1.5 text-sm">
                <p>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-medium">{caregiver.emergency.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Relation: </span>
                  <span className="font-medium">
                    {caregiver.emergency.relation}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-mono font-medium">
                    {caregiver.emergency.phone}
                  </span>
                </p>
              </div>
            </div>

            {/* Verification pills */}
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-blue-600" /> Verification
                Status
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <VerifiedPill
                  label={`Aadhaar: ${caregiver.aadhaarMasked}`}
                  done={caregiver.aadhaarVerified}
                />
                <VerifiedPill
                  label={`Police ref: ${caregiver.policeVerification.referenceNo}`}
                  done={caregiver.policeVerification.done}
                  date={caregiver.policeVerification.verifiedOn}
                />
                <VerifiedPill
                  label="Video interview"
                  done={caregiver.videoVerification.done}
                  date={caregiver.videoVerification.verifiedOn}
                />
                <VerifiedPill
                  label="Medical fitness"
                  done={caregiver.medicalFitness}
                />
                <VerifiedPill
                  label={`References checked: ${caregiver.referencesChecked}`}
                  done={caregiver.referencesChecked > 0}
                />
              </div>
            </div>

            {/* Certifications */}
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 text-blue-600" /> Certifications &amp;
                Training
              </h2>
              <ul className="space-y-1.5 text-sm">
                {caregiver.certifications.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Documents vault — customer's own prescriptions */}
        <div className="mt-4 rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-blue-600" /> Document Vault
            </h2>
            <button
              onClick={() => setView("documents")}
              className="text-xs font-medium text-blue-700 hover:text-blue-800"
            >
              Manage documents →
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Your prescriptions, lab reports and IDs — stored securely on your
            device. Shareable with the assigned caregiver during the visit.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => setView("bookings")}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            View My Bookings
          </button>
          <button
            onClick={() => setView("documents")}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
          >
            Upload Prescription
          </button>
        </div>
      </div>
    </div>
  );
}
