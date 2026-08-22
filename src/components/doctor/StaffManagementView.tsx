"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Trash2, Shield, ShieldCheck, Eye, EyeOff,
  Loader2, Phone, UserRound, ChevronDown, ChevronUp, X,
  KeyRound, Copy, Check, Stethoscope, Search, UserSearch,
  Building2, MapPin, Mail, LogOut, Pencil, Briefcase, UserPlus, Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffMember {
  id: string; name: string; phone: string; role: string;
  permissions: string; isActive: boolean; userId: string | null;
  user?: { name: string; phone?: string; avatar?: string } | null;
  createdAt: string;
}

interface LinkedDoctor {
  id: string; linkedDoctorId: string; permissions: string;
  isActive: boolean;
  linkedDoctor: { id: string; specialization: string; degree: string; user: { name: string; phone?: string; avatar?: string } };
  createdAt: string;
}

interface DoctorSearchResult {
  id: string; specialization: string; degree: string; experienceYears: number;
  user: { name: string; phone?: string; avatar?: string };
}

interface ClinicSearchResult {
  id: string; name: string; city: string; type: string;
  _count: { doctorMemberships: number; staffMembers: number };
}

interface StaffPermissions {
  dashboard: boolean; calendar: boolean; patients: boolean;
  prescriptions: boolean; analytics: boolean; video_call: boolean;
  profile: boolean; staff: boolean;
}

type TabType = "staff" | "doctors" | "clinics";

interface StaffManagementViewProps { doctorId: string; }

interface ClinicDoctorMember {
  id: string; specialization: string; degree: string;
  department: string; associationType: string;
  user: { name: string; phone?: string; avatar?: string };
}

interface ClinicStaffMember {
  id: string; name: string; phone: string; role: string;
  permissions: string; associationType: string; isActive: boolean;
  userId: string | null; createdAt: string;
}

interface MembershipInfo {
  id: string; department: string; associationType: string; joinedAt: string;
}

interface ClinicWithMembers {
  id: string; name: string; address: string; city: string;
  phone: string | null; email: string | null; type: string;
  department: string; isActive: boolean; createdAt: string;
  _membership: MembershipInfo;
  doctors: ClinicDoctorMember[];
  staffMembers: ClinicStaffMember[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_OPTIONS = [
  { value: "receptionist", label: "Receptionist", desc: "Manage bookings & calendar" },
  { value: "assistant", label: "Assistant", desc: "Help with patients & prescriptions" },
  { value: "manager", label: "Clinic Manager", desc: "Full access except profile & staff" },
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
  calendar: { label: "Calendar", desc: "View and manage schedule" },
  patients: { label: "Patients", desc: "Access patient records" },
  prescriptions: { label: "Prescriptions", desc: "Write prescriptions" },
  analytics: { label: "Analytics", desc: "View performance reports" },
  video_call: { label: "Video Call", desc: "Join video consultations" },
};

const DEFAULT_PERMISSIONS: Record<string, StaffPermissions> = {
  receptionist: { dashboard: true, calendar: true, patients: true, prescriptions: false, analytics: false, video_call: false, profile: false, staff: false },
  assistant: { dashboard: true, calendar: true, patients: true, prescriptions: true, analytics: false, video_call: false, profile: false, staff: false },
  manager: { dashboard: true, calendar: true, patients: true, prescriptions: true, analytics: true, video_call: true, profile: false, staff: false },
};

const ASSOCIATION_TYPES = [
  { value: "full-time", label: "Full-time", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "part-time", label: "Part-time", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "locum", label: "Locum", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "visiting", label: "Visiting", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { value: "consultant", label: "Consultant", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const CLINIC_TYPES = [
  { value: "clinic", label: "Clinic" },
  { value: "hospital", label: "Hospital" },
  { value: "diagnostic-center", label: "Diagnostic Center" },
];

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

  // ── Clinics state ──
  const [clinics, setClinics] = useState<ClinicWithMembers[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [showCreateClinic, setShowCreateClinic] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);
  const [expandedClinicId, setExpandedClinicId] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicCity, setClinicCity] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicDepartment, setClinicDepartment] = useState("");
  const [clinicType, setClinicType] = useState("clinic");
  const [clinicNameError, setClinicNameError] = useState("");
  const [clinicDocSearchQuery, setClinicDocSearchQuery] = useState("");
  const [clinicDocSearchResults, setClinicDocSearchResults] = useState<DoctorSearchResult[]>([]);
  const [searchingClinicDocs, setSearchingClinicDocs] = useState(false);
  const [addingDocToClinic, setAddingDocToClinic] = useState<string | null>(null);
  const [newClinicDocAssoc, setNewClinicDocAssoc] = useState("full-time");
  const [newClinicDocDept, setNewClinicDocDept] = useState("");
  const [showClinicStaffForm, setShowClinicStaffForm] = useState(false);
  const [clinicStaffName, setClinicStaffName] = useState("");
  const [clinicStaffPhone, setClinicStaffPhone] = useState("");
  const [clinicStaffRole, setClinicStaffRole] = useState("manager");
  const [clinicStaffAssoc, setClinicStaffAssoc] = useState("full-time");
  const [clinicStaffPerms, setClinicStaffPerms] = useState<Record<string, boolean>>({
    calendar: true, patients: true, prescriptions: true, analytics: true, video_call: true,
  });
  const [savingClinicStaff, setSavingClinicStaff] = useState(false);
  const [clinicStaffNameError, setClinicStaffNameError] = useState("");
  const [clinicStaffPhoneError, setClinicStaffPhoneError] = useState("");
  const [removingClinicDoc, setRemovingClinicDoc] = useState<string | null>(null);
  const [removingClinicStaff, setRemovingClinicStaff] = useState<string | null>(null);
  const [leavingClinic, setLeavingClinic] = useState<string | null>(null);
  // Join existing clinic
  const [showJoinClinic, setShowJoinClinic] = useState(false);
  const [joinSearchQuery, setJoinSearchQuery] = useState("");
  const [joinSearchResults, setJoinSearchResults] = useState<ClinicSearchResult[]>([]);
  const [searchingJoinClinics, setSearchingJoinClinics] = useState(false);
  const [joiningClinic, setJoiningClinic] = useState<string | null>(null);
  const [joinAssocType, setJoinAssocType] = useState("full-time");
  const [joinDept, setJoinDept] = useState("");
  // Edit membership
  const [editingMembership, setEditingMembership] = useState<string | null>(null);
  const [editAssocType, setEditAssocType] = useState("");
  const [editDept, setEditDept] = useState("");
  const [savingMembership, setSavingMembership] = useState(false);

  // ── Fetch staff ──
  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff?doctorId=${doctorId}`);
      if (res.ok) setStaffList(await res.json());
    } catch (err) { console.error("Failed to fetch staff:", err); }
    finally { setLoading(false); }
  }, [doctorId]);

  // ── Fetch linked doctors ──
  const fetchLinkedDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    try {
      const res = await fetch(`/api/linked-doctors?primaryDoctorId=${doctorId}`);
      if (res.ok) setLinkedDoctors(await res.json());
    } catch (err) { console.error("Failed to fetch linked doctors:", err); }
    finally { setLoadingDoctors(false); }
  }, [doctorId]);

  // ── Fetch clinics ──
  const fetchClinics = useCallback(async () => {
    setLoadingClinics(true);
    try {
      const res = await fetch(`/api/clinics?doctorId=${doctorId}`);
      if (res.ok) { const data = await res.json(); setClinics(Array.isArray(data) ? data : []); }
    } catch (err) { console.error("Failed to fetch clinics:", err); }
    finally { setLoadingClinics(false); }
  }, [doctorId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);
  useEffect(() => { if (activeTab === "doctors") fetchLinkedDoctors(); }, [activeTab, fetchLinkedDoctors]);
  useEffect(() => { if (activeTab === "clinics") fetchClinics(); }, [activeTab, fetchClinics]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); } }, [success]);

  // ── Staff handlers ──
  const resetForm = () => {
    setNewName(""); setNewPhone(""); setNewRole("receptionist");
    setNewPerms({ ...DEFAULT_PERMISSIONS.receptionist });
    setNewNameError(""); setNewPhoneError(""); setError(null);
  };
  const handleRoleChange = (role: string) => { setNewRole(role); setNewPerms({ ...DEFAULT_PERMISSIONS[role] }); };
  const togglePermission = (key: string) => { setNewPerms((prev) => ({ ...prev, [key]: !prev[key as keyof StaffPermissions] })); };

  const handleAdd = async () => {
    let valid = true; setNewNameError(""); setNewPhoneError(""); setError(null);
    if (!newName.trim()) { setNewNameError("Name is required"); valid = false; }
    if (!newPhone.trim() || newPhone.trim().length < 10) { setNewPhoneError("Enter a valid phone number"); valid = false; }
    if (!valid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, name: newName.trim(), phone: newPhone.trim(), role: newRole, permissions: newPerms }), });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed"); }
      setSuccess(`${newName.trim()} added successfully`); setShowAddForm(false); resetForm(); fetchStaff();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return; setDeleting(id);
    try { const res = await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed"); setSuccess(`${name} removed`); fetchStaff();
    } catch { setError("Failed to remove"); } finally { setDeleting(null); }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try { const res = await fetch(`/api/staff?id=${member.id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }), });
      if (!res.ok) throw new Error(); fetchStaff();
    } catch { setError("Failed to update status"); }
  };

  const handleEnableLogin = async (member: StaffMember) => {
    setEnablingLogin(member.id); setLoginLink(null);
    try {
      const { db } = await import("@/lib/db");
      if (member.userId) { setLoginLink("Already has login access"); setEnablingLogin(null); return; }
      let user = await db.user.findUnique({ where: { phone: member.phone } });
      if (!user) { user = await db.user.create({ data: { phone: member.phone, name: member.name, role: "STAFF" } }); }
      else { user = await db.user.update({ where: { id: user.id }, data: { role: "STAFF", name: member.name } }); }
      await db.staffMember.update({ where: { id: member.id }, data: { userId: user.id } });
      setLoginLink("Login enabled! Staff can log in with OTP using their phone."); fetchStaff();
    } catch (err) { setError("Failed: " + (err instanceof Error ? err.message : "Unknown")); }
    finally { setEnablingLogin(null); }
  };

  const copyLoginInfo = (member: StaffMember) => {
    const perms = JSON.parse(member.permissions || "{}") as StaffPermissions;
    const accessible = Object.entries(PERMISSION_LABELS).filter(([k]) => perms[k as keyof StaffPermissions]).map(([, v]) => v.label).join(", ");
    navigator.clipboard.writeText(`Nurturee Doctor Portal - Staff Login\nPhone: ${member.phone}\nOTP: 123456 (dev mode)\nAccess: ${accessible || "None"}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // ── Linked Doctor handlers ──
  const handleSearchDoctors = async () => {
    if (!doctorSearchQuery.trim()) return; setSearchingDoctors(true);
    try {
      const isPhone = /^\d/.test(doctorSearchQuery.trim());
      const params = new URLSearchParams({ excludeDoctorId: doctorId });
      if (isPhone) params.set("phone", doctorSearchQuery.trim()); else params.set("name", doctorSearchQuery.trim());
      const res = await fetch(`/api/doctors/search?${params}`);
      if (res.ok) setDoctorSearchResults(await res.json()); else setDoctorSearchResults([]);
    } catch { setDoctorSearchResults([]); } finally { setSearchingDoctors(false); }
  };

  const handleLinkDoctor = async (targetDoctorId: string) => {
    setLinkingDoctor(targetDoctorId);
    try {
      const res = await fetch("/api/linked-doctors", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryDoctorId: doctorId, linkedDoctorId: targetDoctorId, permissions: newDocPerms }), });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed"); }
      setSuccess("Doctor linked"); setShowDoctorSearch(false); setDoctorSearchQuery(""); setDoctorSearchResults([]); fetchLinkedDoctors();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLinkingDoctor(null); }
  };

  const handleRemoveLinkedDoctor = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    try { const res = await fetch(`/api/linked-doctors?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed"); setSuccess(`${name} removed`); fetchLinkedDoctors();
    } catch { setError("Failed"); }
  };

  const handleToggleDoctorActive = async (ld: LinkedDoctor) => {
    try { const res = await fetch(`/api/linked-doctors?id=${ld.id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ld.isActive }), });
      if (!res.ok) throw new Error(); fetchLinkedDoctors();
    } catch { setError("Failed"); }
  };

  // ── Clinic handlers ──
  const resetClinicForm = () => {
    setClinicName(""); setClinicAddress(""); setClinicCity("");
    setClinicPhone(""); setClinicEmail(""); setClinicDepartment(""); setClinicType("clinic");
    setClinicNameError(""); setError(null);
  };

  const handleCreateClinic = async () => {
    let valid = true; setClinicNameError(""); setError(null);
    if (!clinicName.trim()) { setClinicNameError("Clinic name is required"); valid = false; }
    if (!valid) return;
    setSavingClinic(true);
    try {
      const res = await fetch("/api/clinics", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clinicName.trim(), address: clinicAddress.trim(), city: clinicCity.trim(),
          phone: clinicPhone.trim() || undefined, email: clinicEmail.trim() || undefined,
          department: clinicDepartment.trim(), type: clinicType, createdById: doctorId }), });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed"); }
      setSuccess(`"${clinicName.trim()}" created`); setShowCreateClinic(false); resetClinicForm(); fetchClinics();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSavingClinic(false); }
  };

  const handleSearchClinicDoctors = async () => {
    if (!clinicDocSearchQuery.trim()) return; setSearchingClinicDocs(true);
    try {
      const isPhone = /^\d/.test(clinicDocSearchQuery.trim());
      const params = new URLSearchParams({ excludeDoctorId: doctorId });
      if (isPhone) params.set("phone", clinicDocSearchQuery.trim()); else params.set("name", clinicDocSearchQuery.trim());
      const res = await fetch(`/api/doctors/search?${params}`);
      if (res.ok) setClinicDocSearchResults(await res.json()); else setClinicDocSearchResults([]);
    } catch { setClinicDocSearchResults([]); } finally { setSearchingClinicDocs(false); }
  };

  const handleAddDoctorToClinic = async (targetDoctorId: string) => {
    if (!expandedClinicId) return; setAddingDocToClinic(targetDoctorId);
    try {
      const res = await fetch("/api/clinics/doctors", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId: expandedClinicId, doctorIds: [targetDoctorId], action: "add",
          department: newClinicDocDept, associationType: newClinicDocAssoc }), });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed"); }
      setSuccess("Doctor added to clinic"); setClinicDocSearchQuery(""); setClinicDocSearchResults([]);
      setNewClinicDocDept(""); fetchClinics();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setAddingDocToClinic(null); }
  };

  const handleRemoveDoctorFromClinic = async (clinicId: string, docId: string, docName: string) => {
    if (!confirm(`Remove Dr. ${docName} from this clinic?`)) return; setRemovingClinicDoc(docId);
    try {
      const res = await fetch("/api/clinics/doctors", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, doctorIds: [docId], action: "remove" }), });
      if (!res.ok) throw new Error("Failed"); setSuccess(`Dr. ${docName} removed`); fetchClinics();
    } catch { setError("Failed"); } finally { setRemovingClinicDoc(null); }
  };

  const handleLeaveClinic = async (clinicId: string, clinicNameStr: string) => {
    if (!confirm(`Leave "${clinicNameStr}"?`)) return; setLeavingClinic(clinicId);
    try {
      const res = await fetch("/api/clinics/doctors", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, doctorIds: [doctorId], action: "remove" }), });
      if (!res.ok) throw new Error("Failed"); setSuccess(`Left "${clinicNameStr}"`); setExpandedClinicId(null); fetchClinics();
    } catch { setError("Failed"); } finally { setLeavingClinic(null); }
  };

  const resetClinicStaffForm = () => {
    setClinicStaffName(""); setClinicStaffPhone(""); setClinicStaffRole("manager"); setClinicStaffAssoc("full-time");
    setClinicStaffPerms({ calendar: true, patients: true, prescriptions: true, analytics: true, video_call: true });
    setClinicStaffNameError(""); setClinicStaffPhoneError("");
  };

  const handleAddClinicStaff = async () => {
    if (!expandedClinicId) return;
    let valid = true; setClinicStaffNameError(""); setClinicStaffPhoneError(""); setError(null);
    if (!clinicStaffName.trim()) { setClinicStaffNameError("Name is required"); valid = false; }
    if (!clinicStaffPhone.trim() || clinicStaffPhone.trim().length < 10) { setClinicStaffPhoneError("Enter a valid phone"); valid = false; }
    if (!valid) return;
    setSavingClinicStaff(true);
    try {
      const res = await fetch("/api/clinics/staff", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId: expandedClinicId, name: clinicStaffName.trim(),
          phone: clinicStaffPhone.trim(), role: clinicStaffRole, associationType: clinicStaffAssoc,
          permissions: clinicStaffPerms }), });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed"); }
      setSuccess(`${clinicStaffName.trim()} added`); setShowClinicStaffForm(false); resetClinicStaffForm(); fetchClinics();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSavingClinicStaff(false); }
  };

  const handleRemoveClinicStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Remove ${staffName}?`)) return; setRemovingClinicStaff(staffId);
    try { const res = await fetch(`/api/staff?id=${staffId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed"); setSuccess(`${staffName} removed`); fetchClinics();
    } catch { setError("Failed"); } finally { setRemovingClinicStaff(null); }
  };

  // ── Join existing clinic ──
  const handleSearchJoinClinics = async () => {
    if (!joinSearchQuery.trim()) return; setSearchingJoinClinics(true);
    try {
      const res = await fetch(`/api/clinics/search?q=${encodeURIComponent(joinSearchQuery.trim())}&excludeDoctorId=${doctorId}`);
      if (res.ok) setJoinSearchResults(await res.json()); else setJoinSearchResults([]);
    } catch { setJoinSearchResults([]); } finally { setSearchingJoinClinics(false); }
  };

  const handleJoinClinic = async (clinicIdStr: string) => {
    setJoiningClinic(clinicIdStr);
    try {
      const res = await fetch("/api/clinics/join", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId: clinicIdStr, doctorId, department: joinDept, associationType: joinAssocType }), });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed"); }
      setSuccess("Joined clinic successfully"); setShowJoinClinic(false); setJoinSearchQuery(""); setJoinSearchResults([]);
      setJoinDept(""); fetchClinics();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to join"); }
    finally { setJoiningClinic(null); }
  };

  // ── Edit membership ──
  const handleSaveMembership = async (membershipId: string) => {
    setSavingMembership(true);
    try {
      const res = await fetch("/api/clinics/doctors", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, department: editDept, associationType: editAssocType, action: "update" }), });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Membership updated"); setEditingMembership(null); fetchClinics();
    } catch { setError("Failed to update"); }
    finally { setSavingMembership(false); }
  };

  // ── Helpers ──
  const parsePermissions = (permStr: string): StaffPermissions => {
    try { return { ...DEFAULT_PERMISSIONS.receptionist, ...JSON.parse(permStr) }; } catch { return { ...DEFAULT_PERMISSIONS.receptionist }; }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "manager": return "bg-blue-100 text-blue-700 border-blue-200";
      case "assistant": return "bg-violet-100 text-violet-700 border-violet-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getAssocBadge = (t: string) => ASSOCIATION_TYPES.find(a => a.value === t)?.color || "bg-slate-100 text-slate-600 border-slate-200";

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-60 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  // ── Render association type badge ──
  const AssocBadge = ({ type }: { type: string }) => {
    const info = ASSOCIATION_TYPES.find(a => a.value === type);
    if (!info) return null;
    return <Badge className={cn("text-[10px]", info.color)}>{info.label}</Badge>;
  };

  // ── Render doctor avatar ──
  const DocAvatar = ({ name, avatar, size = "sm" }: { name: string; avatar?: string | null; size?: "sm" | "md" }) => {
    const sz = size === "sm" ? "size-8" : "size-9";
    return (
      <div className={cn("flex items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-violet-600 shrink-0 overflow-hidden", sz)}>
        {avatar ? <img src={avatar} alt={name} className={cn("rounded-full object-cover", sz)} /> :
          name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
      </div>
    );
  };

  // ── Render association type selector ──
  const AssocSelector = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) => (
    <div className="space-y-1">
      {label && <Label className="text-xs font-medium">{label}</Label>}
      <div className="flex flex-wrap gap-1.5">
        {ASSOCIATION_TYPES.map((at) => (
          <button key={at.value} type="button" onClick={() => onChange(at.value)}
            className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
              value === at.value ? cn(at.color, "ring-1 ring-offset-1") : "border-border text-muted-foreground hover:border-gray-300")}>
            {at.label}
          </button>
        ))}
      </div>
    </div>
  );

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Staff Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage sub-users, linked doctors, and clinic memberships</p>
        </div>
        <div className="flex items-center gap-2">
          {success && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1"><Check className="h-3 w-3" /> {success}</Badge>}
          {error && <Badge className="bg-red-100 text-red-700 border-red-200">{error}</Badge>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(["staff", "doctors", "clinics"] as TabType[]).map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={cn("flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab ? "bg-white text-blue-700 shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {tab === "staff" && <Users className="h-4 w-4" />}
            {tab === "doctors" && <Stethoscope className="h-4 w-4" />}
            {tab === "clinics" && <Building2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */
      {/* STAFF TAB                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "staff" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => { resetForm(); setShowAddForm(true); }} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add Staff
            </Button>
          </div>

          {/* Add Staff Form */}
          {showAddForm && (
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Add Staff Member</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => { setShowAddForm(false); resetForm(); }}><X className="h-4 w-4" /></Button>
                </div>
                <CardDescription>This staff will only see your (Dr. {doctorName || "you"}) data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Name <span className="text-red-500">*</span></Label>
                    <Input placeholder="Full name" value={newName} onChange={(e) => { setNewName(e.target.value); setNewNameError(""); }} />
                    {newNameError && <p className="text-[11px] text-red-500 mt-0.5">{newNameError}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Phone <span className="text-red-500">*</span></Label>
                    <Input placeholder="10-digit phone" value={newPhone} onChange={(e) => { setNewPhone(e.target.value); setNewPhoneError(""); }} maxLength={10} />
                    {newPhoneError && <p className="text-[11px] text-red-500 mt-0.5">{newPhoneError}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Role</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {ROLE_OPTIONS.map((r) => (
                      <button key={r.value} type="button" onClick={() => handleRoleChange(r.value)}
                        className={cn("flex flex-col items-start rounded-lg border p-2.5 text-left transition-all",
                          newRole === r.value ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-border hover:border-blue-300")}>
                        <span className={cn("text-xs font-medium", newRole === r.value ? "text-blue-700" : "text-foreground")}>{r.label}</span>
                        <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Permissions</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {Object.entries(PERMISSION_LABELS).map(([key, { label, desc }]) => {
                      const isOn = newPerms[key as keyof StaffPermissions] || false;
                      return (
                        <button key={key} type="button" onClick={() => togglePermission(key)}
                          className={cn("flex items-start gap-2 rounded-lg border p-2 text-left transition-all",
                            isOn ? "border-blue-400 bg-blue-50/80" : "border-border hover:border-blue-200")}>
                          <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                            isOn ? "border-blue-600 bg-blue-600" : "border-slate-300")}>
                            {isOn && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <div className="min-w-0"><p className={cn("text-xs font-medium", isOn ? "text-blue-700" : "text-foreground")}>{label}</p><p className="text-[10px] text-muted-foreground">{desc}</p></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); resetForm(); }}>Cancel</Button>
                  <Button size="sm" onClick={handleAdd} disabled={saving} className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}{saving ? "Adding..." : "Add Staff"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff List */}
          {staffList.length === 0 && !showAddForm ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">No staff members yet</p>
              <p className="text-xs text-slate-400">Add staff who can manage bookings, patients, and more</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staffList.map((member) => {
                const isExpanded = expandedId === member.id;
                const perms = parsePermissions(member.permissions);
                const activeCount = Object.values(perms).filter(Boolean).length;
                return (
                  <Card key={member.id} className={cn("transition-all", !member.isActive && "opacity-60")}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 shrink-0">
                        {member.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-sm font-semibold text-foreground">{member.name}</h3>
                          <Badge variant="outline" className={cn("text-[10px]", getRoleBadgeColor(member.role))}>{member.role}</Badge>
                          {member.userId ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] gap-0.5"><KeyRound className="h-2 w-2" /> Login</Badge> :
                            <Badge variant="outline" className="text-[10px] text-slate-400">No Login</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">+91 {member.phone} · {activeCount} section{activeCount !== 1 ? "s" : ""} accessible</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" className={cn("gap-1 text-xs", isExpanded ? "text-blue-600" : "text-muted-foreground")}
                          onClick={() => setExpandedId(isExpanded ? null : member.id)}>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} Details
                        </Button>
                        <Button variant="ghost" size="sm" className={cn("gap-1 text-xs", member.isActive ? "text-amber-600" : "text-emerald-600")}
                          onClick={() => handleToggleActive(member)}>
                          {member.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {member.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={deleting === member.id} onClick={() => handleDelete(member.id, member.name)}>
                          {deleting === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t px-4 py-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(PERMISSION_LABELS).map(([key, { label }]) => (
                            <div key={key} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-xs",
                              perms[key as keyof StaffPermissions] ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-400")}>
                              {perms[key as keyof StaffPermissions] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{label}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={enablingLogin === member.id}
                            onClick={() => handleEnableLogin(member)}>
                            {enablingLogin === member.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
                            {member.userId ? "Login Enabled" : "Enable Login"}
                          </Button>
                          {member.userId && (
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => copyLoginInfo(member)}>
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? "Copied!" : "Copy Login Info"}
                            </Button>
                          )}
                        </div>
                        {loginLink && <p className="text-xs text-emerald-600 bg-emerald-50 rounded-md px-3 py-2">{loginLink}</p>}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */
      {/* DOCTORS TAB                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "doctors" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => { setDoctorSearchQuery(""); setDoctorSearchResults([]); setShowDoctorSearch(true); }} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add Doctor
            </Button>
          </div>

          {showDoctorSearch && (
            <Card className="border-2 border-indigo-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-lg">Add a Doctor</CardTitle><CardDescription>Search by phone or name to link a doctor</CardDescription></div>
                  <Button variant="ghost" size="icon" onClick={() => { setShowDoctorSearch(false); setDoctorSearchResults([]); setShowDocPermForm(false); }}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Enter doctor phone or name..." value={doctorSearchQuery} onChange={(e) => setDoctorSearchQuery(e.target.value)}
                      className="pl-10" onKeyDown={(e) => e.key === "Enter" && handleSearchDoctors()} />
                  </div>
                  <Button onClick={handleSearchDoctors} disabled={searchingDoctors || !doctorSearchQuery.trim()} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                    {searchingDoctors ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
                  </Button>
                </div>
                {doctorSearchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {doctorSearchResults.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3 hover:border-indigo-300">
                        <DocAvatar name={doc.user.name} avatar={doc.user.avatar} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">Dr. {doc.user.name}</p>
                          <p className="text-[11px] text-muted-foreground">{doc.specialization} · {doc.degree} · {doc.experienceYears}y exp</p>
                        </div>
                        <Button size="sm" className="gap-1 h-8 text-xs bg-blue-600 text-white hover:bg-blue-700" disabled={linkingDoctor === doc.id}
                          onClick={() => { setPendingLinkId(doc.id); setShowDocPermForm(true); }}>
                          {linkingDoctor === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {showDocPermForm && pendingLinkId && (
                  <Card className="border-indigo-200">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-medium text-indigo-700">Set Permissions for Linked Doctor</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {Object.entries(DOCTOR_PERMISSION_LABELS).map(([key, { label, desc }]) => {
                          const isOn = newDocPerms[key] || false;
                          return (
                            <button key={key} type="button" onClick={() => setNewDocPerms(prev => ({ ...prev, [key]: !prev[key] }))}
                              className={cn("flex items-start gap-2 rounded-lg border p-2 text-left transition-all",
                                isOn ? "border-indigo-400 bg-indigo-50" : "border-border")}>
                              <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2",
                                isOn ? "border-indigo-600 bg-indigo-600" : "border-slate-300")}>
                                {isOn && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <div><p className="text-xs font-medium">{label}</p><p className="text-[10px] text-muted-foreground">{desc}</p></div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowDocPermForm(false)}>Cancel</Button>
                        <Button size="sm" className="h-8 text-xs bg-indigo-600 text-white hover:bg-indigo-700" disabled={linkingDoctor === pendingLinkId}
                          onClick={() => handleLinkDoctor(pendingLinkId)}>
                          {linkingDoctor === pendingLinkId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Confirm
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}

          {loadingDoctors ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : linkedDoctors.length === 0 && !showDoctorSearch ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
              <Stethoscope className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">No linked doctors yet</p><p className="text-xs text-slate-400">Add other doctors to share portal access</p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedDoctors.map((ld) => {
                const isExpanded = expandedDoctorId === ld.id;
                const perms = JSON.parse(ld.permissions || "{}");
                return (
                  <Card key={ld.id} className={cn("transition-all", !ld.isActive && "opacity-60")}>
                    <div className="flex items-center gap-4 p-4">
                      <DocAvatar name={ld.linkedDoctor.user.name} avatar={ld.linkedDoctor.user.avatar} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-sm font-semibold">Dr. {ld.linkedDoctor.user.name}</h3>
                          {!ld.isActive && <Badge variant="outline" className="text-[10px] text-slate-400">Disabled</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{ld.linkedDoctor.specialization} · {ld.linkedDoctor.degree}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" className={cn("gap-1 text-xs", isExpanded ? "text-blue-600" : "text-muted-foreground")}
                          onClick={() => setExpandedDoctorId(isExpanded ? null : ld.id)}>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className={cn("gap-1 text-xs", ld.isActive ? "text-amber-600" : "text-emerald-600")}
                          onClick={() => handleToggleDoctorActive(ld)}>
                          {ld.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveLinkedDoctor(ld.id, ld.linkedDoctor.user.name)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t px-4 py-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Permissions</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {Object.entries(DOCTOR_PERMISSION_LABELS).map(([key, { label }]) => (
                            <div key={key} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-xs",
                              perms[key] ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-400")}>
                              {perms[key] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{label}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-3">Linked {new Date(ld.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */
      {/* CLINICS TAB                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "clinics" && (
        <>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setJoinSearchQuery(""); setJoinSearchResults([]); setShowJoinClinic(true); }}
              className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50">
              <UserPlus className="h-4 w-4" /> Join Clinic
            </Button>
            <Button onClick={() => { resetClinicForm(); setShowCreateClinic(true); }} className="gap-2 bg-violet-600 text-white hover:bg-violet-700">
              <Plus className="h-4 w-4" /> Create Clinic
            </Button>
          </div>

          {/* ── Join Existing Clinic Dialog ── */}
          {showJoinClinic && (
            <Card className="border-2 border-violet-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-lg">Join an Existing Clinic</CardTitle><CardDescription>Search for clinics by name to join as a member</CardDescription></div>
                  <Button variant="ghost" size="icon" onClick={() => { setShowJoinClinic(false); setJoinSearchResults([]); }}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search clinic name..." value={joinSearchQuery} onChange={(e) => setJoinSearchQuery(e.target.value)}
                      className="pl-10" onKeyDown={(e) => e.key === "Enter" && handleSearchJoinClinics()} />
                  </div>
                  <Button onClick={handleSearchJoinClinics} disabled={searchingJoinClinics || !joinSearchQuery.trim()} className="gap-2 bg-violet-600 text-white hover:bg-violet-700">
                    {searchingJoinClinics ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
                  </Button>
                </div>
                <AssocSelector value={joinAssocType} onChange={setJoinAssocType} label="Your association type" />
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Department (for hospitals)</Label>
                  <Input placeholder="e.g. Cardiology, Orthopedics" value={joinDept} onChange={(e) => setJoinDept(e.target.value)} />
                </div>
                {joinSearchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {joinSearchResults.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3 hover:border-violet-300">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 shrink-0"><Building2 className="h-5 w-5" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">{c.city} · {c.type} · {c._count.doctorMemberships} doctors</p>
                        </div>
                        <Button size="sm" className="gap-1 h-8 text-xs bg-violet-600 text-white hover:bg-violet-700" disabled={joiningClinic === c.id}
                          onClick={() => handleJoinClinic(c.id)}>
                          {joiningClinic === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />} Join
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Create Clinic Form ── */}
          {showCreateClinic && (
            <Card className="border-2 border-violet-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Create New Clinic</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => { setShowCreateClinic(false); resetClinicForm(); }}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Clinic Name <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g. City Health Clinic" value={clinicName} onChange={(e) => { setClinicName(e.target.value); setClinicNameError(""); }} />
                    {clinicNameError && <p className="text-[11px] text-red-500 mt-0.5">{clinicNameError}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">City</Label>
                    <Input placeholder="e.g. Mumbai" value={clinicCity} onChange={(e) => setClinicCity(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Address</Label>
                  <Input placeholder="Full address" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Phone</Label>
                    <Input placeholder="Clinic phone" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Email</Label>
                    <Input placeholder="clinic@email.com" value={clinicEmail} onChange={(e) => setClinicEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Department</Label>
                    <Input placeholder="e.g. Cardiology" value={clinicDepartment} onChange={(e) => setClinicDepartment(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Clinic Type</Label>
                  <div className="flex gap-2">
                    {CLINIC_TYPES.map((ct) => (
                      <button key={ct.value} type="button" onClick={() => setClinicType(ct.value)}
                        className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                          clinicType === ct.value ? "border-violet-500 bg-violet-50 text-violet-700 ring-1 ring-violet-500" : "border-border hover:border-violet-300")}>
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowCreateClinic(false); resetClinicForm(); }}>Cancel</Button>
                  <Button size="sm" onClick={handleCreateClinic} disabled={savingClinic} className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
                    {savingClinic ? <Loader2 className="h-3 w-3 animate-spin" /> : <Building2 className="h-3 w-3" />}{savingClinic ? "Creating..." : "Create Clinic"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Clinics List ── */}
          {loadingClinics ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
          ) : clinics.length === 0 && !showCreateClinic && !showJoinClinic ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">No clinics yet</p>
              <p className="text-xs text-slate-400">Create a clinic or join an existing one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clinics.map((clinic) => {
                const isExpanded = expandedClinicId === clinic.id;
                const isPrimary = clinic._membership?.id !== "legacy";
                return (
                  <Card key={clinic.id} className={cn("transition-all", !clinic.isActive && "opacity-60")}>
                    <div className="flex items-center gap-4 p-4">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                        clinic.type === "hospital" ? "bg-red-50 text-red-600" : "bg-violet-50 text-violet-600")}>
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold">{clinic.name}</h3>
                          <Badge variant="outline" className="text-[10px] capitalize">{clinic.type}</Badge>
                          {isPrimary && <AssocBadge type={clinic._membership?.associationType || "full-time"} />}
                          {!clinic.isActive && <Badge variant="outline" className="text-[10px] text-slate-400">Inactive</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {clinic.city && <span className="mr-2 flex items-center gap-0.5 inline-flex"><MapPin className="h-3 w-3" />{clinic.city}</span>}
                          {clinic.department && <span className="mr-2">{clinic.department}</span>}
                          {clinic.doctors?.length || 0} doctor{(clinic.doctors?.length || 0) !== 1 ? "s" : ""} · {clinic.staffMembers?.length || 0} staff
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" className={cn("gap-1 text-xs", isExpanded ? "text-violet-600" : "text-muted-foreground")}
                          onClick={() => { setExpandedClinicId(isExpanded ? null : clinic.id); setClinicDocSearchQuery(""); setClinicDocSearchResults([]); setShowClinicStaffForm(false); }}>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} Details
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          disabled={leavingClinic === clinic.id} onClick={() => handleLeaveClinic(clinic.id, clinic.name)}>
                          {leavingClinic === clinic.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                          {leavingClinic === clinic.id ? "Leaving..." : "Leave"}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t px-4 py-4 space-y-5">
                        {/* Clinic Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {clinic.address && <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><div><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Address</p><p className="text-sm">{clinic.address}</p></div></div>}
                          {clinic.phone && <div className="flex items-start gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><div><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Phone</p><p className="text-sm">+91 {clinic.phone}</p></div></div>}
                          {clinic.email && <div className="flex items-start gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><div><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Email</p><p className="text-sm">{clinic.email}</p></div></div>}
                          {clinic._membership?.department && <div className="flex items-start gap-2"><Briefcase className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><div><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Your Dept</p><p className="text-sm">{clinic._membership.department}</p></div></div>}
                        </div>

                        <Separator />

                        {/* ── Doctors in Clinic ── */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doctors ({clinic.doctors?.length || 0})</p>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-violet-600 border-violet-200 hover:bg-violet-50">
                              <Plus className="h-3 w-3" /> Add Doctor
                            </Button>
                          </div>

                          {/* Doctor search inside clinic */}
                          <div className="mb-3">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search by phone or name..." value={clinicDocSearchQuery} onChange={(e) => setClinicDocSearchQuery(e.target.value)}
                                  className="pl-10" onKeyDown={(e) => e.key === "Enter" && handleSearchClinicDoctors()} />
                              </div>
                              <Button onClick={handleSearchClinicDoctors} disabled={searchingClinicDocs || !clinicDocSearchQuery.trim()} size="sm" className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
                                {searchingClinicDocs ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />} Search
                              </Button>
                            </div>

                            {/* Association type & dept selectors for new doctor */}
                            {(clinicDocSearchResults.length > 0) && (
                              <div className="mt-2 flex flex-wrap gap-3 items-end">
                                <div className="flex-1 min-w-[150px]">
                                  <AssocSelector value={newClinicDocAssoc} onChange={setNewClinicDocAssoc} />
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium">Department</Label>
                                    <Input placeholder="e.g. Cardiology" value={newClinicDocDept} onChange={(e) => setNewClinicDocDept(e.target.value)} className="h-9" />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Search results */}
                            {clinicDocSearchResults.length > 0 && (
                              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                {clinicDocSearchResults.map((doc) => {
                                  const alreadyIn = clinic.doctors?.some(d => d.id === doc.id);
                                  return (
                                    <div key={doc.id} className={cn("flex items-center gap-3 rounded-lg border p-2.5 transition-all", alreadyIn ? "bg-slate-50 opacity-60" : "hover:border-violet-300")}>
                                      <DocAvatar name={doc.user.name} avatar={doc.user.avatar} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">Dr. {doc.user.name}</p>
                                        <p className="text-[11px] text-muted-foreground">{doc.specialization} · {doc.degree}</p>
                                      </div>
                                      {alreadyIn ? <Badge className="bg-slate-100 text-slate-500 text-[10px]">In Clinic</Badge> : (
                                        <Button size="sm" className="gap-1 h-7 text-xs bg-violet-600 text-white hover:bg-violet-700" disabled={addingDocToClinic === doc.id}
                                          onClick={() => handleAddDoctorToClinic(doc.id)}>
                                          {addingDocToClinic === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Clinic doctors list */}
                          {(clinic.doctors?.length || 0) === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">No doctors yet. Search above to add.</p>
                          ) : (
                            <div className="space-y-2">
                              {clinic.doctors.map((doc) => {
                                const isSelf = doc.id === doctorId;
                                return (
                                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
                                    <DocAvatar name={doc.user.name} avatar={doc.user.avatar} size="md" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium truncate">Dr. {doc.user.name}</p>
                                        {isSelf && <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px]">You</Badge>}
                                        <AssocBadge type={doc.associationType} />
                                      </div>
                                      <p className="text-[11px] text-muted-foreground">
                                        {doc.specialization} · {doc.degree}{doc.department ? ` · ${doc.department}` : ""}
                                      </p>
                                    </div>
                                    {!isSelf && (
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-violet-500 hover:bg-violet-50"
                                          onClick={() => { setEditingMembership(doc.id); setEditAssocType(doc.associationType); setEditDept(doc.department || ""); }}>
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" disabled={removingClinicDoc === doc.id}
                                          onClick={() => handleRemoveDoctorFromClinic(clinic.id, doc.id, doc.user.name)}>
                                          {removingClinicDoc === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* ── Edit Membership Inline ── */}
                        {editingMembership && (
                          <Card className="border-violet-200">
                            <CardContent className="p-3 flex flex-wrap gap-3 items-end">
                              <AssocSelector value={editAssocType} onChange={setEditAssocType} />
                              <div className="flex-1 min-w-[150px]">
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">Department</Label>
                                  <Input value={editDept} onChange={(e) => setEditDept(e.target.value)} className="h-9" />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditingMembership(null)}>Cancel</Button>
                                <Button size="sm" className="h-8 text-xs bg-violet-600 text-white hover:bg-violet-700" disabled={savingMembership}
                                  onClick={() => handleSaveMembership(editingMembership)}>
                                  {savingMembership ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Separator />

                        {/* ── Clinic Staff ── */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clinic Staff ({clinic.staffMembers?.length || 0})</p>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-violet-600 border-violet-200 hover:bg-violet-50"
                              onClick={() => { resetClinicStaffForm(); setShowClinicStaffForm(true); }}>
                              <Plus className="h-3 w-3" /> Add Staff
                            </Button>
                          </div>

                          {showClinicStaffForm && (
                            <Card className="border border-violet-200 mb-3">
                              <CardContent className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-violet-700">Add Clinic Staff</p>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowClinicStaffForm(false); resetClinicStaffForm(); }}><X className="h-3.5 w-3.5" /></Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium">Name <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Staff name" value={clinicStaffName} onChange={(e) => { setClinicStaffName(e.target.value); setClinicStaffNameError(""); }} className="h-9" />
                                    {clinicStaffNameError && <p className="text-[11px] text-red-500 mt-0.5">{clinicStaffNameError}</p>}
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium">Phone <span className="text-red-500">*</span></Label>
                                    <Input placeholder="10-digit phone" value={clinicStaffPhone} onChange={(e) => { setClinicStaffPhone(e.target.value); setClinicStaffPhoneError(""); }} className="h-9" maxLength={10} />
                                    {clinicStaffPhoneError && <p className="text-[11px] text-red-500 mt-0.5">{clinicStaffPhoneError}</p>}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">Role</Label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {ROLE_OPTIONS.map((r) => (
                                      <button key={r.value} type="button" onClick={() => setClinicStaffRole(r.value)}
                                        className={cn("flex flex-col items-start rounded-lg border p-2 text-left transition-all",
                                          clinicStaffRole === r.value ? "border-violet-500 bg-violet-50 ring-1 ring-violet-500" : "border-border hover:border-violet-300")}>
                                        <span className={cn("text-xs font-medium", clinicStaffRole === r.value ? "text-violet-700" : "")}>{r.label}</span>
                                        <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <AssocSelector value={clinicStaffAssoc} onChange={setClinicStaffAssoc} label="Association Type" />
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium">Permissions</Label>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    {Object.entries(DOCTOR_PERMISSION_LABELS).map(([key, { label, desc }]) => {
                                      const isOn = clinicStaffPerms[key] || false;
                                      return (
                                        <button key={key} type="button" onClick={() => setClinicStaffPerms(prev => ({ ...prev, [key]: !prev[key] }))}
                                          className={cn("flex items-start gap-2 rounded-lg border p-2 text-left transition-all",
                                            isOn ? "border-violet-400 bg-violet-50/80" : "border-border")}>
                                          <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2",
                                            isOn ? "border-violet-600 bg-violet-600" : "border-slate-300")}>
                                            {isOn && <Check className="h-2.5 w-2.5 text-white" />}
                                          </div>
                                          <div><p className={cn("text-xs font-medium", isOn ? "text-violet-700" : "")}>{label}</p><p className="text-[10px] text-muted-foreground">{desc}</p></div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setShowClinicStaffForm(false); resetClinicStaffForm(); }}>Cancel</Button>
                                  <Button size="sm" onClick={handleAddClinicStaff} disabled={savingClinicStaff} className="gap-1.5 h-8 text-xs bg-violet-600 text-white hover:bg-violet-700">
                                    {savingClinicStaff ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}{savingClinicStaff ? "Adding..." : "Add Staff"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {(clinic.staffMembers?.length || 0) === 0 && !showClinicStaffForm ? (
                            <p className="text-xs text-muted-foreground text-center py-4">No clinic staff yet. Add managers or receptionists.</p>
                          ) : (
                            <div className="space-y-2">
                              {clinic.staffMembers.map((sm) => {
                                const perms = JSON.parse(sm.permissions || "{}") as Record<string, boolean>;
                                const activeCount = Object.values(perms).filter(Boolean).length;
                                return (
                                  <div key={sm.id} className={cn("flex items-center gap-3 rounded-lg border p-3 transition-all", !sm.isActive && "opacity-60")}>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600 shrink-0">
                                      {sm.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium truncate">{sm.name}</p>
                                        <Badge variant="outline" className={cn("text-[10px]", getRoleBadgeColor(sm.role))}>{sm.role}</Badge>
                                        <AssocBadge type={sm.associationType} />
                                      </div>
                                      <p className="text-[11px] text-muted-foreground">+91 {sm.phone} · {activeCount} sections</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" disabled={removingClinicStaff === sm.id}
                                      onClick={() => handleRemoveClinicStaff(sm.id, sm.name)}>
                                      {removingClinicStaff === sm.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                          Created {new Date(clinic.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {clinic._membership?.joinedAt && ` · Joined ${new Date(clinic._membership.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
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
