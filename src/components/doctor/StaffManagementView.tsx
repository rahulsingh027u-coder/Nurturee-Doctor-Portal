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
  permissions: string; // JSON string
  isActive: boolean;
  userId: string | null;
  user?: { name: string; phone?: string; avatar?: string } | null;
  createdAt: string;
}

interface StaffPermissions {
  dashboard: boolean;
  calendar: boolean;
  patients: boolean;
  prescriptions: boolean;
  analytics: boolean;
  video_call: boolean;
  profile: boolean;
  staff: boolean; // can manage other staff
}

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
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("receptionist");
  const [newPerms, setNewPerms] = useState<StaffPermissions>({ ...DEFAULT_PERMISSIONS.receptionist });
  const [newNameError, setNewNameError] = useState("");
  const [newPhoneError, setNewPhoneError] = useState("");
  const [enablingLogin, setEnablingLogin] = useState<string | null>(null);
  const [loginLink, setLoginLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff?doctorId=${doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const resetForm = () => {
    setNewName("");
    setNewPhone("");
    setNewRole("receptionist");
    setNewPerms({ ...DEFAULT_PERMISSIONS.receptionist });
    setNewNameError("");
    setNewPhoneError("");
    setError(null);
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
    setNewNameError("");
    setNewPhoneError("");
    setError(null);

    if (!newName.trim()) { setNewNameError("Name is required"); valid = false; }
    if (!newPhone.trim() || newPhone.trim().length < 10) {
      setNewPhoneError("Enter a valid phone number");
      valid = false;
    }
    if (!valid) return;

    setSaving(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          name: newName.trim(),
          phone: newPhone.trim(),
          role: newRole,
          permissions: newPerms,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add staff member");
      }

      setSuccess(`${newName.trim()} added successfully`);
      setShowAddForm(false);
      resetForm();
      fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}? This will revoke their access immediately.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess(`${name} removed`);
      fetchStaff();
    } catch {
      setError("Failed to remove staff member");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      const res = await fetch(`/api/staff?id=${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      if (!res.ok) throw new Error();
      fetchStaff();
    } catch {
      setError("Failed to update status");
    }
  };

  const handleEnableLogin = async (member: StaffMember) => {
    setEnablingLogin(member.id);
    setLoginLink(null);
    try {
      // Create a User account with STAFF role for this staff member
      const { db } = await import("@/lib/db");

      // Check if user already exists for this staff
      if (member.userId) {
        setLoginLink("Staff member already has login access");
        setEnablingLogin(null);
        return;
      }

      // Check if a user with this phone already exists
      let user = await db.user.findUnique({ where: { phone: member.phone } });
      if (!user) {
        user = await db.user.create({
          data: {
            phone: member.phone,
            name: member.name,
            role: "STAFF",
          },
        });
      } else {
        // Update existing user to STAFF role
        user = await db.user.update({
          where: { id: user.id },
          data: { role: "STAFF", name: member.name },
        });
      }

      // Link user to staff member
      await db.staffMember.update({
        where: { id: member.id },
        data: { userId: user.id },
      });

      setLoginLink("Login access enabled! Staff can now log in with OTP using their phone number.");
      fetchStaff();
    } catch (err) {
      setError("Failed to enable login: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setEnablingLogin(null);
    }
  };

  const copyLoginInfo = (member: StaffMember) => {
    const perms = JSON.parse(member.permissions || "{}") as StaffPermissions;
    const accessibleSections = Object.entries(PERMISSION_LABELS)
      .filter(([k]) => perms[k as keyof StaffPermissions])
      .map(([, v]) => v.label)
      .join(", ");
    const text = `Nurturee Doctor Portal - Staff Login\nPhone: ${member.phone}\nOTP: 123456 (dev mode)\nAccess: ${accessibleSections || "None"}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const parsePermissions = (permStr: string): StaffPermissions => {
    try {
      return { ...DEFAULT_PERMISSIONS.custom, ...JSON.parse(permStr) };
    } catch {
      return { ...DEFAULT_PERMISSIONS.custom };
    }
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
            Manage sub-users who can access your portal with limited permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
              <Check className="h-3 w-3" /> {success}
            </Badge>
          )}
          <Button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">How it works:</span> Add staff members (receptionist, assistant, etc.) and assign them specific permissions.
          They can log in with their phone via OTP and only see the sections you allow.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

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
            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Staff member's name"
                    value={newName}
                    onChange={(e) => { setNewName(e.target.value); setNewNameError(""); }}
                    className="pl-10"
                  />
                </div>
                {newNameError && <p className="text-xs text-red-500 mt-1">{newNameError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="10-digit phone number"
                    value={newPhone}
                    onChange={(e) => { setNewPhone(e.target.value); setNewPhoneError(""); }}
                    className="pl-10"
                    maxLength={10}
                  />
                </div>
                {newPhoneError && <p className="text-xs text-red-500 mt-1">{newPhoneError}</p>}
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleRoleChange(r.value)}
                    className={cn(
                      "flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                      newRole === r.value
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-border hover:border-blue-300 hover:bg-blue-50/50"
                    )}
                  >
                    <span className={cn("text-sm font-medium", newRole === r.value ? "text-blue-700" : "text-foreground")}>
                      {r.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Permission Toggles */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Permissions</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(PERMISSION_LABELS).map(([key, { label, desc }]) => {
                  const isOn = newPerms[key as keyof StaffPermissions];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePermission(key)}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                        isOn
                          ? "border-blue-400 bg-blue-50/80"
                          : "border-border hover:border-blue-200"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                        isOn ? "border-blue-600 bg-blue-600" : "border-slate-300"
                      )}>
                        {isOn && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-medium", isOn ? "text-blue-700" : "text-foreground")}>
                          {label}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>Cancel</Button>
              <Button
                onClick={handleAdd}
                disabled={saving}
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
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
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Add receptionists, assistants, or clinic managers to help manage your practice
              </p>
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
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600 shrink-0">
                    {member.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">{member.name}</h3>
                      <Badge variant="outline" className={cn("text-[10px]", getRoleBadgeColor(member.role))}>
                        {member.role}
                      </Badge>
                      {member.userId ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] gap-1">
                          <KeyRound className="h-2.5 w-2.5" /> Login Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-400">No Login</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      +91 {member.phone} · {activeCount} section{activeCount !== 1 ? "s" : ""} accessible
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("gap-1 text-xs", isExpanded ? "text-blue-600" : "text-muted-foreground")}
                      onClick={() => setExpandedId(isExpanded ? null : member.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-muted-foreground hover:text-amber-600"
                      onClick={() => handleToggleActive(member)}
                    >
                      {member.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {member.isActive ? "Active" : "Disabled"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={deleting === member.id}
                      onClick={() => handleDelete(member.id, member.name)}
                    >
                      {deleting === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Permissions */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Permissions</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(PERMISSION_LABELS).map(([key, { label }]) => {
                            const has = perms[key as keyof StaffPermissions];
                            return (
                              <Badge
                                key={key}
                                variant="outline"
                                className={cn("text-xs", has ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-400 line-through")}
                              >
                                {has ? <Eye className="mr-1 h-2.5 w-2.5" /> : <EyeOff className="mr-1 h-2.5 w-2.5" />}
                                {label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      {/* Login Actions */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Login Access</p>
                        {member.userId ? (
                          <div className="space-y-2">
                            <p className="text-xs text-emerald-600 flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Staff can log in with phone OTP
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={() => copyLoginInfo(member)}
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {copied ? "Copied!" : "Copy Login Info"}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Staff member doesn&apos;t have login access yet
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              disabled={enablingLogin === member.id}
                              onClick={() => handleEnableLogin(member)}
                            >
                              {enablingLogin === member.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <KeyRound className="h-3 w-3" />
                              )}
                              {enablingLogin === member.id ? "Enabling..." : "Enable Login"}
                            </Button>
                            {loginLink && member.id === expandedId && (
                              <p className="text-xs text-emerald-600">{loginLink}</p>
                            )}
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
    </div>
  );
}
export { StaffManagementView };