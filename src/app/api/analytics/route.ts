import { NextResponse } from "next/server";
import { requireDoctorAuth } from '@/lib/require-doctor-auth';
import { db } from "@/lib/db";

// GET /api/analytics?doctorId=xxx
export async function GET(req: Request) {
  try {
    const auth = await requireDoctorAuth();
    if (!auth.ok) return auth.response;
    const { searchParams } = new URL(req.url);
    let doctorId = searchParams.get("doctorId");
    if (!doctorId) return NextResponse.json({ error: "doctorId required" }, { status: 400 });

    // Resolve User ID to DoctorProfile ID if needed
    const profile = await db.doctorProfile.findUnique({ where: { userId: doctorId } });
    if (profile) doctorId = profile.id;

    // --- Dashboard summary cards ---
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const todayBookings = await (db as any).booking.count({ where: { doctorId, date: todayStr, status: { not: "cancelled" } } });
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;

    const weekPayments = await (db as any).payment.findMany({
      where: { doctorId, paidAt: { gte: new Date(weekStartStr) }, status: "completed" },
    });
    const weekEarnings = weekPayments.reduce((s, p) => s + p.netPayout, 0);

    const totalPatients = await (db as any).booking.groupBy({ by: ["patientId"], where: { doctorId, status: { not: "cancelled" } } });

    const pendingPrescriptions = await (db as any).booking.count({
      where: { doctorId, status: "completed", prescriptions: { none: {} } },
    });

    // --- Monthly revenue (last 6 months) ---
    const monthlyRevenue: { month: string; earnings: number; appointments: number; online: number; offline: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mStart = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-01`;
      const mEnd = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()}`;

      const monthPayments = await (db as any).payment.findMany({
        where: { doctorId, status: "completed", paidAt: { gte: new Date(mStart), lte: new Date(mEnd + "T23:59:59") } },
      });

      const monthBookings = await (db as any).booking.findMany({
        where: { doctorId, date: { gte: mStart, lte: mEnd } },
      });

      const onlineCount = monthBookings.filter((b) => b.mode === "online" && b.status !== "cancelled").length;
      const offlineCount = monthBookings.filter((b) => b.mode === "physical" && b.status !== "cancelled").length;

      monthlyRevenue.push({
        month: m.toLocaleString("default", { month: "short", year: "2-digit" }),
        earnings: monthPayments.reduce((s, p) => s + p.netPayout, 0),
        appointments: monthBookings.filter((b) => b.status !== "cancelled").length,
        online: onlineCount,
        offline: offlineCount,
      });
    }

    // --- Patient analytics ---
    const newPatientsMonthly: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mStart = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-01`;
      const mEnd = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()}`;

      // Patients whose first booking was this month
      const firstBookings = await (db as any).booking.groupBy({
        by: ["patientId"],
        where: { doctorId, date: { gte: mStart, lte: mEnd } },
        having: { patientId: { _count: { gte: 1 } } },
      });

      // Count patients whose earliest booking is this month
      let count = 0;
      for (const fb of firstBookings) {
        if (!fb.patientId) continue;
        const earliest = await db.booking.findFirst({
          where: { doctorId, patientId: fb.patientId, status: { not: "cancelled" } },
          orderBy: { date: "asc" },
        });
        if (earliest && earliest.date >= mStart && earliest.date <= mEnd) count++;
      }

      newPatientsMonthly.push({
        month: m.toLocaleString("default", { month: "short", year: "2-digit" }),
        count,
      });
    }

    // Gender breakdown
    const allPatients = await (db as any).booking.groupBy({
      by: ["patientId"],
      where: { doctorId, status: { not: "cancelled" } },
    });
    const genderData = { Male: 0, Female: 0, Other: 0 };
    for (const ap of allPatients) {
      if (!ap.patientId) continue;
      const patient = await (db as any).patient.findUnique({ where: { id: ap.patientId } });
      if (patient) {
        const g = patient.gender || "Other";
        genderData[g as keyof typeof genderData] = (genderData[g as keyof typeof genderData] || 0) + 1;
      }
    }

    // --- Appointment stats ---
    const allBookings = await (db as any).booking.findMany({ where: { doctorId } });
    const totalBookings = allBookings.length;
    const cancelledBookings = allBookings.filter((b) => b.status === "cancelled").length;
    const noShowBookings = allBookings.filter((b) => b.status === "no-show").length;
    const completedBookings = allBookings.filter((b) => b.status === "completed").length;
    const onlineBookings = allBookings.filter((b) => b.mode === "online" && b.status !== "cancelled").length;
    const offlineBookings = allBookings.filter((b) => b.mode === "physical" && b.status !== "cancelled").length;
    const completedOnlineBookings = allBookings.filter((b) => b.mode === "online" && b.status === "completed").length;

    // Average call duration from completed online bookings
    let averageCallDurationMinutes = 0;
    const completedOnline = allBookings.filter((b) => b.mode === "online" && b.status === "completed");
    if (completedOnline.length > 0) {
      const totalDuration = completedOnline.reduce((sum, b) => sum + Math.round((b.callDuration || 0) / 60), 0);
      averageCallDurationMinutes = Math.round(totalDuration / completedOnline.length);
    }

    // Peak hours
    const hourCounts: Record<string, number> = {};
    for (const b of allBookings) {
      if (b.status === "cancelled") continue;
      const hour = b.timeSlot?.split(":")[0] || "00";
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // --- Recent payments ---
    const recentPayments = await (db as any).payment.findMany({
      where: { doctorId },
      include: { booking: { include: { patient: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // --- Upcoming appointments ---
    const upcomingBookings = await (db as any).booking.findMany({
      where: { doctorId, date: { gte: todayStr }, status: { in: ["confirmed", "pending"] } },
      include: { patient: true },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      take: 10,
    });

    // --- Today's bookings ---
    const todaysBookings = await (db as any).booking.findMany({
      where: { doctorId, date: todayStr },
      include: { patient: true, prescriptions: true },
      orderBy: { timeSlot: "asc" },
    });

    // --- Calendar bookings (this month) ---
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()}`;
    const calendarBookings = await (db as any).booking.findMany({
      where: { doctorId, date: { gte: monthStart, lte: monthEnd } },
      include: { patient: true, prescriptions: true },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    });

    // --- Time slots for a specific date ---
    const dateParam = searchParams.get("date");
    let timeSlots: any[] = [];
    if (dateParam) {
      timeSlots = await (db as any).timeSlot.findMany({
        where: { doctorId, date: dateParam },
        orderBy: { startTime: "asc" },
      });
    }

    return NextResponse.json({
      summary: {
        todayAppointments: todayBookings,
        weekEarnings,
        totalPatients: totalPatients.length,
        pendingPrescriptions,
      },
      monthlyRevenue,
      newPatientsMonthly,
      genderDistribution: Object.entries(genderData).map(([gender, count]) => ({
        gender,
        count,
        percentage: 0, // computed on frontend
      })),
      appointmentStats: {
        totalAppointments: totalBookings,
        completedOnlineCount: completedOnlineBookings,
        cancelledCount: cancelledBookings,
        noShowCount: noShowBookings,
        onlineCount: onlineBookings,
        offlineCount: offlineBookings,
        cancellationRate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
        averageCallDurationMinutes,
      },
      peakHours: peakHours.map(h => ({ ...h, bookings: h.count })),
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        date: p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : p.createdAt.toISOString().split('T')[0],
        patientName: p.booking?.patient?.name || 'Unknown',
        service: p.booking?.serviceName || '',
        mode: (p.method === 'online' ? 'online' : 'physical') as 'online' | 'physical',
        amount: p.amount,
        status: (p.status?.charAt(0).toUpperCase() + p.status?.slice(1) || 'Pending') as 'Completed' | 'Pending' | 'Refunded',
      })),
      upcomingBookings,
      todaysBookings,
      calendarBookings,
      timeSlots,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}