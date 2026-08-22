"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  UserRound,
  ChevronDown,
  ChevronUp,
  X,
  KeyRound,
  Copy,
  Check,
  Stethoscope,
  Search,
  UserSearch,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  permissions: string;
  isActive: boolean;
  userId: string | null;
  user?: { name: string; phone?: string; avatar?: string } | null;
  createdAt: string;
}

interface LinkedDoctor {
  id: string;
  linkedDoctorId: string;
  permissions: string;
  isActive: boolean;
  linkedDoctor: {
    id: string;
    specialization: string;
    degree: string;
    user: { name: string; phone?: string; avatar?: string };
  };
  createdAt: string;
}

interface DoctorSearchResult {
  id: string;
  specialization: string;
  degree: string;
  experienceYears: number;
  user: { name: string; phone?: string; avatar?: string };
}

interface StaffPermissions {
  dashboard: boolean;
  calendar: boolean;
  patients: boolean;
  prescriptions: boolean;
  analytics: boolean;
  video_call: boolean;
  profile: boolean;
  staff: boolean;
}

type TabType = "staff" | "doctors";

interface StaffManagementViewProps {
  doctorId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_OPTIONS = [
  { value: "receptionist", label: "Receptionist", desc: "Manage bookings & calendar" },
  { value: "assistant", label: "Assistant", desc: "Help with patients & prescriptions" },
  { value: "manager", label: "Clinic Manager", desc: "Full access except profile & staff" },
  { value: "custom", label: "Custom", desc: "You choose individual permissions" },
];

const PERMISSION_LABELS: Record<string, { label: string; desc: string }> = {
  dashboard: { label: "Dashboard", desc: "View appointments, stats, and overview" },
  calendar: { label: "Calendar", desc: "View and manage schedule & time slots" },
  patients: { label: "Patients", desc: "View patient list and history" },
  prescriptions: { label: "Prescriptions", desc: "Write and manage prescriptions" },
  analytics: { label: "Analytics", desc: "View earnings and performance reports" },
  video_call: { label: "Video Call", desc: "Start and join video consultations" },
  profile: { label: "Profile", desc: "View and edit doctor profile" },
  staff: { label: "Staff Management", desc: "Add, edit, or remove staff members" },
};

const DOCTOR_PERMISSION_LABELS: Record<string, { label: string; desc: string }> = {
  calendar: { label: "Calendar", desc: "View and manage your schedule" },
  patients: { label: "Patients", desc: "Access patient records" },
  prescriptions: { label: "Prescriptions", desc: "Write prescriptions" },
  analytics: { label: "Analytics", desc: "View performance reports" },
  video_call: { label: "Video Call", desc: "Join video consultations" },
};

const DEFAULT_PERMISSIONS: Record<string, StaffPermissions> = {
  receptionist: { dashboard: true, calendar: true, patients: true, prescriptions: false, analytics: false, video_call: false, profile: false, staff: false },
  assistant: { dashboard: true, calendar: true, patients: true, prescriptions: true, analytics: false, video_call: false, profile: false, staff: false },
  manager: { dashboard: true, calendar: true, patients: true, prescriptions: true, analytics: true, video_call: true, profile: false, staff: false },
  custom: { dashboard: false, calendar: false, patients: false, prescriptions: false, analytics: false, video_call: false, profile: false, staff: false },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StaffManagementView({ doctorId }: StaffManagementViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("staff");

  // ── Staff state ──
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("receptionist");
  const [newPerms, setNewPerms] = useState<StaffPermissions>({ ...DEFAULT_PERMISSIONS.receptionist });
  const [newNameError, setNewNameError] = useState("");
  const [newPhoneError, setNewPhoneError] = useState("");
  const [enablingLogin, setEnablingLogin] = useState<string | null>(null);
  const [loginLink, setLoginLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Linked Doctors state ──
  const [linkedDoctors, setLinkedDoctors] = useState<LinkedDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [doctorSearchResults, setDoctorSearchResults] = useState<DoctorSearchResult[]>([]);
  const [searchingDoctors, setSearchingDoctors] = useState(false);
  const [linkingDoctor, setLinkingDoctor] = useState<string | null>(null);
  const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null);
  const [newDocPerms, setNewDocPerms] = useState<Record<string, boolean>>({
    calendar: true, patients: true, prescriptions: true, analytics: false, video_call: true,
  });
  const [showDocPermForm, setShowDocPermForm] = useState(false);
  const [pendingLinkId, setPendingLinkId] = useState<string | null>(null);

  // ── Fetch staff ──
  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff?doctorId=${doctorId}`);
      if (res.ok) setStaffList(await res.json());
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // ── Fetch linked doctors ──
  const fetchLinkedDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    try {
      const res = await fetch(`/api/linked-doctors?primaryDoctorId=${doctorId}`);
      if (res.ok) setLinkedDoctors(await res.json());
    } catch (err) {
      console.error("Failed to fetch linked doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  }, [doctorId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);
  useEffect(() => { if (activeTab === "doctors") fetchLinkedDoctors(); }, [activeTab, fetchLinkedDoctors]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  // ── Staff handlers ──
  const resetForm = () => {
    setNewName(""); setNewPhone(""); setNewRole("receptionist");
    setNewPerms({ ...DEFAULT_PERMISSIONS.receptionist });
    setNewNameError(""); setNewPhoneError(""); setError(null);
  };

  const handleRoleChange = (role: string) => {
    setNewRole(role);
    setNewPerms({ ...DEFAULT_PERMISSIONS[role] });
  };

  const togglePermission = (key: string) => {
    setNewPerms((prev) => ({ ...prev, [key]: !prev[key as keyof StaffPermissions] }));
  };

  const handleAdd = async () => {
    let valid = true;
    setNewNameError(""); setNewPhoneError(""); setError(null);
    if (!newName.trim()) { setNewNameError("Name is required"); valid = false; }
    if (!newPhone.trim() || newPhone.trim().length < 10) { setNewPhoneError("Enter a valid phone number"); valid = false; }
    if (!valid) return;

    setSaving(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, name: newName.trim(), phone: newPhone.trim(), role: newRole, permissions: newPerms }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed"); }
      setSuccess(`${newName.trim()} added successfully`);
      setShowAddForm(false); resetForm(); fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}? This will revoke their access immediately.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess(`${name} removed`); fetchStaff();
    } catch { setError("Failed to remove staff member"); } finally { setDeleting(null); }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      const res = await fetch(`/api/staff?id=${member.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      if (!res.ok) throw new Error(); fetchStaff();
    } catch { setError("Failed to update status"); }
  };

  const handleEnableLogin = async (member: StaffMember) => {
    setEnablingLogin(member.id); setLoginLink(null);
    try {
      const { db } = await import("@/lib/db");
      if (member.userId) { setLoginLink("Staff member already has login access"); setEnablingLogin(null); return; }
      let user = await db.user.findUnique({ where: { phone: member.phone } });
      if (!user) {
        user = await db.user.create({ data: { phone: member.phone, name: member.name, role: "STAFF" } });
      } else {
        user = await db.user.update({ where: { id: user.id }, data: { role: "STAFF", name: member.name } });
      }
      await db.staffMember.update({ where: { id: member.id }, data: { userId: user.id } });
      setLoginLink("Login access enabled! Staff can now log in with OTP using their phone number.");
      fetchStaff();
    } catch (err) {
      setError("Failed to enable login: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally { setEnablingLogin(null); }
  };

  const copyLoginInfo = (member: StaffMember) => {
    const perms = JSON.parse(member.permissions || "{}") as StaffPermissions;
    const accessibleSections = Object.entries(PERMISSION_LABELS)
      .filter(([k]) => perms[k as keyof StaffPermissions])
      .map(([, v]) => v.label).join(", ");
    const text = `Nurturee Doctor Portal - Staff Login\nPhone: ${member.phone}\nOTP: 123456 (dev mode)\nAccess: ${accessibleSections || "None"}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // ── Linked Doctor handlers ──
  const handleSearchDoctors = async () => {
    if (!doctorSearchQuery.trim()) return;
    setSearchingDoctors(true);
    try {
      const isPhone = /^\d/.test(doctorSearchQuery.trim());
      const params = new URLSearchParams({ excludeDoctorId: doctorId });
      if (isPhone) params.set("phone", doctorSearchQuery.trim());
      else params.set("name", doctorSearchQuery.trim());
      const res = await fetch(`/api/doctors/search?${params}`);
      if (res.ok) setDoctorSearchResults(await res.json());
      else setDoctorSearchResults([]);
    } catch { setDoctorSearchResults([]); } finally { setSearchingDoctors(false); }
  };

  const handleLinkDoctor = async (targetDoctorId: string) => {
    setLinkingDoctor(targetDoctorId);
    try {
      const res = await fetch("/api/linked-doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryDoctorId: doctorId, linkedDoctorId: targetDoctorId, permissions: newDocPerms }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed"); }
      setSuccess("Doctor linked successfully");
      setShowDoctorSearch(false); setDoctorSearchQuery(""); setDoctorSearchResults([]);
      fetchLinkedDoctors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link doctor");
    } finally { setLinkingDoctor(null); }
  };

  const handleRemoveLinkedDoctor = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your portal?`)) return;
    try {
      const res = await fetch(`/api/linked-doctors?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess(`${name} removed`); fetchLinkedDoctors();
    } catch { setError("Failed to remove doctor"); }
  };

  const handleToggleDoctorActive = async (ld: LinkedDoctor) => {
    try {
      const res = await fetch(`/api/linked-doctors?id=${ld.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ld.isActive }),
      });
      if (!res.ok) throw new Error(); fetchLinkedDoctors();
    } catch { setError("Failed to update"); }
  };

  const parsePermissions = (permStr: string): StaffPermissions => {
    try { return { ...DEFAULT_PERMISSIONS.custom, ...JSON.parse(permStr) }; } catch { return { ...DEFAULT_PERMISSIONS.custom }; }
  };

  const parseDocPermissions = (permStr: string): Record<string, boolean> => {
    try { return JSON.parse(permStr); } catch { return {}; }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "manager": return "bg-blue-100 text-blue-700 border-blue-200";
      case "assistant": return "bg-violet-100 text-violet-700 border-violet-200";
      case "custom": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // ─── Loading ─────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-60 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Staff Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage sub-users and linked doctors with limited permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
              <Check className="h-3 w-3" /> {success}
            </Badge>
          )}
          {activeTab === "staff" ? (
            <Button onClick={() => { resetForm(); setShowAddForm(true); }} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add Staff
            </Button>
          ) : (
            <Button onClick={() => { setDoctorSearchQuery(""); setDoctorSearchResults([]); setShowDoctorSearch(true); }} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add Doctor
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("staff")}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "staff" ? "bg-white text-blue-700 shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-4 w-4" /> Staff
          {staffList.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
              {staffList.length}
            </Badge>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("doctors")}
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
            activeTab === "doctors" ? "bg-white text-blue-700 shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Stethoscope className="h-4 w-4" /> Doctors
          {linkedDoctors.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
              {linkedDoctors.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* ==================== STAFF TAB ==================== */}
      {activeTab === "staff" && (
        <>
          {/* Info Banner */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">How it works:</span> Add staff members (receptionist, assistant, etc.) and assign them specific permissions.
              They can log in with their phone via OTP and only see the sections you allow.
            </p>
          </div>

          {/* Add Staff Form */}
          {showAddForm && (
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Add New Staff Member</CardTitle>
                    <CardDescription>Set their role and permissions below</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setShowAddForm(false); resetForm(); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Staff member's name" value={newName} onChange={(e) => { setNewName(e.target.value); setNewNameError(""); }} className="pl-10" />
                    </div>
                    {newNameError && <p className="text-xs text-red-500 mt-1">{newNameError}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="10-digit phone number" value={newPhone} onChange={(e) => { setNewPhone(e.target.value); setNewPhoneError(""); }} className="pl-10" maxLength={10} />
                    </div>
                    {newPhoneError && <p className="text-xs text-red-500 mt-1">{newPhoneError}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Role</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ROLE_OPTIONS.map((r) => (
                      <button
                        key={r.value} type="button" onClick={() => handleRoleChange(r.value)}
                        className={cn("flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                          newRole === r.value ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-border hover:border-blue-300 hover:bg-blue-50/50"
                        )}
                      >
                        <span className={cn("text-sm font-medium", newRole === r.value ? "text-blue-700" : "text-foreground")}>{r.label}</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Permissions</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(PERMISSION_LABELS).map(([key, { label, desc }]) => {
                      const isOn = newPerms[key as keyof StaffPermissions];
                      return (
                        <button key={key} type="button" onClick={() => togglePermission(key)}
                          className={cn("flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                            isOn ? "border-blue-400 bg-blue-50/80" : "border-border hover:border-blue-200"
                          )}
                        >
                          <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                            isOn ? "border-blue-600 bg-blue-600" : "border-slate-300"
                          )}>
                            {isOn && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className={cn("text-sm font-medium", isOn ? "text-blue-700" : "text-foreground")}>{label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleAdd} disabled={saving} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {saving ? "Adding..." : "Add Staff Member"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff List */}
          {staffList.length === 0 ? (
            <Card className="py-16">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <Users className="h-7 w-7 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No staff members yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">Add receptionists, assistants, or clinic managers to help manage your practice</p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {staffList.map((member) => {
                const perms = parsePermissions(member.permissions);
                const isExpanded = expandedId === member.id;
                const activeCount = Object.values(perms).filter(Boolean).length;

                return (
                  <Card key={member.id} className={cn("transition-all", !member.isActive && "opacity-60")}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600 shrink-0">
                        {member.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground">{member.name}</h3>
                          <Badge variant="outline" className={cn("text-[10px]", getRoleBadgeColor(member.role))}>{member.role}</Badge>
                          {member.userId ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] gap-1"><KeyRound className="h-2.5 w-2.5" /> Login Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-400">No Login</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">+91 {member.phone} · {activeCount} section{activeCount !== 1 ? "s" : ""} accessible</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" className={cn("gap-1 text-xs", isExpanded ? "text-blue-600" : "text-muted-foreground")} onClick={() => setExpandedId(isExpanded ? null : member.id)}>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} Details
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-amber-600" onClick={() => handleToggleActive(member)}>
                          {member.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {member.isActive ? "Active" : "Disabled"}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" disabled={deleting === member.id} onClick={() => handleDelete(member.id, member.name)}>
                          {deleting === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-4 py-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Permissions</p>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(PERMISSION_LABELS).map(([key, { label }]) => {
                                const has = perms[key as keyof StaffPermissions];
                                return (
                                  <Badge key={key} variant="outline" className={cn("text-xs", has ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-400 line-through")}>
                                    {has ? <Eye className="mr-1 h-2.5 w-2.5" /> : <EyeOff className="mr-1 h-2.5 w-2.5" />}{label}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Login Access</p>
                            {member.userId ? (
                              <div className="space-y-2">
                                <p className="text-xs text-emerald-600 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Staff can log in with phone OTP</p>
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => copyLoginInfo(member)}>
                                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? "Copied!" : "Copy Login Info"}
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Staff member doesn&apos;t have login access yet</p>
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" disabled={enablingLogin === member.id} onClick={() => handleEnableLogin(member)}>
                                  {enablingLogin === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
                                  {enablingLogin === member.id ? "Enabling..." : "Enable Login"}
                                </Button>
                                {loginLink && member.id === expandedId && <p className="text-xs text-emerald-600">{loginLink}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                        {member.createdAt && (
                          <p className="text-[11px] text-muted-foreground">
                            Added {new Date(member.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================== DOCTORS TAB ==================== */}
      {activeTab === "doctors" && (
        <>
          {/* Info Banner */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
            <p className="text-xs text-indigo-700">
              <span className="font-semibold">Link Doctors:</span> Add other doctors to your portal. They will have their own login and can access sections you permit.
              Search by their registered phone number or name.
            </p>
          </div>

          {/* Doctor Search Dialog */}
          {showDoctorSearch && (
            <Card className="border-2 border-indigo-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Add a Doctor</CardTitle>
                    <CardDescription>Search by phone number or name to find and link a doctor</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setShowDoctorSearch(false); setDoctorSearchResults([]); setShowDocPermForm(false); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter doctor's phone or name..."
                      value={doctorSearchQuery}
                      onChange={(e) => setDoctorSearchQuery(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === "Enter" && handleSearchDoctors()}
                    />
                  </div>
                  <Button onClick={handleSearchDoctors} disabled={searchingDoctors || !doctorSearchQuery.trim()} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                    {searchingDoctors ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </Button>
                </div>

                {/* Already linked warning */}
                {pendingLinkId && (
                  <div className="space-y-4">
                    <Separator />
                    <p className="text-sm font-medium">Set permissions for this doctor:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(DOCTOR_PERMISSION_LABELS).map(([key, { label, desc }]) => {
                        const isOn = newDocPerms[key] || false;
                        return (
                          <button key={key} type="button" onClick={() => setNewDocPerms(prev => ({ ...prev, [key]: !prev[key] }))}
                            className={cn("flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                              isOn ? "border-indigo-400 bg-indigo-50/80" : "border-border hover:border-indigo-200"
                            )}
                          >
                            <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                              isOn ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                            )}>
                              {isOn && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="min-w-0">
                              <p className={cn("text-sm font-medium", isOn ? "text-indigo-700" : "text-foreground")}>{label}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => { setPendingLinkId(null); setShowDocPermForm(false); }}>Cancel</Button>
                      <Button onClick={() => { if (pendingLinkId) handleLinkDoctor(pendingLinkId); }} disabled={linkingDoctor === pendingLinkId} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                        {linkingDoctor === pendingLinkId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        {linkingDoctor === pendingLinkId ? "Linking..." : "Link Doctor"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {!pendingLinkId && doctorSearchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Found {doctorSearchResults.length} doctor{doctorSearchResults.length !== 1 ? "s" : ""}</p>
                    {doctorSearchResults.map((doc) => {
                      const alreadyLinked = linkedDoctors.some(ld => ld.linkedDoctorId === doc.id);
                      return (
                        <div key={doc.id} className={cn("flex items-center gap-3 rounded-lg border p-3 transition-all",
                          alreadyLinked ? "bg-slate-50 opacity-60" : "hover:border-blue-300"
                        )}>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600 shrink-0">
                            {doc.user.avatar ? (
                              <img src={doc.user.avatar} alt={doc.user.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              doc.user.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{doc.user.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.specialization} · {doc.degree} · {doc.experienceYears}yrs exp</p>
                            {doc.user.phone && <p className="text-xs text-muted-foreground">+91 {doc.user.phone}</p>}
                          </div>
                          {alreadyLinked ? (
                            <Badge className="bg-slate-100 text-slate-500 text-xs">Already Linked</Badge>
                          ) : (
                            <Button size="sm" className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => { setPendingLinkId(doc.id); setShowDocPermForm(true); }}
                            >
                              <Plus className="h-3.5 w-3.5" /> Link
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!pendingLinkId && doctorSearchQuery && !searchingDoctors && doctorSearchResults.length === 0 && (
                  <div className="py-8 text-center">
                    <UserSearch className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No doctors found. Make sure the doctor has completed their profile.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Linked Doctors List */}
          {loadingDoctors ? (
            <div className="h-40 w-full animate-pulse rounded-xl bg-slate-100" />
          ) : linkedDoctors.length === 0 && !showDoctorSearch ? (
            <Card className="py-16">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                  <Stethoscope className="h-7 w-7 text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No linked doctors yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Add other doctors to your portal. They can manage their own patients, prescriptions, and schedule within your practice.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {linkedDoctors.map((ld) => {
                const doc = ld.linkedDoctor;
                const perms = parseDocPermissions(ld.permissions);
                const isExpanded = expandedDoctorId === ld.id;
                const activeCount = Object.values(perms).filter(Boolean).length;

                return (
                  <Card key={ld.id} className={cn("transition-all", !ld.isActive && "opacity-60")}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600 shrink-0 overflow-hidden">
                        {doc.user.avatar ? (
                          <img src={doc.user.avatar} alt={doc.user.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          doc.user.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground">{doc.user.name}</h3>
                          <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">Doctor</Badge>
                          {!ld.isActive && <Badge variant="outline" className="text-[10px] text-slate-400">Disabled</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doc.specialization} · {doc.degree} · {activeCount} section{activeCount !== 1 ? "s" : ""} accessible
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" className={cn("gap-1 text-xs", isExpanded ? "text-indigo-600" : "text-muted-foreground")} onClick={() => setExpandedDoctorId(isExpanded ? null : ld.id)}>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} Details
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-amber-600" onClick={() => handleToggleDoctorActive(ld)}>
                          {ld.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {ld.isActive ? "Active" : "Disabled"}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveLinkedDoctor(ld.id, doc.user.name)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-4 py-4 space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Permissions</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(DOCTOR_PERMISSION_LABELS).map(([key, { label }]) => {
                              const has = perms[key] || false;
                              return (
                                <Badge key={key} variant="outline" className={cn("text-xs", has ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-50 text-slate-400 line-through")}>
                                  {has ? <Eye className="mr-1 h-2.5 w-2.5" /> : <EyeOff className="mr-1 h-2.5 w-2.5" />}{label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        {doc.user.phone && (
                          <p className="text-xs text-muted-foreground">Phone: +91 {doc.user.phone}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          Linked {new Date(ld.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
export { StaffManagementView };
