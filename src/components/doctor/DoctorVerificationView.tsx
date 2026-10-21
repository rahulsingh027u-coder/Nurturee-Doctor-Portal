"use client";
import { useState, useEffect, useCallback } from "react";
import { Shield, CheckCircle, XCircle, Clock, Upload, AlertCircle, Loader2, RefreshCw, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const DOCTOR_DOC_TYPES = [
  { key: "medical_degree", label: "Medical Degree (MBBS/MD/MS)", mandatory: true },
  { key: "nmc_registration", label: "NMC Registration", mandatory: true },
  { key: "govt_id", label: "Government ID", mandatory: true },
  { key: "passport_photo", label: "Passport Photo", mandatory: true },
  { key: "clinic_registration", label: "Clinic Registration", mandatory: false },
  { key: "gst_registration", label: "GST Certificate", mandatory: false },
  { key: "specialization_cert", label: "Specialization Certificate", mandatory: false },
  { key: "experience_cert", label: "Experience Certificate", mandatory: false },
];

export function DoctorVerificationView({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [doctorVerified, setDoctorVerified] = useState(false);
  const [doctorSuspended, setDoctorSuspended] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { file: File; preview: string }>>({});

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/verification/status");
      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications || []);
        setDoctorVerified(data.doctor?.verified || false);
        setDoctorSuspended(data.doctor?.isSuspended || false);
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch status", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleFileUpload = (docType: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File exceeds 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedDocs((prev) => ({ ...prev, [docType]: { file, preview: e.target?.result as string } }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const mandatoryDocs = DOCTOR_DOC_TYPES.filter((d) => d.mandatory);
    const missing = mandatoryDocs.filter((d) => !uploadedDocs[d.key]);
    if (missing.length > 0) {
      toast({ title: "Missing Documents", description: missing.map((d) => d.label).join(", "), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const documents = Object.entries(uploadedDocs).map(([type, { file, preview }]) => ({ type, url: preview, name: file.name, size: file.size }));
      const res = await fetch("/api/verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Documents submitted for review" });
        setUploadedDocs({});
        await fetchStatus();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-500">Loading...</span>
      </div>
    );
  }

  if (doctorVerified) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-green-700">Verification Approved</h2>
            <p className="mt-2 text-sm text-green-600">Your credentials have been verified.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (doctorSuspended) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-700">Account Suspended</h2>
            <p className="mt-2 text-sm text-red-600">Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latest = verifications[0];
  const isPending = latest?.status === "pending" || latest?.status === "resubmitted";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Doctor Verification</h1>
          <p className="text-sm text-gray-500">Submit NMC-compliant credentials for verification</p>
        </div>
      </div>

      {latest && (
        <Card className={isPending ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {isPending ? <Clock className="h-5 w-5 text-blue-500" /> : <AlertCircle className="h-5 w-5 text-amber-500" />}
              <div>
                <p className="font-semibold">{isPending ? "Under Review" : "Rejected"}</p>
                <p className="text-xs text-gray-500">Attempt {latest.attemptCount} of 3</p>
              </div>
            </div>
            <Badge>{latest.status}</Badge>
          </CardContent>
        </Card>
      )}

      {latest?.reviewNotes && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm font-semibold text-amber-700">Review Notes:</p>
            <p className="mt-1 text-sm text-amber-600">{latest.reviewNotes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Mandatory (NMC Guidelines)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {DOCTOR_DOC_TYPES.filter((d) => d.mandatory).map((dt) => (
                <div key={dt.key} className="rounded-lg border border-gray-200 p-3">
                  <Label className="text-xs font-medium">{dt.label}</Label>
                  <div className="mt-2">
                    {uploadedDocs[dt.key] ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-gray-600">{uploadedDocs[dt.key].file.name}</span>
                        <button onClick={() => setUploadedDocs((p) => { const n = { ...p }; delete n[dt.key]; return n; })}>
                          <XCircle className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-blue-400">
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(dt.key, f); }} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-400">Optional</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {DOCTOR_DOC_TYPES.filter((d) => !d.mandatory).map((dt) => (
                <div key={dt.key} className="rounded-lg border border-gray-100 p-3">
                  <Label className="text-xs font-medium text-gray-500">{dt.label}</Label>
                  <div className="mt-2">
                    {uploadedDocs[dt.key] ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-gray-600">{uploadedDocs[dt.key].file.name}</span>
                        <button onClick={() => setUploadedDocs((p) => { const n = { ...p }; delete n[dt.key]; return n; })}>
                          <XCircle className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400 hover:border-blue-300">
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(dt.key, f); }} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => fetchStatus()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || Object.keys(uploadedDocs).length === 0}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
