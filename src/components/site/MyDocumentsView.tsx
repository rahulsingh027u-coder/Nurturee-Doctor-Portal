"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  FilePlus2,
  Trash2,
  Download,
  FileImage,
  FileCheck2,
} from "lucide-react";
import { format } from "date-fns";
import { useAppStore } from "@/lib/store";
import type { CustomerDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function docIcon(type: CustomerDocument["type"]) {
  switch (type) {
    case "prescription":
      return FileCheck2;
    case "report":
      return FileText;
    case "id":
      return FileImage;
    default:
      return FileText;
  }
}

function classify(file: File): CustomerDocument["type"] {
  const name = file.name.toLowerCase();
  if (name.includes("prescription") || name.includes("rx")) return "prescription";
  if (name.includes("report") || name.includes("lab") || name.includes("test"))
    return "report";
  if (name.includes("aadhaar") || name.includes("id") || name.includes("pan"))
    return "id";
  return "other";
}

export function MyDocumentsView() {
  const documents = useAppStore((s) => s.documents);
  const addDocument = useAppStore((s) => s.addDocument);
  const deleteDocument = useAppStore((s) => s.deleteDocument);
  const setView = useAppStore((s) => s.setView);
  const toast = useAppStore((s) => s.toast);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<CustomerDocument["type"] | "all">("all");

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast("File too large (max 5 MB).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const doc: CustomerDocument = {
        id: `DOC-${Date.now().toString(36).toUpperCase()}`,
        name: file.name,
        type: classify(file),
        mimeType: file.type,
        sizeBytes: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      addDocument(doc);
      toast("Document uploaded.", "success");
    };
    reader.onerror = () => toast("Could not read file.", "error");
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const filtered =
    filter === "all"
      ? documents
      : documents.filter((d) => d.type === filter);

  const FILTERS: { v: typeof filter; label: string }[] = [
    { v: "all", label: "All" },
    { v: "prescription", label: "Prescriptions" },
    { v: "report", label: "Lab Reports" },
    { v: "id", label: "IDs" },
    { v: "other", label: "Other" },
  ];

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => setView("home")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-blue-700"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </button>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My Documents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Securely store prescriptions, lab reports, IDs and any document your
          caregiver or doctor may need during a visit. Files stay on your
          device.
        </p>

        {/* Upload zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="mt-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-6 text-center md:p-8"
        >
          <FilePlus2 className="mx-auto size-10 text-blue-500" />
          <h2 className="mt-2 text-sm font-semibold sm:text-base">
            Upload a document
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Drag &amp; drop a file here, or tap the button below. JPG, PNG or
            PDF — max 5 MB.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <FilePlus2 className="size-4" /> Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Filter chips */}
        {documents.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.v
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Documents list */}
        {filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <FileText className="mx-auto size-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium">No documents yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload your first prescription or report to get started.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((doc) => {
              const DocIcon = docIcon(doc.type);
              return (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <DocIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.type} • {formatBytes(doc.sizeBytes)} •{" "}
                      {format(new Date(doc.uploadedAt), "dd MMM yyyy")}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <a
                        href={doc.dataUrl}
                        download={doc.name}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="size-3" /> Download
                      </a>
                      <a
                        href={doc.dataUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <FileText className="size-3" /> View
                      </a>
                      <button
                        onClick={() => {
                          deleteDocument(doc.id);
                          toast("Document deleted.", "default");
                        }}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
