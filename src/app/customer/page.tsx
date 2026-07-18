"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Header } from "@/components/site/Header";
import { BottomNav } from "@/components/site/BottomNav";
import { Footer } from "@/components/site/Footer";
import { ToastHost } from "@/components/site/ToastHost";
import { BookingModal } from "@/components/site/BookingModal";
import { VideoCallView } from "@/components/site/VideoCallView";
import { HomeView } from "@/components/site/HomeView";
import { ServiceDetailView } from "@/components/site/ServiceDetailView";
import { DoctorListView } from "@/components/site/DoctorListView";
import { MyBookingsView } from "@/components/site/MyBookingsView";
import { MyDocumentsView } from "@/components/site/MyDocumentsView";
import { CaregiverProfileView } from "@/components/site/CaregiverProfileView";
import { DoctorConsoleView } from "@/components/site/DoctorConsoleView";

function CustomerApp() {
  const view = useAppStore((s) => s.view);
  const initVideoCall = useAppStore((s) => s.initVideoCall);

  // Initialize video call manager once on mount
  useEffect(() => {
    initVideoCall();
  }, [initVideoCall]);

  const renderView = () => {
    switch (view) {
      case "home":
        return <HomeView />;
      case "childcare":
        return <ServiceDetailView category="childcare" />;
      case "eldercare":
        return <ServiceDetailView category="eldercare" />;
      case "doctor":
        return <DoctorListView />;
      case "verification":
        return <ServiceDetailView category="verification" />;
      case "bookings":
        return <MyBookingsView />;
      case "documents":
        return <MyDocumentsView />;
      case "caregiver-profile":
        return <CaregiverProfileView />;
      case "doctor-console":
        return <DoctorConsoleView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{renderView()}</main>
      <Footer />
      <BottomNav />
      <BookingModal />
      <VideoCallView />
      <ToastHost />
    </div>
  );
}

export default function CustomerPage() {
  return <CustomerApp />;
}