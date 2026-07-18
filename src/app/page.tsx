"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { DoctorLogin } from "@/components/doctor/DoctorLogin";
import { DoctorProfileSetup } from "@/components/doctor/DoctorProfileSetup";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
import { DashboardView } from "@/components/doctor/DashboardView";
import { CalendarView } from "@/components/doctor/CalendarView";
import { PatientsView } from "@/components/doctor/PatientsView";
import { PrescriptionWriter } from "@/components/doctor/PrescriptionWriter";
import { AnalyticsView } from "@/components/doctor/AnalyticsView";
import { VideoCallDoctorView } from "@/components/doctor/VideoCallDoctorView";
import { DoctorProfileView } from "@/components/doctor/DoctorProfileView";
import StaffManagementView from "@/components/doctor/StaffManagementView";
import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "framer-motion";

interface StaffPermissions {
  dashboard?: boolean;
  calendar?: boolean;
  patients?: boolean;
  prescriptions?: boolean;
  analytics?: boolean;
  video_call?: boolean;
  profile?: boolean;
  staff?: boolean;
}

function DoctorPortal() {
  const { data: session, status } = useSession();
  const [activeView, setActiveView] = useState("dashboard");
  const [doctorId, setDoctorId] = useState<string>("");
  const [doctorName, setDoctorName] = useState("Doctor");
  const [doctorSpecialization, setDoctorSpecialization] = useState("");
  const [doctorDegree, setDoctorDegree] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [doctorAvatar, setDoctorAvatar] = useState<string>("");
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [existingProfile, setExistingProfile] = useState<Record<string, unknown> | null>(null);
  const [prescriptionBookingId, setPrescriptionBookingId] = useState<string | undefined>();
  const [prescriptionPatientName, setPrescriptionPatientName] = useState<string | undefined>();
  const [notificationCount, setNotificationCount] = useState(3);

  // Staff session state
  const [isStaff, setIsStaff] = useState(false);
  const [staffPermissions, setStaffPermissions] = useState<Record<string, boolean> | null>(null);

  // Detect if user is a STAFF role and fetch their permissions
  useEffect(() => {
    if (!session?.user) return;
    const user = session.user as Record<string, unknown>;
    const userId = user.id as string;
    const role = user.role as string;
    if (role !== "STAFF") return;

    setIsStaff(true);
    let cancelled = false;
    fetch(`/api/staff?userId=${userId}`)
      .then((r) => r.json())
      .then((staff) => {
        if (cancelled) return;
        if (staff.error) { signOut({ redirect: false }); return; }

        // Set doctor context from staff's doctor
        setDoctorId(staff.doctorId || "");
        if (staff.doctor?.user) {
          setDoctorName(staff.doctor.user.name || "Doctor");
          setDoctorAvatar(staff.doctor.user.avatar || "");
        }
        if (staff.doctor) {
          setDoctorSpecialization(staff.doctor.specialization || "");
          setDoctorDegree(staff.doctor.degree || "");
        }

        // Parse permissions
        try {
          const perms: StaffPermissions = JSON.parse(staff.permissions || "{}");
          setStaffPermissions(perms as Record<string, boolean>);

          // Navigate to first allowed section
          const allowed = Object.entries(perms).filter(([, v]) => v);
          if (allowed.length > 0) {
            setActiveView(allowed[0][0]);
          }
        } catch {
          setStaffPermissions({});
        }

        setProfileComplete(true);
        setExistingProfile(staff.doctor);
      })
      .catch(() => {
        // If staff fetch fails, sign out
        signOut({ redirect: false });
      });
    return () => { cancelled = true; };
  }, [session]);

  // Fetch doctor profile after login (DOCTOR role only)
  useEffect(() => {
    if (!session?.user) return;
    const user = session.user as Record<string, unknown>;
    const userId = user.id as string;
    const role = user.role as string;
    if (role === "STAFF") return; // Staff profile loaded above
    if (!userId) return;
    let cancelled = false;
    fetch(`/api/doctors?userId=${userId}`)
      .then((r) => r.json())
      .then((doc) => {
        if (cancelled) return;
        if (doc.user) {
          setDoctorName(doc.user.name || "Doctor");
          setDoctorPhone(doc.user.phone || "");
          setDoctorAvatar(doc.user.avatar || "");
        }
        setDoctorId(doc.id || userId);
        setDoctorSpecialization(doc.specialization || "");
        setDoctorDegree(doc.degree || "");
        setDoctorRegNo(doc.registrationNo || "");
        setProfileComplete(doc.profileComplete === true);
        setExistingProfile(doc);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [session]);

  // Listen for navigation events from video call
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.view) {
        setActiveView(ce.detail.view);
        if (ce.detail.bookingId) setPrescriptionBookingId(ce.detail.bookingId);
        if (ce.detail.patientName) setPrescriptionPatientName(ce.detail.patientName);
      }
    };
    window.addEventListener("doctor-navigate", handler);
    return () => window.removeEventListener("doctor-navigate", handler);
  }, []);

  const handleLoginSuccess = useCallback((userId: string) => {
    setDoctorId(userId);
  }, []);

  const refetchProfile = useCallback(() => {
    const user = session?.user as Record<string, unknown> | undefined;
    const userId = user?.id as string;
    if (!userId) return;
    fetch(`/api/doctors?userId=${userId}`)
      .then((r) => r.json())
      .then((doc) => {
        if (doc.user) {
          setDoctorName(doc.user.name || "Doctor");
          setDoctorPhone(doc.user.phone || "");
          setDoctorAvatar(doc.user.avatar || "");
        }
        setDoctorId(doc.id || userId);
        setDoctorSpecialization(doc.specialization || "");
        setDoctorDegree(doc.degree || "");
        setDoctorRegNo(doc.registrationNo || "");
        setProfileComplete(true);
        setExistingProfile(doc);
      })
      .catch(console.error);
  }, [session]);

  const handleProfileComplete = useCallback(() => {
    refetchProfile();
  }, [refetchProfile]);

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    setDoctorId("");
    setActiveView("dashboard");
    setProfileComplete(null);
    setExistingProfile(null);
    setIsStaff(false);
    setStaffPermissions(null);
  }, []);

  const handleViewPrescriptions = useCallback((bookingId: string, patientName: string) => {
    setPrescriptionBookingId(bookingId);
    setPrescriptionPatientName(patientName);
    setActiveView("prescriptions");
  }, []);

  const handlePrescriptionClose = useCallback(() => {
    setPrescriptionBookingId(undefined);
    setPrescriptionPatientName(undefined);
    setActiveView("dashboard");
  }, []);

  // Show login if not authenticated
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return <DoctorLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // ─── Profile Setup Gate (DOCTOR only) ─────────────────────────────
  if (!isStaff && profileComplete === false) {
    const userId = (session.user as Record<string, unknown>).id as string;
    const phone = (session.user as Record<string, unknown>).phone
      ? ((session.user as Record<string, unknown>).phone as string).replace("+91", "")
      : doctorPhone;
    return (
      <DoctorProfileSetup
        userId={userId}
        phone={phone || ""}
        existingProfile={existingProfile || undefined}
        onComplete={handleProfileComplete}
      />
    );
  }

  // Wait until profile data is loaded
  if (profileComplete === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Render active view
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardView
            doctorId={doctorId}
            doctorName={doctorName}
            doctorSpecialization={doctorSpecialization}
            onViewPatients={() => setActiveView("patients")}
            onViewCalendar={() => setActiveView("calendar")}
            onViewPrescriptions={handleViewPrescriptions}
          />
        );
      case "calendar":
        return (
          <CalendarView
            doctorId={doctorId}
            onSelectBooking={(id) => {}}
            onNewPrescription={handleViewPrescriptions}
          />
        );
      case "patients":
        return (
          <PatientsView
            doctorId={doctorId}
            onSelectPatient={(id, name) => {}}
            onNewPrescription={handleViewPrescriptions}
          />
        );
      case "prescriptions":
        return (
          <PrescriptionWriter
            doctorId={doctorId}
            doctorName={doctorName}
            doctorSpecialization={doctorSpecialization}
            doctorDegree={doctorDegree}
            doctorRegNo={doctorRegNo}
            initialBookingId={prescriptionBookingId}
            initialPatientName={prescriptionPatientName}
            onClose={handlePrescriptionClose}
          />
        );
      case "analytics":
        return <AnalyticsView doctorId={doctorId} />;
      case "video-call":
        return <VideoCallDoctorView doctorId={doctorId} doctorName={doctorName} />;
      case "profile":
        return (
          <DoctorProfileView
            doctorId={doctorId}
            userId={(session.user as Record<string, unknown>).id as string}
            profile={existingProfile}
            onProfileUpdated={handleProfileComplete}
          />
        );
      case "staff":
        return <StaffManagementView doctorId={doctorId} />;
      default:
        return (
          <DashboardView
            doctorId={doctorId}
            doctorName={doctorName}
            doctorSpecialization={doctorSpecialization}
            onViewPatients={() => setActiveView("patients")}
            onViewCalendar={() => setActiveView("calendar")}
            onViewPrescriptions={handleViewPrescriptions}
          />
        );
    }
  };

  return (
    <DoctorLayout
      activeView={activeView}
      onViewChange={setActiveView}
      doctorName={doctorName}
      doctorSpecialization={doctorSpecialization}
      doctorAvatar={doctorAvatar}
      notificationCount={notificationCount}
      onSignOut={handleSignOut}
      permissions={staffPermissions}
      isStaff={isStaff}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </DoctorLayout>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <DoctorPortal />
      <Toaster richColors position="top-right" />
    </SessionProvider>
  );
}