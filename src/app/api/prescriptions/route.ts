import { NextResponse } from "next/server";
import { requireDoctorAuth, checkDoctorOwnership } from '@/lib/require-doctor-auth';
import { db } from "@/lib/db";

// GET /api/prescriptions?doctorId=xxx&patientId=xxx
export async function GET(req: Request) {
  try {
    const auth = await requireDoctorAuth();
    if (!auth.ok) return auth.response;
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const bookingId = searchParams.get("bookingId");

    const where: Record<string, unknown> = {};
    if (doctorId) {
      const ownershipError = await checkDoctorOwnership(doctorId, auth);
      if (ownershipError) return ownershipError;
      const profile = await db.doctorProfile.findUnique({ where: { userId: doctorId } });
      where.doctorId = profile ? profile.id : doctorId;
    }
    if (patientId) where.patientId = patientId;
    if (bookingId) where.bookingId = bookingId;

    const prescriptions = await db.prescription.findMany({
      where,
      include: { items: { orderBy: { sortOrder: "asc" } }, patient: true, booking: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/prescriptions — create prescription with items
export async function POST(req: Request) {
  try {
    const auth = await requireDoctorAuth();
    if (!auth.ok) return auth.response;
    const { doctorId, patientId, bookingId, patientName, patientAge, patientGender, diagnosis, notes, items, status } = await req.json();
    const ownershipError = await checkDoctorOwnership(doctorId, auth);
    if (ownershipError) return ownershipError;
    if (!doctorId || !patientName || patientAge === undefined || !patientGender || !diagnosis || !bookingId) {
    if (patientName.length > 200) return NextResponse.json({ error: 'Patient name too long' }, { status: 400 });
    if (diagnosis.length > 2000) return NextResponse.json({ error: 'Diagnosis too long' }, { status: 400 });
      return NextResponse.json({ error: "doctorId, patientName, patientAge, patientGender, diagnosis and bookingId are required" }, { status: 400 });
    }

    const prescription = await db.prescription.create({
      data: {
        doctorId,
        patientId,
        bookingId,
        patientName,
        patientAge,
        patientGender,
        diagnosis: diagnosis || "",
        notes: notes || "",
        status: status || "draft",
        items: {
          create: (items || []).map((item: { medicine: string; dosage: string; frequency: string; duration: string; instructions: string; sortOrder: number }, i: number) => ({
            medicine: item.medicine,
            dosage: item.dosage || "",
            frequency: item.frequency || "",
            duration: item.duration || "",
            instructions: item.instructions || "",
            sortOrder: item.sortOrder ?? i,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    // If sent, update booking status
    if (status === "sent" && bookingId) {
      await db.booking.update({ where: { id: bookingId }, data: { status: "completed" } });
    }

    // Create notification for patient
    if (patientId) {
      const patient = await db.patient.findUnique({ where: { id: patientId } });
      if (patient?.userId) {
        await db.notification.create({
          data: {
            userId: patient.userId,
            bookingId,
            title: "New Prescription",
            message: `Dr. has sent you a new prescription for your consultation.`,
            type: "prescription",
          },
        });
      }
    }

    return NextResponse.json(prescription);
  } catch (error) {
    console.error("Prescription create error:", error);
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 });
  }
}

// PATCH /api/prescriptions — update prescription
export async function PATCH(req: Request) {
  try {
    const auth = await requireDoctorAuth();
    if (!auth.ok) return auth.response;
    const { id, status, diagnosis, notes, items } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (diagnosis !== undefined) data.diagnosis = diagnosis;
    if (notes !== undefined) data.notes = notes;

    // If updating items, delete old and recreate
    if (items) {
      await db.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
      await db.prescriptionItem.createMany({
        data: items.map((item: { medicine: string; dosage: string; frequency: string; duration: string; instructions: string; sortOrder: number }, i: number) => ({
          prescriptionId: id,
          medicine: item.medicine,
          dosage: item.dosage || "",
          frequency: item.frequency || "",
          duration: item.duration || "",
          instructions: item.instructions || "",
          sortOrder: item.sortOrder ?? i,
        })),
      });
    }

    const prescription = await db.prescription.update({ where: { id }, data, include: { items: { orderBy: { sortOrder: "asc" } } } });
    return NextResponse.json(prescription);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}