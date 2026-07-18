"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserRound,
  Stethoscope,
  GraduationCap,
  Award,
  Clock,
  IndianRupee,
  FileCheck,
  Check,
  Loader2,
  Pencil,
  Save,
  X,
  CalendarDays,
  Video,
  Phone,
  Camera,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPECIALIZATIONS = [
  "General Physician", "Pediatrician", "Gynaecologist", "Dermatologist",
  "Orthopedic", "ENT Specialist", "Ophthalmologist", "Psychiatrist",
  "Cardiologist", "Neurologist", "Geriatric Specialist", "Dentist",
  "Ayurvedic Doctor", "Homeopathic Doctor", "Other",
];

const DEGREES = [
  "MBBS", "MBBS, MD", "MBBS, MS", "MBBS, DCH", "MBBS, DNB",
  "BDS", "BAMS", "BHMS", "MD", "MS", "DM", "MCh", "DGO", "FRCOG", "Other",
];

const DAYS = [
  { value: "0", label: "Sun" }, { value: "1", label: "Mon" },
  { value: "2", label: "Tue" }, { value: "3", label: "Wed" },
  { value: "4", label: "Thu" }, { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
];

const DAY_MAP: Record<string, string> = {
  "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday",
  "4": "Thursday", "5": "Friday", "6": "Saturday",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DoctorProfileViewProps {
  doctorId: string;
  userId: string;
  profile: Record<string, unknown> | null;
  onProfileUpdated: () => void;
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

export default function DoctorProfileView({
  doctorId,
  userId,
  profile: initialProfile,
  onProfileUpdated,
}: DoctorProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(!initialProfile);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    (initialProfile?.user as Record<string, unknown>)?.avatar as string || ""
  );
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState<Record<string, unknown> | null>(initialProfile);

  // Fetch profile if not provided
  useEffect(() => {
    if (initialProfile) {
      const user = initialProfile.user as Record<string, unknown> | undefined;
      if (user?.avatar) setAvatarUrl(String(user.avatar));
      return;
    }
    let cancelled = false;
    fetch(`/api/doctors?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        const u = data.user as Record<string, unknown> | undefined;
        if (u?.avatar) setAvatarUrl(String(u.avatar));
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, initialProfile]);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    specialization: "",
    degree: "",
    experienceYears: "",
    registrationNo: "",
    area: "",
    languages: "",
    consultationFeeOnline: "",
    consultationFeeOffline: "",
    availableFrom: "09:00",
    availableTo: "21:00",
    availableDays: ["1", "2", "3", "4", "5", "6"],
    bio: "",
  });

  // Populate form when profile loads or editing starts
  const startEditing = useCallback(() => {
    if (!profile) return;
    const p = profile;
    const user = p.user as Record<string, unknown> | undefined;
    setAvatarUrl(user?.avatar ? String(user.avatar) : "");
    setForm({
      name: user?.name ? String(user.name) : "",
      email: user?.email ? String(user.email) : "",
      specialization: String(p.specialization || ""),
      degree: String(p.degree || ""),
      experienceYears: Number(p.experienceYears) || 0,
      registrationNo: String(p.registrationNo || ""),
      consultationFeeOnline: Number(p.consultationFeeOnline) || 0,
      consultationFeeOffline: Number(p.consultationFeeOffline) || 0,
      availableFrom: String(p.availableFrom || "09:00"),
      availableTo: String(p.availableTo || "21:00"),
      availableDays: String(p.availableDays || "1,2,3,4,5,6").split(",").filter(Boolean),
      bio: String(p.bio || ""),
    });
    setError(null);
    setSuccess(false);
    setEditing(true);
  }, [profile]);

  const cancelEditing = () => {
    setEditing(false);
    setError(null);
    // Reset avatar to DB value
    const user = profile?.user as Record<string, unknown> | undefined;
    setAvatarUrl(user?.avatar ? String(user.avatar) : "");
  };

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }
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
      const res = await fetch("/api/upload", { method: "POST", body: formData });
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

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/doctors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: form.name.trim(),
          email: form.email.trim() || null,
          specialization: form.specialization,
          degree: form.degree,
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

      setSuccess(true);
      setEditing(false);
      onProfileUpdated();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const days = prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day];
      return { ...prev, availableDays: days.sort() };
    });
  };

  const updateField = (field: keyof ProfileForm, value: string | number | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Loading ─────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-sm text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const user = profile.user as Record<string, unknown> | undefined;
  const displayName = user?.name ? String(user.name) : "Doctor";
  const initials = displayName.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  // ─── Edit Mode ────────────────────────────────────
  if (editing) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Edit Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">Update your professional details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelEditing} className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Profile Photo */}
              <div className="sm:col-span-2 flex flex-col items-center gap-3 pb-2">
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
                        onClick={() => { setAvatarUrl(""); }}
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
                  <label className="absolute inset-0 flex h-24 w-24 items-center justify-center rounded-full cursor-pointer">
                    <div className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity",
                      avatarUrl
                        ? "bg-black/60 text-white opacity-0 group-hover:opacity-100"
                        : "absolute -bottom-8 bg-blue-600 text-white shadow-md"
                    )}>
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
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

              <div className="space-y-2">
                <Label className="text-sm font-medium">Full Name</Label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Specialization</Label>
                <select
                  value={form.specialization}
                  onChange={(e) => updateField("specialization", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Degree</Label>
                <Input value={form.degree} onChange={(e) => updateField("degree", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Experience (years)</Label>
                <Input type="number" min="0" value={form.experienceYears} onChange={(e) => updateField("experienceYears", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Registration No.</Label>
                <Input value={form.registrationNo} onChange={(e) => updateField("registrationNo", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Area / Location</Label>
                <Input placeholder="e.g. Sector 18, Gurgaon" value={form.area} onChange={(e) => updateField("area", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Languages</Label>
                <Input placeholder="e.g. English, Hindi, Punjabi" value={form.languages} onChange={(e) => updateField("languages", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Online Fee (₹)</Label>
                <Input type="number" min="0" value={form.consultationFeeOnline} onChange={(e) => updateField("consultationFeeOnline", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">In-Person Fee (₹)</Label>
                <Input type="number" min="0" value={form.consultationFeeOffline} onChange={(e) => updateField("consultationFeeOffline", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available From</Label>
                <Input type="time" value={form.availableFrom} onChange={(e) => updateField("availableFrom", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Until</Label>
                <Input type="time" value={form.availableTo} onChange={(e) => updateField("availableTo", e.target.value)} />
              </div>
            </div>

            {/* Day selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Available Days</Label>
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
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-muted-foreground border-input hover:border-blue-300"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">About You</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── View Mode ────────────────────────────────────
  const availDays = String(profile.availableDays || "1,2,3,4,5,6").split(",").filter(Boolean);
  const feeOnline = Number(profile.consultationFeeOnline || 0);
  const feeOffline = Number(profile.consultationFeeOffline || 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your professional information</p>
        </div>
        {success && (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
            <Check className="h-3 w-3" /> Saved
          </Badge>
        )}
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 sm:py-8 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {user?.avatar ? (
              <img
                src={String(user.avatar)}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover border-2 border-white/30 shadow-md shrink-0"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold shrink-0">
                {initials}
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-blue-100 text-sm mt-0.5">{String(profile.specialization || "Not set")}</p>
              <p className="text-blue-200 text-xs mt-0.5">{String(profile.degree || "Not set")}</p>
              {user?.phone && (
                <p className="text-blue-200/70 text-xs mt-2">+91 {String(user.phone)}</p>
              )}
            </div>
            <Button
              onClick={startEditing}
              variant="outline"
              className="bg-white/15 border-white/25 text-white hover:bg-white/25 hover:text-white gap-2"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-blue-50/60 p-4 text-center">
              <Award className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-800">{profile.experienceYears || 0}</p>
              <p className="text-[10px] text-blue-600/80 uppercase tracking-wider">Years Exp.</p>
            </div>
            <div className="rounded-xl bg-sky-50/60 p-4 text-center">
              <Video className="h-5 w-5 text-sky-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-sky-700">₹{feeOnline.toLocaleString("en-IN")}</p>
              <p className="text-[10px] text-sky-500/80 uppercase tracking-wider">Online Fee</p>
            </div>
            <div className="rounded-xl bg-emerald-50/60 p-4 text-center">
              <Phone className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-emerald-700">₹{feeOffline.toLocaleString("en-IN")}</p>
              <p className="text-[10px] text-emerald-500/80 uppercase tracking-wider">In-Person Fee</p>
            </div>
            <div className="rounded-xl bg-violet-50/60 p-4 text-center">
              <CalendarDays className="h-5 w-5 text-violet-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-violet-700">{availDays.length}</p>
              <p className="text-[10px] text-violet-500/80 uppercase tracking-wider">Days/Week</p>
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Registration No.</p>
              <p className="font-medium mt-0.5">{String(profile.registrationNo || "Not provided")}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Email</p>
              <p className="font-medium mt-0.5">{user?.email ? String(user.email) : "Not provided"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Available Days</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {availDays.map((d) => (
                  <Badge key={d} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    {DAY_MAP[d] || d}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Working Hours</p>
              <p className="font-medium mt-0.5">
                {String(profile.availableFrom || "09:00")} — {String(profile.availableTo || "21:00")}
              </p>
            </div>
          </div>

          {profile.bio && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">About</p>
                <p className="text-sm leading-relaxed">{String(profile.bio)}</p>
              </div>
            </>
          )}

          {/* Patient Preview Notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Patient-facing:</span> This profile is visible to patients on the Nurturee app. 
              They can find you by specialization and book consultations directly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export { DoctorProfileView };