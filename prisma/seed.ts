import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
import { hash } from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo doctors (users + profiles)
  const doctor1Pass = await hash("doctor123", 10);
  const doctor2Pass = await hash("doctor123", 10);

  const doc1User = await db.user.create({
    data: {
      email: "dr.sharma@nurturee.com",
      phone: "9876543210",
      name: "Dr. Priya Sharma",
      role: "DOCTOR",
      avatar: "",
    },
  });

  await db.doctorProfile.create({
    data: {
      userId: doc1User.id,
      specialization: "Pediatrician",
      degree: "MBBS, MD (Pediatrics)",
      experienceYears: 12,
      consultationFeeOnline: 800,
      consultationFeeOffline: 1500,
      registrationNo: "HMCP-2014-4521",
      availableFrom: "09:00",
      availableTo: "18:00",
      availableDays: "1,2,3,4,5,6",
      bio: "Senior Pediatrician with 12 years of experience in child healthcare. Specializes in newborn care, vaccinations, and developmental milestones.",
      profileComplete: true,
    },
  });

  const doc2User = await db.user.create({
    data: {
      email: "dr.gupta@nurturee.com",
      phone: "9876543211",
      name: "Dr. Anita Gupta",
      role: "DOCTOR",
      avatar: "",
    },
  });

  await db.doctorProfile.create({
    data: {
      userId: doc2User.id,
      specialization: "Gynaecologist",
      degree: "MBBS, MS (OBG), FRCOG",
      experienceYears: 15,
      consultationFeeOnline: 1000,
      consultationFeeOffline: 2000,
      registrationNo: "HMCG-2011-7832",
      availableFrom: "10:00",
      availableTo: "20:00",
      availableDays: "1,2,3,4,5",
      bio: "Expert Gynaecologist with 15 years of experience in women's health, prenatal care, and high-risk pregnancies.",
      profileComplete: true,
    },
  });

  const doc3User = await db.user.create({
    data: {
      email: "dr.verma@nurturee.com",
      phone: "9876543212",
      name: "Dr. Rajesh Verma",
      role: "DOCTOR",
      avatar: "",
    },
  });

  await db.doctorProfile.create({
    data: {
      userId: doc3User.id,
      specialization: "Geriatric Specialist",
      degree: "MBBS, MD (Geriatrics)",
      experienceYears: 8,
      consultationFeeOnline: 700,
      consultationFeeOffline: 1200,
      registrationNo: "HMCG-2018-1123",
      availableFrom: "08:00",
      availableTo: "17:00",
      availableDays: "1,2,3,4,5,6",
      bio: "Geriatric care specialist focusing on elderly patient management, chronic disease monitoring, and palliative care.",
      profileComplete: true,
    },
  });

  // Create patients
  const patients = [
    { name: "Sneha Mehta", phone: "9988776601", email: "sneha.m@gmail.com", gender: "Female", dob: "1990-05-15", city: "Gurgaon", pincode: "122001" },
    { name: "Rahul Kapoor", phone: "9988776602", email: "rahul.k@gmail.com", gender: "Male", dob: "1985-11-22", city: "Gurgaon", pincode: "122002" },
    { name: "Pooja Reddy", phone: "9988776603", email: "pooja.r@gmail.com", gender: "Female", dob: "1995-03-08", city: "Gurgaon", pincode: "122003" },
    { name: "Amit Joshi", phone: "9988776604", email: "amit.j@gmail.com", gender: "Male", dob: "1978-09-30", city: "Gurgaon", pincode: "122004" },
    { name: "Neha Singh", phone: "9988776605", email: "neha.s@gmail.com", gender: "Female", dob: "1992-07-12", city: "Gurgaon", pincode: "122005" },
    { name: "Vikram Patel", phone: "9988776606", email: "vikram.p@gmail.com", gender: "Male", dob: "1982-01-25", city: "Gurgaon", pincode: "122006" },
    { name: "Ananya Das", phone: "9988776607", email: "ananya.d@gmail.com", gender: "Female", dob: "1988-12-05", city: "Gurgaon", pincode: "122007" },
    { name: "Karan Malhotra", phone: "9988776608", email: "karan.m@gmail.com", gender: "Male", dob: "1975-06-18", city: "Gurgaon", pincode: "122008" },
    { name: "Divya Nair", phone: "9988776609", email: "divya.n@gmail.com", gender: "Female", dob: "1993-04-20", city: "Gurgaon", pincode: "122009" },
    { name: "Sanjay Kumar", phone: "9988776610", email: "sanjay.k@gmail.com", gender: "Male", dob: "1970-10-10", city: "Gurgaon", pincode: "122010" },
  ];

  const patientRecords = [];
  for (const p of patients) {
    patientRecords.push(
      await db.patient.create({
        data: { ...p, medicalHistory: "No known allergies. Regular check-ups." },
      })
    );
  }

  // Create bookings across multiple months for analytics
  const doc1 = await db.doctorProfile.findFirst({ where: { userId: doc1User.id } });
  const doc2 = await db.doctorProfile.findFirst({ where: { userId: doc2User.id } });
  const doc3 = await db.doctorProfile.findFirst({ where: { userId: doc3User.id } });

  const bookingStatuses = ["completed", "completed", "completed", "completed", "completed", "cancelled", "completed", "completed", "no-show", "completed"];
  const modes = ["online", "online", "physical", "online", "physical", "online", "online", "physical", "online", "online"];
  const timeSlots = ["09:00 - 09:45", "10:00 - 10:45", "11:00 - 11:45", "12:00 - 12:45", "14:00 - 14:45", "15:00 - 15:45", "16:00 - 16:45", "17:00 - 17:45"];

  const doctors = [doc1!, doc2!, doc3!];

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const bookingsPerMonth = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < bookingsPerMonth; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const patient = patientRecords[Math.floor(Math.random() * patientRecords.length)];
      const day = 1 + Math.floor(Math.random() * 28);
      const month = new Date();
      month.setMonth(month.getMonth() - monthOffset);
      const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const slot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const mode = modes[Math.floor(Math.random() * modes.length)];
      const status = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
      const price = mode === "online" ? doctor.consultationFeeOnline : doctor.consultationFeeOffline;

      const booking = await db.booking.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          serviceId: `doctor-consult-${doctor.specialization.toLowerCase()}`,
          serviceName: `${doctor.specialization} Consultation`,
          category: "doctor",
          mode,
          date: dateStr,
          timeSlot: slot,
          price,
          status,
          notes: "Regular consultation",
          callDuration: mode === "online" && status === "completed" ? 600 + Math.floor(Math.random() * 1200) : null,
        },
      });

      // Create payment for completed bookings
      if (status === "completed") {
        await db.payment.create({
          data: {
            bookingId: booking.id,
            doctorId: doctor.id,
            amount: price,
            platformFee: Math.round(price * 0.1),
            netPayout: Math.round(price * 0.9),
            method: Math.random() > 0.3 ? "online" : "upi",
            status: "completed",
            paidAt: new Date(dateStr + "T" + slot.split(" - ")[0] + ":00"),
          },
        });
      }
    }
  }

  // Create some pending/upcoming bookings for today and future
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  for (let i = 0; i < 4; i++) {
    const doctor = doctors[i % 3];
    const patient = patientRecords[i];
    await db.booking.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        serviceId: `doctor-consult-${doctor.specialization.toLowerCase()}`,
        serviceName: `${doctor.specialization} Consultation`,
        category: "doctor",
        mode: i % 2 === 0 ? "online" : "physical",
        date: todayStr,
        timeSlot: timeSlots[i],
        price: doctor.consultationFeeOnline,
        status: "confirmed",
        notes: i === 0 ? "Follow-up for vaccination schedule" : "General consultation",
      },
    });
  }

  // Future bookings
  for (let d = 1; d <= 7; d++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + d);
    const fDateStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`;
    const doctor = doctors[d % 3];
    const patient = patientRecords[(d + 3) % patientRecords.length];
    await db.booking.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        serviceId: `doctor-consult-${doctor.specialization.toLowerCase()}`,
        serviceName: `${doctor.specialization} Consultation`,
        category: "doctor",
        mode: d % 3 === 0 ? "physical" : "online",
        date: fDateStr,
        timeSlot: timeSlots[d % timeSlots.length],
        price: d % 3 === 0 ? doctor.consultationFeeOffline : doctor.consultationFeeOnline,
        status: "confirmed",
      },
    });
  }

  // Create some prescriptions
  const completedBookings = await db.booking.findMany({
    where: { status: "completed", doctorId: doc1!.id },
    take: 3,
  });

  for (const b of completedBookings) {
    const p = patientRecords.find((pr) => pr.id === b.patientId);
    const rx = await db.prescription.create({
      data: {
        bookingId: b.id,
        doctorId: doc1!.id,
        patientId: p?.id,
        patientName: p?.name || "Patient",
        patientAge: p?.dob ? String(2026 - parseInt(p.dob.split("-")[0])) : "30",
        patientGender: p?.gender || "Other",
        diagnosis: "Upper respiratory tract infection",
        notes: "Follow up after 5 days if symptoms persist.",
        status: "sent",
      },
    });

    await db.prescriptionItem.createMany({
      data: [
        { prescriptionId: rx.id, medicine: "Paracetamol 500mg", dosage: "1 tablet", frequency: "Three times daily after food", duration: "5 days", instructions: "For fever and body ache", sortOrder: 0 },
        { prescriptionId: rx.id, medicine: "Cetirizine 10mg", dosage: "1 tablet", frequency: "Once daily at bedtime", duration: "5 days", instructions: "For runny nose and sneezing", sortOrder: 1 },
        { prescriptionId: rx.id, medicine: "Azithromycin 500mg", dosage: "1 tablet", frequency: "Once daily for 3 days", duration: "3 days", instructions: "Antibiotic course - complete all doses", sortOrder: 2 },
      ],
    });
  }

  // Create time slots for today for doc1
  for (let h = 9; h <= 17; h++) {
    const start = `${String(h).padStart(2, "0")}:00`;
    const end = `${String(h).padStart(2, "0")}:45`;
    const isBookedSlot = h >= 9 && h <= 12;
    await db.timeSlot.create({
      data: {
        doctorId: doc1!.id,
        date: todayStr,
        startTime: start,
        endTime: end,
        isBooked: isBookedSlot,
        bookingId: isBookedSlot ? (await db.booking.findFirst({ where: { doctorId: doc1!.id, date: todayStr, timeSlot: `${start} - ${end}` } }))?.id : null,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log(`   Doctors: 3`);
  console.log(`   Patients: ${patients.length}`);
  console.log(`   Total bookings: ${await db.booking.count()}`);
  console.log(`   Total payments: ${await db.payment.count()}`);
  console.log(`   Prescriptions: ${await db.prescription.count()}`);
  console.log("");
  console.log("📋 Demo Login Credentials:");
  console.log("   Dr. Priya Sharma: 9876543210 (OTP: any 6 digits in dev)");
  console.log("   Dr. Anita Gupta:  9876543211 (OTP: any 6 digits in dev)");
  console.log("   Dr. Rajesh Verma: 9876543212 (OTP: any 6 digits in dev)");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });