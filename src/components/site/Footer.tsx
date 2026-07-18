"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { AppView } from "@/lib/types";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";

const NAV_LINKS: { view: AppView; label: string }[] = [
  { view: "childcare", label: "Child Care" },
  { view: "eldercare", label: "Elder Care" },
  { view: "doctor", label: "Doctor Consultation" },
  { view: "verification", label: "Caregiver Verification" },
];

export function Footer() {
  const setView = useAppStore((s) => s.setView);
  const [showLoginNote, setShowLoginNote] = useState(false);

  return (
    <footer className="mt-auto border-t border-border/60 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                <span className="text-sm font-bold text-white">N</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Nurtur<span className="text-indigo-600">ee</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Verified child care, elder care, doctor consultation & caregiver
              verification services in Gurgaon. New — building trust one
              verified caregiver at a time.
            </p>
            <div className="mt-4 flex gap-2">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Linkedin, label: "LinkedIn" },
              ].map((s) => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="flex size-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-700"
                >
                  <s.icon className="size-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Services</h3>
            <ul className="mt-3 space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.view}>
                  <button
                    onClick={() => setView(l.view)}
                    className="text-sm text-slate-600 transition-colors hover:text-blue-700"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setView("bookings")}
                  className="text-sm text-slate-600 transition-colors hover:text-blue-700"
                >
                  My Bookings
                </button>
              </li>
              <li>
                <button
                  onClick={() => setView("documents")}
                  className="text-sm text-slate-600 transition-colors hover:text-blue-700"
                >
                  My Documents
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Connect With Us
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 text-blue-600" />
                <span>support@nurturee.in</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 text-blue-600" />
                <span>+91 1800-123-456</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 text-blue-600" />
                <span>Gurgaon, Haryana — serving all sectors</span>
              </li>
              <li className="text-xs text-slate-500">Mon–Sat, 8 AM – 10 PM IST</li>
            </ul>
          </div>

          {/* About / Login */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">My Account</h3>
            <p className="mt-3 text-sm text-slate-600">
              Login to track bookings, manage prescriptions and view your
              assigned caregiver's verified profile.
            </p>
            <button
              onClick={() => setShowLoginNote(true)}
              className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              Login / Sign Up
            </button>
            {showLoginNote && (
              <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Login is coming soon. For now, your bookings and documents are
                saved on this device.
              </p>
            )}
          </div>
        </div>

        {/* Legal */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Nurturee. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <button className="hover:text-blue-700">Privacy Policy</button>
            <button className="hover:text-blue-700">Terms of Service</button>
            <button className="hover:text-blue-700">Refund Policy</button>
            <button className="hover:text-blue-700">Cancellation Policy</button>
            <button className="hover:text-blue-700">Grievance Redressal</button>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Admin portal and Caregiver / Doctor app — coming soon. This customer
          app is built PWA-ready for Android &amp; iOS conversion.
        </p>

        {/* Discreet doctor portal link (demo only — would be a separate
            authenticated app in production) */}
        <p className="mt-2 text-xs text-slate-400">
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.hash = "doctor";
              }
            }}
            className="underline transition-colors hover:text-blue-700"
          >
            Doctor Portal (demo)
          </button>
        </p>
      </div>
    </footer>
  );
}
