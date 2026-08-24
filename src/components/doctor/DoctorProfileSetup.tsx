"use client";

import { useState, useEffect } from "react";
import {
  Stethoscope,
  GraduationCap,
  Award,
  Clock,
  IndianRupee,
  FileCheck,
  Building2,
  ChevronRight,
  Check,
  Loader2,
  UserRound,
  MapPin,
  Languages,
  Camera,
  X,
} from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPECIALIZATIONS = [
  "General Physician",
  "Pediatrician",
  "Gynaecologist",
  "Dermatologist",
  "Orthopedic",
  "ENT Specialist",
  "Ophthalmologist",
  "Psychiatrist",
  "Cardiologist",
  "Neurologist",
  "Geriatric Specialist",
  "Dentist",
  "Ayurvedic Doctor",
  "Homeopathic Doctor",
  "Other",
];

const DEGREES = [
  "MBBS",
  "MBBS, MD",
  "MBBS, MS",
  "MBBS, DCH",
  "MBBS, DNB",
  "BDS",
  "BAMS",
  "BHMS",
  "MD",
  "MS",
  "DM",
  "MCh",
  "DGO",
  "FRCOG",
  "Other",
];

const DAYS = [
  { value: "0", label: "Sun" },
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DoctorProfileSetupProps {
  userId: string;
  phone: string;
  existingProfile?: Record<string, unknown>;
  onComplete: () => void;
  onBack?: () => void;
}

interface ProfileForm {
  name: string;
  email: string;
  specialization: string;
  degree: string;
  experienceYears: number | string;
  registrationNo: string;
  area: string;
  languages: string;
  consultationFeeOnline: number | string;
  consultationFeeOffline: number | string;
  availableFrom: string;
  availableTo: string;
  availableDays: string[];
  bio: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DoctorProfileSetup({
  userId,
  phone,
  existingProfile,
  onComplete,
  onBack,
}: DoctorProfileSetupProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    (existingProfile?.user as Record<string, unknown>)?.avatar as string || ""
  );
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    name: existingProfile?.user?.name || "",
    email: existingProfile?.user?.email || "",
    specialization: existingProfile?.specialization || "",
    degree: existingProfile?.degree || "",
    experienceYears: existingProfile?.experienceYears || "",
    registrationNo: existingProfile?.registrationNo || "",
    area: existingProfile?.area || "",
    languages: existingProfile?.languages || "",
    consultationFeeOnline: existingProfile?.consultationFeeOnline || "",
    consultationFeeOffline: existingProfile?.consultationFeeOffline || "",
    availableFrom: existingProfile?.availableFrom || "09:00",
    availableTo: existingProfile?.availableTo || "21:00",
    availableDays: existingProfile?.availableDays
      ? (existingProfile.availableDays as string).split(",")
      : ["1", "2", "3", "4", "5", "6"],
    bio: existingProfile?.bio || "",
  });

  // Allow selecting from existing degrees
  const [customDegree, setCustomDegree] = useState(
    DEGREES.includes(form.degree) ? "" : form.degree
  );
  const [customSpecialization, setCustomSpecialization] = useState(
    SPECIALIZATIONS.includes(form.specialization) ? "" : form.specialization
  );

  const updateField = (field: keyof ProfileForm, value: string | number | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Only JPG, PNG, WebP, and GIF images are allowed.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed.");
      }

      const data = await res.json();
      setAvatarUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setAvatarUrl("");
  };

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const days = prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day];
      return { ...prev, availableDays: days.sort() };
    });
  };

  // Validation
  const validateStep = (s: number): boolean => {
    setError(null);
    switch (s) {
      case 0:
        if (!form.name.trim()) { setError("Please enter your full name."); return false; }
        if (!form.specialization) { setError("Please select your specialization."); return false; }
        if (!form.degree && !customDegree.trim()) { setError("Please select or enter your degree."); return false; }
        if (!form.area.trim()) { setError("Please enter your area or location."); return false; }
        if (!form.languages.trim()) { setError("Please enter the languages you speak."); return false; }
        return true;
      case 1:
        if (!form.experienceYears || Number(form.experienceYears) < 0) {
          setError("Please enter valid years of experience.");
          return false;
        }
        if (!form.consultationFeeOnline || Number(form.consultationFeeOnline) <= 0) {
          setError("Please enter your online consultation fee.");
          return false;
        }
        if (!form.consultationFeeOffline || Number(form.consultationFeeOffline) <= 0) {
          setError("Please enter your offline consultation fee.");
          return false;
        }
        return true;
      case 2:
        if (form.availableDays.length === 0) {
          setError("Please select at least one available day.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => {
    if (step === 0 && onBack) { onBack(); return; }
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSave = async () => {
    if (!validateStep(2)) return;

    setSaving(true);
    setError(null);

    const finalDegree = customDegree.trim() || form.degree;
    const finalSpecialization = customSpecialization.trim() || form.specialization;

    try {
      const res = await fetch("/api/doctors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: form.name.trim(),
          email: form.email.trim() || null,
          specialization: finalSpecialization,
          degree: finalDegree,
          experienceYears: Number(form.experienceYears) || 0,
          registrationNo: form.registrationNo.trim() || null,
          area: form.area.trim(),
          languages: form.languages.trim(),
          consultationFeeOnline: Number(form.consultationFeeOnline) || 0,
          consultationFeeOffline: Number(form.consultationFeeOffline) || 0,
          availableFrom: form.availableFrom,
          availableTo: form.availableTo,
          availableDays: form.availableDays.join(","),
          bio: form.bio.trim(),
          profileComplete: true,
          isActive: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile.");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Step indicators
  // ---------------------------------------------------------------------------

  const STEPS = [
    { label: "Basic Info", icon: UserRound },
    { label: "Experience & Fees", icon: Award },
    { label: "Availability", icon: Clock },
    { label: "Review", icon: FileCheck },
  ];

  // ---------------------------------------------------------------------------
  // Render: Step content
  // ---------------------------------------------------------------------------

  const renderStepContent = () => {
    switch (step) {
      // ─── Step 0: Basic Info ─────────────────────────────
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Basic Information</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us about yourself so patients can find you.
              </p>
            </div>

            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                {avatarUrl ? (
                  <>
                    <img
                      src={avatarUrl}
                      alt="Profile photo"
                      className="h-24 w-24 rounded-full object-cover border-4 border-blue-100 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 transition-colors"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 border-2 border-dashed border-blue-300">
                    <UserRound className="h-8 w-8 text-blue-500" />
                  </div>
                )}
                <label
                  className={cn(
                    "absolute inset-0 flex h-24 w-24 items-center justify-center rounded-full cursor-pointer transition-colors",
                    avatarUrl
                      ? "bg-black/0 group-hover:bg-black/40"
                      : ""
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity",
                      avatarUrl
                        ? "bg-black/60 text-white opacity-0 group-hover:opacity-100"
                        : "absolute -bottom-8 bg-blue-600 text-white shadow-md"
                    )}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                    {uploading ? "Uploading..." : avatarUrl ? "Change" : "Upload Photo"}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
            </div>

            <Separator />

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name <span className="text-blue-600">*</span>
              </Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Dr. Your Full Name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>

            {/* Phone (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone</Label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <span>+91 {phone}</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] ml-auto">
                  Verified
                </Badge>
              </div>
            </div>

            {/* Specialization */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Specialization <span className="text-blue-600">*</span>
              </Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  value={form.specialization}
                  onChange={(e) => updateField("specialization", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <option value="">Select specialization...</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {/* Custom specialization input if "Other" */}
              {form.specialization === "Other" && (
                <Input
                  placeholder="Enter your specialization"
                  value={customSpecialization}
                  onChange={(e) => setCustomSpecialization(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Degree */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Degree / Qualification <span className="text-blue-600">*</span>
              </Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  value={DEGREES.includes(form.degree) ? form.degree : ""}
                  onChange={(e) => {
                    updateField("degree", e.target.value);
                    if (e.target.value) setCustomDegree("");
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <option value="">Select degree...</option>
                  {DEGREES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {/* Custom degree input */}
              <Input
                placeholder="Or type your exact degree (e.g. MBBS, MD (Pediatrics), FRCOG)"
                value={customDegree}
                onChange={(e) => {
                  setCustomDegree(e.target.value);
                  if (e.target.value) updateField("degree", e.target.value);
                }}
                className="mt-2"
              />
            </div>

            {/* Registration Number */}
            <div className="space-y-2">
              <Label htmlFor="regNo" className="text-sm font-medium">
                Medical Registration No. <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <FileCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="regNo"
                  placeholder="e.g. HMCP-2014-4521"
                  value={form.registrationNo}
                  onChange={(e) => updateField("registrationNo", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Area / Location */}
            <div className="space-y-2">
              <Label htmlFor="area" className="text-sm font-medium">
                Area / Location <span className="text-blue-600">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="area"
                  placeholder="e.g. Sector 18, Gurgaon"
                  value={form.area}
                  onChange={(e) => updateField("area", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-2">
              <Label htmlFor="languages" className="text-sm font-medium">
                Languages Known <span className="text-blue-600">*</span>
              </Label>
              <div className="relative">
                <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="languages"
                  placeholder="e.g. English, Hindi, Punjabi"
                  value={form.languages}
                  onChange={(e) => updateField("languages", e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">Separate languages with commas</p>
            </div>
          </div>
        );

      // ─── Step 1: Experience & Fees ─────────────────────
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Experience & Consultation Fees</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set your fees so patients know what to expect.
              </p>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="experience" className="text-sm font-medium">
                Years of Experience <span className="text-blue-600">*</span>
              </Label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="60"
                  placeholder="e.g. 10"
                  value={form.experienceYears}
                  onChange={(e) => updateField("experienceYears", e.target.value)}
                  className="pl-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  years
                </span>
              </div>
            </div>

            <Separator />

            {/* Online Fee */}
            <div className="space-y-2">
              <Label htmlFor="feeOnline" className="text-sm font-medium">
                Online Consultation Fee <span className="text-blue-600">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">Fee for video/phone consultations</p>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="feeOnline"
                  type="number"
                  min="0"
                  placeholder="e.g. 800"
                  value={form.consultationFeeOnline}
                  onChange={(e) => updateField("consultationFeeOnline", e.target.value)}
                  className="pl-10"
                />
                <Badge variant="outline" className="absolute right-3 top-1/2 -translate-y-1/2 bg-sky-50 text-sky-600 border-sky-200 text-[10px]">
                  Online
                </Badge>
              </div>
            </div>

            {/* Offline Fee */}
            <div className="space-y-2">
              <Label htmlFor="feeOffline" className="text-sm font-medium">
                In-Person Consultation Fee <span className="text-blue-600">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">Fee for physical clinic visits</p>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="feeOffline"
                  type="number"
                  min="0"
                  placeholder="e.g. 1500"
                  value={form.consultationFeeOffline}
                  onChange={(e) => updateField("consultationFeeOffline", e.target.value)}
                  className="pl-10"
                />
                <Badge variant="outline" className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">
                  Physical
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Platform fee:</span> 10% of each consultation fee goes to Nurturee. 
                You receive 90% as net payout directly to your account.
              </p>
            </div>
          </div>
        );

      // ─── Step 2: Availability ─────────────────────────
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Availability</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set your working hours and days.
              </p>
            </div>

            {/* Available Days */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Available Days <span className="text-blue-600">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isSelected = form.availableDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "flex h-10 w-12 items-center justify-center rounded-lg border text-sm font-medium transition-all",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-muted-foreground border-input hover:border-blue-300 hover:text-blue-700"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromTime" className="text-sm font-medium">
                  Available From
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fromTime"
                    type="time"
                    value={form.availableFrom}
                    onChange={(e) => updateField("availableFrom", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="toTime" className="text-sm font-medium">
                  Available Until
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="toTime"
                    type="time"
                    value={form.availableTo}
                    onChange={(e) => updateField("availableTo", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                About You <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="bio"
                placeholder="Write a short bio about your practice, expertise, and what makes you unique. This will be shown to patients when they browse doctors..."
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.bio.length}/500 characters
              </p>
            </div>
          </div>
        );

      // ─── Step 3: Review ───────────────────────────────
      case 3: {
        const finalDegree = customDegree.trim() || form.degree;
        const finalSpecialization = customSpecialization.trim() || form.specialization;
        const dayLabels = form.availableDays
          .map((d) => DAYS.find((day) => day.value === d)?.label)
          .filter(Boolean)
          .join(", ");

        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Review Your Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This is how patients will see you on Nurturee.
              </p>
            </div>

            {/* Preview Card — mimics how patients will see it */}
            <Card className="overflow-hidden border-2 border-blue-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={form.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-white/30 shadow-md"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                      {form.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold">{form.name || "Doctor"}</h3>
                    <p className="text-blue-100 text-sm">{finalSpecialization}</p>
                    <p className="text-blue-200 text-xs mt-0.5">{finalDegree}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Experience</p>
                    <p className="font-medium mt-0.5">{form.experienceYears || 0} years</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Reg. No.</p>
                    <p className="font-medium mt-0.5">{form.registrationNo || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Area</p>
                    <p className="font-medium mt-0.5">{form.area || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Languages</p>
                    <p className="font-medium mt-0.5">{form.languages || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Online Fee</p>
                    <p className="font-semibold mt-0.5 text-sky-600">
                      ₹{Number(form.consultationFeeOnline || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">In-Person Fee</p>
                    <p className="font-semibold mt-0.5 text-emerald-600">
                      ₹{Number(form.consultationFeeOffline || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Availability</p>
                  <p className="font-medium mt-0.5">{dayLabels || "Not set"}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {form.availableFrom} — {form.availableTo}
                  </p>
                </div>
                {form.bio && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">About</p>
                      <p className="text-sm mt-1 leading-relaxed">{form.bio}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700">
                <span className="font-semibold">You can edit your profile anytime</span> from the Profile section in the sidebar after setup.
              </p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sm:px-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Complete Your Profile</h1>
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length} — {STEPS[step].label}
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="bg-white border-b px-4 py-3 sm:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium hidden sm:block",
                      isActive ? "text-blue-700" : isDone ? "text-emerald-600" : "text-gray-400"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 rounded-full",
                      i < step ? "bg-emerald-400" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:px-8 sm:py-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-5 sm:p-8">
              {/* Error */}
              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <span>{error}</span>
                </div>
              )}

              {renderStepContent()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t px-4 py-4 sm:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0 && !onBack}
            className="gap-2"
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
export { DoctorProfileSetup };