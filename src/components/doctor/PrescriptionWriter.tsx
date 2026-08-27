"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  GripVertical,
  Printer,
  Send,
  Save,
  FileText,
  Eye,
  Search,
  X,
  Stethoscope,
  Calendar,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────

interface PrescriptionWriterProps {
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorDegree: string;
  doctorRegNo: string;
  initialBookingId?: string;
  initialPatientName?: string;
  onClose: () => void;
}

interface PatientInfo {
  id: string;
  name: string;
  age?: string;
  gender?: string;
  phone: string;
}

interface MedicineItem {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionRecord {
  id: string;
  patientName: string;
  patientAge?: string | null;
  patientGender?: string | null;
  diagnosis: string;
  notes: string;
  status: string;
  createdAt: string;
  items: {
    id: string;
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    sortOrder: number;
  }[];
}

// ─── Frequency Options ─────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "After meals",
  "Before meals",
  "At bedtime",
  "SOS",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
] as const;

// ─── Helpers ───────────────────────────────────────────────────────────

let idCounter = 0;
function uid() {
  return `med-${Date.now()}-${++idCounter}`;
}

function emptyMedicine(): MedicineItem {
  return {
    id: uid(),
    medicine: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  };
}

function computeAge(dob?: string): string | undefined {
  if (!dob) return undefined;
  try {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    if (age < 0) age = 0;
    return `${age} yrs`;
  } catch {
    return undefined;
  }
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "draft") return "outline";
  if (status === "sent") return "default";
  return "secondary";
}

function statusColor(status: string) {
  if (status === "draft") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "sent") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-sky-50 text-sky-700 border-sky-200";
}

// ─── Sortable Medicine Row ─────────────────────────────────────────────

function SortableMedicineRow({
  item,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  item: MedicineItem;
  index: number;
  onChange: (id: string, field: keyof MedicineItem, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-white p-3 transition-shadow",
        isDragging
          ? "border-blue-300 shadow-lg shadow-blue-100/50"
          : "border-gray-200 hover:border-blue-200"
      )}
    >
      {/* Top row: number + drag handle + delete */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          className="touch-none cursor-grab rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
        <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
          {index + 1}
        </span>
        <span className="text-xs font-medium text-gray-400">Medicine</span>
        <div className="flex-1" />
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => onRemove(item.id)}
            aria-label="Remove medicine"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Medicine name — full width */}
      <Input
        placeholder="Medicine name"
        value={item.medicine}
        onChange={(e) => onChange(item.id, "medicine", e.target.value)}
        className="mb-3 border-gray-200 focus-visible:ring-blue-300"
      />

      {/* Grid: dosage, frequency, duration, instructions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Dosage
          </label>
          <Input
            placeholder="e.g. 500mg"
            value={item.dosage}
            onChange={(e) => onChange(item.id, "dosage", e.target.value)}
            className="border-gray-200 focus-visible:ring-blue-300"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Frequency
          </label>
          <Select
            value={item.frequency}
            onValueChange={(v) => onChange(item.id, "frequency", v)}
          >
            <SelectTrigger className="border-gray-200 focus:ring-blue-300">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Duration
          </label>
          <Input
            placeholder="e.g. 7 days"
            value={item.duration}
            onChange={(e) => onChange(item.id, "duration", e.target.value)}
            className="border-gray-200 focus-visible:ring-blue-300"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Instructions
          </label>
          <Input
            placeholder="e.g. Take with water"
            value={item.instructions}
            onChange={(e) => onChange(item.id, "instructions", e.target.value)}
            className="border-gray-200 focus-visible:ring-blue-300"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Prescription Preview ──────────────────────────────────────────────

function PrescriptionPreview({
  doctorName,
  doctorDegree,
  doctorRegNo,
  doctorSpecialization,
  patient,
  diagnosis,
  notes,
  medicines,
  previewDate,
}: {
  doctorName: string;
  doctorDegree: string;
  doctorRegNo: string;
  doctorSpecialization: string;
  patient: PatientInfo | null;
  diagnosis: string;
  notes: string;
  medicines: MedicineItem[];
  previewDate: string;
}) {
  const hasContent =
    patient || diagnosis || medicines.some((m) => m.medicine) || notes;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Print header */}
      <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <Stethoscope className="size-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Prescription Preview</h3>
            <p className="text-[11px] text-gray-500">Live preview of your prescription</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 print:p-8">
        {/* Doctor header */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-900">{doctorName}</h2>
          <p className="text-sm text-blue-700 font-medium">
            {doctorDegree} &middot; {doctorSpecialization}
          </p>
          {doctorRegNo && (
            <p className="text-xs text-gray-500">Reg. No: {doctorRegNo}</p>
          )}
        </div>

        <Separator />

        {/* Patient info */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-[11px] font-medium uppercase text-gray-400">Patient</span>
            <p className="font-medium text-gray-900">
              {patient?.name || "—"}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium uppercase text-gray-400">Age</span>
            <p className="font-medium text-gray-900">
              {patient?.age || "—"}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium uppercase text-gray-400">Gender</span>
            <p className="font-medium text-gray-900">
              {patient?.gender || "—"}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <Calendar className="mr-1 inline size-3" />
          {previewDate}
        </div>

        <Separator />

        {/* Diagnosis */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
            Diagnosis
          </span>
          <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
            {diagnosis || <span className="italic text-gray-400">No diagnosis entered</span>}
          </p>
        </div>

        <Separator />

        {/* Medicine table */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
            Medicines
          </span>
          {medicines.length === 0 || !medicines.some((m) => m.medicine) ? (
            <p className="mt-2 text-sm italic text-gray-400">
              No medicines added yet
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 pr-2 text-left font-semibold text-gray-500 w-6">#</th>
                    <th className="py-2 pr-2 text-left font-semibold text-gray-500">Medicine</th>
                    <th className="py-2 pr-2 text-left font-semibold text-gray-500 hidden sm:table-cell">Dosage</th>
                    <th className="py-2 pr-2 text-left font-semibold text-gray-500">Frequency</th>
                    <th className="py-2 pr-2 text-left font-semibold text-gray-500 hidden md:table-cell">Duration</th>
                    <th className="py-2 text-left font-semibold text-gray-500 hidden lg:table-cell">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines
                    .filter((m) => m.medicine)
                    .map((m, i) => (
                      <tr key={m.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-2 font-medium text-gray-400">{i + 1}</td>
                        <td className="py-2 pr-2 font-medium text-gray-900">{m.medicine}</td>
                        <td className="py-2 pr-2 text-gray-600 hidden sm:table-cell">{m.dosage || "—"}</td>
                        <td className="py-2 pr-2 text-gray-600">{m.frequency || "—"}</td>
                        <td className="py-2 pr-2 text-gray-600 hidden md:table-cell">{m.duration || "—"}</td>
                        <td className="py-2 text-gray-600 hidden lg:table-cell">{m.instructions || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <>
            <Separator />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                Additional Notes
              </span>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-gray-400 italic">
            For Nurturee Health Services
          </p>
          <div className="h-10 w-32 border-b border-gray-300" />
        </div>
      </div>
    </div>
  );
}

// ─── History Card ──────────────────────────────────────────────────────

function HistoryCard({
  rx,
  doctorName,
  doctorDegree,
  doctorRegNo,
  doctorSpecialization,
  onPrint,
}: {
  rx: PrescriptionRecord;
  doctorName: string;
  doctorDegree: string;
  doctorRegNo: string;
  doctorSpecialization: string;
  onPrint: (rx: PrescriptionRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden border-gray-200 transition-shadow hover:shadow-md">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="size-3.5 text-blue-500 shrink-0" />
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {rx.patientName}
                </p>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {rx.diagnosis || "No diagnosis"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold border",
                  statusColor(rx.status)
                )}
              >
                {rx.status}
              </Badge>
              {expanded ? (
                <ChevronUp className="size-4 text-gray-400" />
              ) : (
                <ChevronDown className="size-4 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {format(new Date(rx.createdAt), "dd MMM yyyy, hh:mm a")}
            </span>
            {rx.patientAge && <span>Age: {rx.patientAge}</span>}
            {rx.patientGender && <span>Gender: {rx.patientGender}</span>}
          </div>

          {rx.notes && (
            <div>
              <span className="text-[11px] font-medium uppercase text-gray-400">
                Notes
              </span>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{rx.notes}</p>
            </div>
          )}

          {/* Medicine list */}
          <div>
            <span className="text-[11px] font-medium uppercase text-gray-400">
              Medicines ({rx.items.length})
            </span>
            <div className="mt-2 space-y-2">
              {rx.items.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-md bg-gray-50 p-3"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.medicine}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {[
                        item.dosage,
                        item.frequency,
                        item.duration,
                        item.instructions,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-gray-600 hover:text-blue-700 hover:border-blue-200"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(rx);
              }}
            >
              <Printer className="size-3.5" />
              Print
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Print Dialog ──────────────────────────────────────────────────────

function PrintPreviewDialog({
  open,
  onOpenChange,
  prescription,
  doctorName,
  doctorDegree,
  doctorRegNo,
  doctorSpecialization,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: PrescriptionRecord | null;
  doctorName: string;
  doctorDegree: string;
  doctorRegNo: string;
  doctorSpecialization: string;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const content = printRef.current;
    if (!content) return;

    const win = window.open("", "_blank", "width=800,height=1000");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${prescription?.patientName || "Patient"}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 48px;
              color: #1a1a1a;
              line-height: 1.5;
            }
            .header { margin-bottom: 24px; }
            .header h1 { font-size: 20px; font-weight: 700; }
            .header p { font-size: 14px; color: #e11d48; font-weight: 500; }
            .header .reg { font-size: 12px; color: #6b7280; margin-top: 2px; }
            hr { border: none; border-top: 1px solid #fda4af; margin: 16px 0; }
            .patient-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 14px; margin-bottom: 12px; }
            .patient-grid label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; font-weight: 500; }
            .patient-grid p { font-weight: 600; margin-top: 2px; }
            .date { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
            .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #e11d48; font-weight: 600; margin-bottom: 6px; }
            .diagnosis { font-size: 14px; white-space: pre-wrap; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
            th { text-align: left; padding: 8px 8px 8px 0; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #6b7280; }
            td { padding: 8px 8px 8px 0; border-bottom: 1px solid #f3f4f6; }
            .notes { font-size: 13px; white-space: pre-wrap; color: #374151; }
            .footer { display: flex; justify-content: space-between; align-items: end; margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
            .footer .tagline { font-size: 11px; font-style: italic; color: #9ca3af; }
            .footer .signature { width: 140px; border-bottom: 1px solid #374151; padding-bottom: 4px; text-align: center; font-size: 12px; color: #374151; }
            @media print { body { padding: 24px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${doctorName}</h1>
            <p>${doctorDegree} &middot; ${doctorSpecialization}</p>
            ${doctorRegNo ? `<p class="reg">Reg. No: ${doctorRegNo}</p>` : ""}
          </div>
          <hr />
          <div class="patient-grid">
            <div><label>Patient</label><p>${prescription?.patientName || "—"}</p></div>
            <div><label>Age</label><p>${prescription?.patientAge || "—"}</p></div>
            <div><label>Gender</label><p>${prescription?.patientGender || "—"}</p></div>
          </div>
          <div class="date">Date: ${prescription ? format(new Date(prescription.createdAt), "dd MMMM yyyy") : ""}</div>
          <hr />
          <div class="section-label">Diagnosis</div>
          <div class="diagnosis">${prescription?.diagnosis || "—"}</div>
          <hr />
          <div class="section-label">Medicines</div>
          <table>
            <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
            <tbody>
              ${prescription?.items
                .map(
                  (item, i) =>
                    `<tr><td>${i + 1}</td><td>${item.medicine}</td><td>${item.dosage || "—"}</td><td>${item.frequency || "—"}</td><td>${item.duration || "—"}</td><td>${item.instructions || "—"}</td></tr>`
                )
                .join("") || "<tr><td colspan='6'>No medicines prescribed</td></tr>"}
            </tbody>
          </table>
          ${prescription?.notes ? `<hr /><div class="section-label">Additional Notes</div><div class="notes">${prescription.notes}</div>` : ""}
          <div class="footer">
            <div class="tagline">For Nurturee Health Services</div>
            <div class="signature">Doctor's Signature</div>
          </div>
        </body>
      </html>
    `);

    win.document.close();
    setTimeout(() => {
      win.print();
    }, 250);
  }, [prescription, doctorName, doctorDegree, doctorRegNo, doctorSpecialization]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="size-5 text-blue-600" />
            Print Prescription
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div ref={printRef} className="rounded-lg border bg-white p-8">
            {/* Doctor */}
            <div className="space-y-0.5 mb-4">
              <h2 className="text-lg font-bold text-gray-900">{doctorName}</h2>
              <p className="text-sm text-blue-700 font-medium">
                {doctorDegree} &middot; {doctorSpecialization}
              </p>
              {doctorRegNo && (
                <p className="text-xs text-gray-500">Reg. No: {doctorRegNo}</p>
              )}
            </div>
            <Separator className="bg-blue-100" />

            {/* Patient */}
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Patient
                </span>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {prescription?.patientName || "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Age
                </span>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {prescription?.patientAge || "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Gender
                </span>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {prescription?.patientGender || "—"}
                </p>
              </div>
            </div>

            {prescription && (
              <p className="text-xs text-gray-500 mt-2">
                {format(new Date(prescription.createdAt), "dd MMMM yyyy 'at' hh:mm a")}
              </p>
            )}

            <Separator className="bg-blue-100 my-4" />

            {/* Diagnosis */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                Diagnosis
              </span>
              <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                {prescription?.diagnosis || "—"}
              </p>
            </div>

            <Separator className="bg-blue-100 my-4" />

            {/* Medicines table */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                Medicines
              </span>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="py-2 pr-2 text-left font-semibold text-gray-500 w-6">#</th>
                      <th className="py-2 pr-2 text-left font-semibold text-gray-500">Medicine</th>
                      <th className="py-2 pr-2 text-left font-semibold text-gray-500">Dosage</th>
                      <th className="py-2 pr-2 text-left font-semibold text-gray-500">Frequency</th>
                      <th className="py-2 pr-2 text-left font-semibold text-gray-500">Duration</th>
                      <th className="py-2 text-left font-semibold text-gray-500">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription?.items.map((item, i) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2 pr-2 font-medium text-gray-400">{i + 1}</td>
                        <td className="py-2 pr-2 font-medium text-gray-900">{item.medicine}</td>
                        <td className="py-2 pr-2 text-gray-600">{item.dosage || "—"}</td>
                        <td className="py-2 pr-2 text-gray-600">{item.frequency || "—"}</td>
                        <td className="py-2 pr-2 text-gray-600">{item.duration || "—"}</td>
                        <td className="py-2 text-gray-600">{item.instructions || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {prescription?.notes && (
              <>
                <Separator className="bg-blue-100 my-4" />
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                    Additional Notes
                  </span>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {prescription.notes}
                  </p>
                </div>
              </>
            )}

            <Separator className="mt-6 mb-4" />
            <div className="flex items-end justify-between">
              <p className="text-[11px] text-gray-400 italic">
                For Nurturee Health Services
              </p>
              <div className="text-center">
                <div className="h-10 w-32 border-b border-gray-300" />
                <p className="text-[10px] text-gray-500 mt-1">Doctor's Signature</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              onClick={handlePrint}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
            >
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export default function PrescriptionWriter({
  doctorId,
  doctorName,
  doctorDegree,
  doctorRegNo,
  doctorSpecialization,
  initialBookingId,
  initialPatientName,
  onClose,
}: PrescriptionWriterProps) {
  // ── Tab state ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("write");

  // ── Write tab state ─────────────────────────────────────────────────
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientInfo[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<MedicineItem[]>([emptyMedicine()]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ── History tab state ───────────────────────────────────────────────
  const [historySearch, setHistorySearch] = useState("");
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [printRx, setPrintRx] = useState<PrescriptionRecord | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  // ── DnD sensors ─────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // ── Today's date ────────────────────────────────────────────────────
  const previewDate = useMemo(() => format(new Date(), "dd MMMM yyyy"), []);

  // ── Auto-fill from initial booking ───────────────────────────────────
  useEffect(() => {
    if (initialBookingId) {
      fetch(`/api/bookings/${initialBookingId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data) {
            const p: PatientInfo = {
              id: data.patientId || "",
              name: data.patient?.name || initialPatientName || "Unknown",
              age: data.patient?.dob ? computeAge(data.patient.dob) : undefined,
              gender: data.patient?.gender || undefined,
              phone: data.patient?.phone || "",
            };
            setSelectedPatient(p);
          }
        })
        .catch(() => {
          // fallback: just use initialPatientName
          if (initialPatientName) {
            setSelectedPatient({
              id: "",
              name: initialPatientName,
              phone: "",
            });
          }
        });
    } else if (initialPatientName) {
      setSelectedPatient({
        id: "",
        name: initialPatientName,
        phone: "",
      });
    }
  }, [initialBookingId, initialPatientName]);

  // ── Patient search ──────────────────────────────────────────────────
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePatientSearch = useCallback(
    (query: string) => {
      setPatientSearch(query);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (!query.trim()) {
        setPatientResults([]);
        setShowPatientDropdown(false);
        return;
      }
      searchTimeout.current = setTimeout(() => {
        fetch(`/api/patients?doctorId=${doctorId}&search=${encodeURIComponent(query)}`)
          .then((r) => r.json())
          .then((data) => {
            const list = Array.isArray(data)
              ? data.map((p: Record<string, string>) => ({
                  id: p.id,
                  name: p.name,
                  age: p.dob ? computeAge(p.dob) : undefined,
                  gender: p.gender || undefined,
                  phone: p.phone || "",
                }))
              : [];
            setPatientResults(list);
            setShowPatientDropdown(list.length > 0);
          })
          .catch(() => {
            setPatientResults([]);
            setShowPatientDropdown(false);
          });
      }, 300);
    },
    [doctorId]
  );

  const selectPatient = useCallback((patient: PatientInfo) => {
    setSelectedPatient(patient);
    setPatientAge(patient.age || "");
    setPatientGender(patient.gender || "");
    setPatientSearch(patient.name);
    setShowPatientDropdown(false);
    setPatientResults([]);
  }, []);

  const clearPatient = useCallback(() => {
    setSelectedPatient(null);
    setPatientSearch("");
  }, []);

  // ── Medicine handlers ───────────────────────────────────────────────
  const addMedicine = useCallback(() => {
    setMedicines((prev) => [...prev, emptyMedicine()]);
  }, []);

  const removeMedicine = useCallback((id: string) => {
    setMedicines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const updateMedicine = useCallback(
    (id: string, field: keyof MedicineItem, value: string) => {
      setMedicines((prev) =>
        prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
      );
    },
    []
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMedicines((prev) => {
        const oldIndex = prev.findIndex((m) => m.id === active.id);
        const newIndex = prev.findIndex((m) => m.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  // ── Save / Send ─────────────────────────────────────────────────────
  const hasMedicine = medicines.some((m) => m.medicine.trim());

  const savePrescription = useCallback(
    async (status: "draft" | "sent") => {
      if (!selectedPatient) return;
      if (!diagnosis.trim()) return;
      if (!patientAge.trim()) return;
      if (!patientGender.trim()) return;
      if (!initialBookingId) return;
      if (!hasMedicine) return;

      if (status === "sent") setIsSending(true);
      else setIsSaving(true);

      try {
        const payload = {
          doctorId,
          patientId: selectedPatient.id || undefined,
          bookingId: initialBookingId || undefined,
          patientName: selectedPatient.name,
          patientAge: patientAge.trim() || undefined,
          patientGender: patientGender.trim() || undefined,
          diagnosis: diagnosis.trim(),
          notes: notes.trim(),
          status,
          items: medicines
            .filter((m) => m.medicine.trim())
            .map((m, i) => ({
              medicine: m.medicine.trim(),
              dosage: m.dosage.trim(),
              frequency: m.frequency,
              duration: m.duration.trim(),
              instructions: m.instructions.trim(),
              sortOrder: i,
            })),
        };

        await fetch("/api/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (status === "sent") {
          // Reset form after sending
          setSelectedPatient(null);
      setPatientAge("");
      setPatientGender("");
          setPatientSearch("");
          setDiagnosis("");
          setNotes("");
          setMedicines([emptyMedicine()]);
          setActiveTab("history");
          loadHistory();
        }
      } catch {
        // Silently fail — could show a toast here
      } finally {
        setIsSaving(false);
        setIsSending(false);
      }
    },
    [
      selectedPatient,
      diagnosis,
      notes,
      medicines,
      doctorId,
      initialBookingId,
      hasMedicine,
    ]
  );

  // ── History ─────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/prescriptions?doctorId=${doctorId}`);
      const data = await res.json();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch {
      setPrescriptions([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return prescriptions;
    const q = historySearch.toLowerCase();
    return prescriptions.filter((rx) =>
      rx.patientName.toLowerCase().includes(q)
    );
  }, [prescriptions, historySearch]);

  const handlePrintFromHistory = useCallback((rx: PrescriptionRecord) => {
    setPrintRx(rx);
    setPrintOpen(true);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 to-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 lg:px-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <FileText className="size-4 text-white" />
          </div>
          <h1 className="flex-1 text-base font-semibold text-gray-900">
            Prescriptions
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-blue-700 hover:bg-blue-50"
            onClick={onClose}
            aria-label="Close prescriptions"
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 h-10 bg-blue-50/80 p-1">
            <TabsTrigger
              value="write"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm gap-2 text-sm"
            >
              <FileText className="size-4" />
              Write New
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm gap-2 text-sm"
            >
              <Eye className="size-4" />
              History
              {prescriptions.length > 0 && (
                <Badge className="ml-1 h-5 min-w-5 rounded-full bg-blue-100 px-1.5 text-[10px] font-bold text-blue-700">
                  {prescriptions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 1: WRITE NEW                                          */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="write" className="mt-0">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              {/* ── Left: Form (3 cols) ────────────────────────────────── */}
              <div className="xl:col-span-3 space-y-5">
                {/* Patient Selection */}
                {!selectedPatient && (
                  <Card className="border-blue-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <User className="size-4 text-blue-600" />
                        Select Patient
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search patient by name..."
                          value={patientSearch}
                          onChange={(e) => handlePatientSearch(e.target.value)}
                          onFocus={() =>
                            patientResults.length > 0 && setShowPatientDropdown(true)
                          }
                          className="pl-9 border-gray-200 focus-visible:ring-blue-300"
                        />
                      </div>

                      {/* Dropdown */}
                      {showPatientDropdown && patientResults.length > 0 && (
                        <div className="absolute left-4 right-4 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                          {patientResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                              onClick={() => selectPatient(p)}
                            >
                              <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                {p.name
                                  .split(" ")
                                  .map((w) => w[0])
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {p.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {[p.age, p.gender, p.phone].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Patient Info Card */}
                {selectedPatient && (
                  <Card className="border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                        {selectedPatient.name
                          .split(" ")
                          .map((w) => w[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedPatient.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          {selectedPatient.age && (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {selectedPatient.age}
                            </span>
                          )}
                          {selectedPatient.gender && (
                            <span>{selectedPatient.gender}</span>
                          )}
                          {selectedPatient.phone && (
                            <span>{selectedPatient.phone}</span>
                          )}
                        </div>
                      </div>
                      {!initialBookingId && !initialPatientName && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={clearPatient}
                          aria-label="Clear patient"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Patient Age & Gender */}
                {selectedPatient && (
                  <Card className="border-gray-200">
                    <CardContent className="flex flex-wrap gap-4 p-4">
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-xs font-medium text-gray-500">Age <span className="text-red-500">*</span></label>
                        <Input
                          placeholder="e.g. 35 yrs"
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          className="mt-1 border-gray-200"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-xs font-medium text-gray-500">Gender <span className="text-red-500">*</span></label>
                        <Select value={patientGender} onValueChange={setPatientGender}>
                          <SelectTrigger className="mt-1 border-gray-200">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Diagnosis */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <AlertCircle className="size-4 text-blue-600" />
                      Diagnosis <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Enter diagnosis..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      rows={3}
                      className="border-gray-200 focus-visible:ring-blue-300 resize-none"
                    />
                    <Textarea
                      placeholder="Additional notes (optional)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="border-gray-200 focus-visible:ring-blue-300 resize-none text-sm"
                    />
                  </CardContent>
                </Card>

                {/* Medicine List */}
                <Card className="border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="size-4 text-blue-600" />
                        Medicines
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 font-medium"
                      >
                        {medicines.filter((m) => m.medicine).length} added
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={medicines.map((m) => m.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {medicines.map((med, idx) => (
                            <SortableMedicineRow
                              key={med.id}
                              item={med}
                              index={idx}
                              onChange={updateMedicine}
                              onRemove={removeMedicine}
                              canRemove={medicines.length > 1}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 border-dashed border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                      onClick={addMedicine}
                    >
                      <Plus className="size-4" />
                      Add Medicine
                    </Button>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                    disabled={
                      !selectedPatient ||
                      !hasMedicine ||
                      isSaving
                    }
                    onClick={() => savePrescription("draft")}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 hover:shadow-md transition-all"
                    disabled={
                      !selectedPatient ||
                      !diagnosis.trim() ||
                      !hasMedicine ||
                      isSending
                    }
                    onClick={() => savePrescription("sent")}
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Send to Patient
                  </Button>
                </div>
              </div>

              {/* ── Right: Preview (2 cols) ────────────────────────────── */}
              <div className="xl:col-span-2">
                <div className="sticky top-20">
                  <PrescriptionPreview
                    doctorName={doctorName}
                    doctorDegree={doctorDegree}
                    doctorRegNo={doctorRegNo}
                    doctorSpecialization={doctorSpecialization}
                    patient={selectedPatient}
                    diagnosis={diagnosis}
                    notes={notes}
                    medicines={medicines}
                    previewDate={previewDate}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 2: HISTORY                                            */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <TabsContent value="history" className="mt-0">
            {/* Search */}
            <div className="mb-5">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by patient name..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 border-gray-200 focus-visible:ring-blue-300"
                />
              </div>
            </div>

            {/* Loading */}
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-500">Loading prescriptions...</span>
              </div>
            )}

            {/* Empty state */}
            {!isLoadingHistory && filteredHistory.length === 0 && (
              <Card className="border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex size-14 items-center justify-center rounded-full bg-blue-50 mb-4">
                    <FileText className="size-7 text-blue-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {historySearch.trim()
                      ? "No prescriptions match your search"
                      : "No prescriptions yet"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {historySearch.trim()
                      ? "Try a different search term"
                      : "Prescriptions you create will appear here"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* List */}
            {!isLoadingHistory && filteredHistory.length > 0 && (
              <ScrollArea className="max-h-[calc(100vh-220px)]">
                <div className="space-y-3 pr-2">
                  {filteredHistory.map((rx) => (
                    <HistoryCard
                      key={rx.id}
                      rx={rx}
                      doctorName={doctorName}
                      doctorDegree={doctorDegree}
                      doctorRegNo={doctorRegNo}
                      doctorSpecialization={doctorSpecialization}
                      onPrint={handlePrintFromHistory}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Print Dialog */}
      <PrintPreviewDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        prescription={printRx}
        doctorName={doctorName}
        doctorDegree={doctorDegree}
        doctorRegNo={doctorRegNo}
        doctorSpecialization={doctorSpecialization}
      />
    </div>
  );
}export { PrescriptionWriter };
