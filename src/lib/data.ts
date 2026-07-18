import type { Service, Caregiver } from "./types";

/**
 * Services catalog with pricing calibrated to the Gurgaon market (2025-26).
 *
 * Sources used for benchmarking (typical ranges observed across
 * Portea, Care24, Momkidcare, Urban Company, Healers at Home, Justdial listings):
 *   - At-home pediatric / gynec consultation: ₹1,500 - ₹3,000 per visit
 *   - Online specialist consult: ₹600 - ₹1,500 per session
 *   - Day nanny (8-10 hrs, Gurgaon): ₹15,000 - ₹22,000 / month
 *   - 24-hr live-in nanny (Gurgaon): ₹28,000 - ₹38,000 / month
 *   - Jappa nanny (40-day postnatal, North India): ₹30,000 - ₹45,000 / month
 *   - Elder caregiver (12-hr shift, Gurgaon): ₹22,000 - ₹30,000 / month
 *   - Full-time elder attendant (24-hr): ₹32,000 - ₹45,000 / month
 *   - Background verification (basic): ₹400 - ₹700
 *   - Comprehensive verification (Aadhar + Police + Address + Refs): ₹1,200 - ₹2,000
 */

export const SERVICES: Service[] = [
  // ============ CHILD CARE ============
  {
    id: "pregnancy-planning",
    name: "Pregnancy Planning",
    category: "childcare",
    shortDescription:
      "Pre-conception counselling, fertility tracking, nutrition & lifestyle guidance for couples.",
    longDescription:
      "Pregnancy planning helps you prepare your body and your relationship for a healthy conception. Our certified gynaecologists and maternal-health advisors walk you through ovulation tracking, pre-conception nutrition, partner health checks, supplements like folic acid, lifestyle changes, vaccination status and financial planning — so that when you are ready to conceive, the journey starts on the safest possible footing.",
    mode: "both",
    price: 1500,
    onlinePrice: 1500,
    inHomePrice: 2500,
    priceUnit: "per session",
    duration: "45 min",
    icon: "Baby",
    accent: "blue",
    features: [
      "Pre-conception health check & medical history review",
      "Ovulation & fertile-window tracking guidance",
      "Folic acid / supplement plan",
      "Diet & lifestyle counselling for both partners",
      "Vaccination & genetic screening advice",
      "PCOS / thyroid / diabetes pre-pregnancy management",
    ],
  },
  {
    id: "prenatal-care",
    name: "Prenatal Care",
    category: "childcare",
    shortDescription:
      "Trimester-wise doctor visits, antenatal exercises, diet, scan tracking & risk monitoring.",
    longDescription:
      "Prenatal care is the structured medical and emotional support you receive through every trimester of pregnancy. Our team schedules your antenatal visits, coordinates ultrasound scans and blood tests, monitors blood pressure, weight and foetal growth, and pairs each visit with diet counselling, gentle prenatal yoga and emotional well-being check-ins — flagging any high-risk signs early.",
    mode: "both",
    price: 2000,
    onlinePrice: 2000,
    inHomePrice: 3500,
    priceUnit: "per session",
    duration: "60 min",
    icon: "HeartPulse",
    accent: "blue",
    features: [
      "Trimester-wise antenatal consultation",
      "Ultrasound & lab test coordination",
      "BP, weight & foetal growth monitoring",
      "Prenatal yoga & exercise guidance",
      "Diet plan with protein, iron, calcium balance",
      "High-risk pregnancy early warning checks",
    ],
  },
  {
    id: "postnatal-care",
    name: "Postnatal Care",
    category: "childcare",
    shortDescription:
      "Mother & newborn recovery, breastfeeding support, Jappa-style care, mood monitoring.",
    longDescription:
      "The first 40 days after delivery — the traditional Jappa period — are critical for both mother and baby. Our postnatal package covers healing checks, breastfeeding and lactation support, newborn care basics, baby massage and bath guidance, postpartum mental-health screening for baby blues / depression, and a Jappa nanny option for round-the-clock traditional recovery care.",
    mode: "both",
    price: 2000,
    onlinePrice: 2000,
    inHomePrice: 3500,
    priceUnit: "per session",
    duration: "60 min",
    icon: "HeartHandshake",
    accent: "blue",
    features: [
      "Post-delivery mother recovery checks",
      "Breastfeeding & lactation support",
      "Newborn care — bathing, massage, sleep",
      "Postpartum depression screening",
      "Umbilical cord & jaundice care",
      "Optional Jappa nanny pairing",
    ],
  },
  {
    id: "child-health",
    name: "Child Health Care",
    category: "childcare",
    shortDescription:
      "Vaccination, growth tracking, nutrition, developmental milestones & paediatric consults.",
    longDescription:
      "From the first vaccine at birth to school-age growth and immunity, our child health programme keeps your little one on track. We follow the IAP vaccination schedule, track height, weight and BMI on WHO growth charts, screen developmental milestones, provide age-appropriate nutrition plans and offer on-demand paediatric consults for fever, colic, allergies or behavioural concerns — at home or online.",
    mode: "both",
    price: 1000,
    onlinePrice: 1000,
    inHomePrice: 2000,
    priceUnit: "per session",
    duration: "30 min",
    icon: "Baby",
    accent: "blue",
    features: [
      "IAP vaccination schedule tracking",
      "Growth & BMI monitoring on WHO charts",
      "Developmental milestone screening",
      "Age-wise nutrition & weaning plan",
      "Paediatric consult for fever, colic, allergy",
      "School-readiness health check",
    ],
  },
  {
    id: "women-health",
    name: "Women Health",
    category: "childcare",
    shortDescription:
      "PCOS, thyroid, menstrual issues, fertility, menopause & preventive screening.",
    longDescription:
      "Women's health needs change through every decade — from puberty to menopause. Our gynaecologists and endocrinologists offer PCOS / PCOD management, thyroid & hormonal balance, irregular and painful period evaluation, fertility assessment, contraception counselling, cervical cancer screening (Pap smear + HPV), and perimenopause / menopause support — delivered with privacy and respect.",
    mode: "both",
    price: 1500,
    onlinePrice: 1500,
    inHomePrice: 2500,
    priceUnit: "per session",
    duration: "45 min",
    icon: "Heart",
    accent: "blue",
    features: [
      "PCOS / PCOD & hormonal assessment",
      "Thyroid & insulin resistance management",
      "Menstrual irregularity & dysmenorrhea care",
      "Fertility evaluation & counselling",
      "Pap smear & HPV screening coordination",
      "Menopause transition support",
    ],
  },
  // ============ NANNY SERVICES (under Child Care) ============
  {
    id: "day-nanny",
    name: "Day Nanny",
    category: "childcare",
    shortDescription:
      "Verified daytime nanny (8–10 hrs) for baby care, feeding, play & light housework.",
    longDescription:
      "A Day Nanny is perfect for working parents who need a trusted caregiver at home through the working hours of the day. Each nanny is background-verified, video-verified and trained in newborn handling, feeding schedules, sleep routines, hygiene and age-appropriate play. Available 8 to 10 hours a day, 6 days a week, with a replacement guarantee if the assigned nanny does not work out within the first week.",
    mode: "physical",
    price: 18000,
    priceUnit: "per month",
    duration: "8–10 hrs/day • 6 days/week",
    icon: "Baby",
    accent: "indigo",
    features: [
      "Background + police + Aadhaar verified",
      "Trained in newborn & infant care",
      "Feeding, bathing, sleep routine",
      "Age-appropriate play & stimulation",
      "Light housework related to baby only",
      "Free replacement within 7 days",
    ],
  },
  {
    id: "live-nanny-24hr",
    name: "24-Hour Live-in Nanny",
    category: "childcare",
    shortDescription:
      "Round-the-clock live-in nanny for full-time newborn & infant care at home.",
    longDescription:
      "When both parents work or a single parent needs help, a 24-hour live-in nanny becomes part of your household. Our live-in nannies are trained to handle overnight feeds, sleep training, soothing and emergency response. They stay at your home, are rotation-supported for weekly offs, and undergo the same multi-step verification as every Nurturee caregiver. Ideal for the first 6–12 months post-delivery.",
    mode: "physical",
    price: 30000,
    priceUnit: "per month",
    duration: "24 hrs • 6 days/week",
    icon: "Moon",
    accent: "indigo",
    features: [
      "Round-the-clock newborn & infant care",
      "Overnight feeding & soothing",
      "Sleep training support",
      "Background + police + video verified",
      "Weekly off rotation covered",
      "Emergency response trained",
    ],
  },
  {
    id: "jappa-nanny",
    name: "Jappa Nanny",
    category: "childcare",
    shortDescription:
      "Traditional 40-day post-delivery Jappa care for mother & newborn recovery.",
    longDescription:
      "The Jappa period — the first 40 days after childbirth — is when a mother's body heals and a newborn bonds. Our Jappa nannies specialise in this North-Indian tradition: they give the mother daily oil massage, prepare Jappa-specific nutrition (panjiri, ladu, light meals), manage baby massage and bath, support breastfeeding, and follow cultural rest protocols. Verified, trained and supervised by our postnatal nurses.",
    mode: "physical",
    price: 35000,
    priceUnit: "per month",
    duration: "40-day cycle • 24 hrs",
    icon: "Sparkles",
    accent: "indigo",
    features: [
      "Traditional 40-day Jappa care",
      "Mother oil massage & bath",
      "Jappa diet — panjiri, ladu, light meals",
      "Newborn massage, bath & care",
      "Breastfeeding positioning support",
      "Supervised by postnatal nurse",
    ],
  },
  // ============ ELDER CARE ============
  {
    id: "elder-companionship",
    name: "Elderly Companionship",
    category: "eldercare",
    shortDescription:
      "Trained companion for daily routine, walks, meals, medicine reminders & company.",
    longDescription:
      "Loneliness and forgetfulness are the biggest challenges for elderly parents living alone or with busy children. Our companionship caregivers spend 4 hours a day with your parent — assisting with morning routine, accompanying them on walks, preparing light meals, reminding them of medicines, engaging in conversation, reading aloud, helping with video calls to family, and keeping a daily activity log shared with you.",
    mode: "physical",
    price: 15000,
    priceUnit: "per month",
    duration: "4 hrs/day • 6 days/week",
    icon: "Users",
    accent: "indigo",
    features: [
      "Daily routine & morning assistance",
      "Accompanied walks & light exercise",
      "Medicine reminders & meal prep",
      "Companionship & mental engagement",
      "Family video-call help",
      "Daily activity log shared with you",
    ],
  },
  {
    id: "elder-medical-attendant",
    name: "Elderly Medical Attendant",
    category: "eldercare",
    shortDescription:
      "Trained attendant for bed-bound / post-hospitalisation elders — 12-hour shift.",
    longDescription:
      "When an elderly family member is recovering from surgery, a stroke, a fracture or is bed-bound, they need a medically trained attendant — not just a companion. Our 12-hour medical attendants are certified in basic nursing: they handle positioning, sponge baths, diaper changes, wound dressing support, feeding via tube or oral, oxygen cylinder support, vitals monitoring (BP, sugar, temperature) and keep a structured medical log.",
    mode: "physical",
    price: 25000,
    priceUnit: "per month",
    duration: "12 hrs/day • 6 days/week",
    icon: "Stethoscope",
    accent: "indigo",
    features: [
      "Basic nursing — positioning, sponge bath",
      "Diaper change & toileting support",
      "Wound dressing assistance",
      "Vitals monitoring — BP, sugar, temp",
      "Oxygen cylinder & tube feeding support",
      "Structured medical log maintained",
    ],
  },
  {
    id: "elder-fulltime-caregiver",
    name: "Full-Time Elder Caregiver (24 hr)",
    category: "eldercare",
    shortDescription:
      "Live-in 24-hour caregiver for full-time elder assistance with medical needs.",
    longDescription:
      "For elders with advanced needs — dementia, Alzheimer's, Parkinson's, post-stroke, end-of-life care — our 24-hour live-in caregivers provide continuous, supervised support. They are trained in fall prevention, mobility transfers, dementia-friendly communication, pressure-sore prevention, medication schedule management and end-of-life dignity care. Weekly off rotation is covered by a verified backup caregiver.",
    mode: "physical",
    price: 35000,
    priceUnit: "per month",
    duration: "24 hrs • 6 days/week",
    icon: "HeartHandshake",
    accent: "indigo",
    features: [
      "24-hr continuous supervision",
      "Mobility transfer & fall prevention",
      "Dementia-friendly communication",
      "Pressure-sore prevention",
      "Medication schedule management",
      "Weekly off with verified backup",
    ],
  },
  {
    id: "dementia-care",
    name: "Dementia / Alzheimer's Care",
    category: "eldercare",
    shortDescription:
      "Specialised caregiver trained in dementia communication, behaviour & safety.",
    longDescription:
      "Dementia and Alzheimer's need a different kind of caregiver — one trained in patience, validation therapy, redirection, sundowning management, wandering prevention and end-stage comfort care. Our dementia-specialist caregivers understand that every behaviour is communication, and they are equipped to handle confusion, agitation and repetitive questions without confrontation — preserving dignity at every stage.",
    mode: "physical",
    price: 28000,
    priceUnit: "per month",
    duration: "12 hrs/day • 6 days/week",
    icon: "Brain",
    accent: "indigo",
    features: [
      "Validation therapy & redirection",
      "Sundowning & agitation management",
      "Wandering prevention & safety",
      "Memory cues & daily structure",
      "Family education & support",
      "Coordination with neurologist",
    ],
  },
  {
    id: "post-hospitalisation",
    name: "Post-Hospitalisation Care",
    category: "eldercare",
    shortDescription:
      "Short-term nurse / attendant visit after discharge — dressing, injections, vitals.",
    longDescription:
      "Discharge from hospital is not the end of recovery — it is the beginning. Our post-hospitalisation care brings a trained nurse or attendant to your home for wound dressing, injections, IV cannula care, catheter care, vitals monitoring and physiotherapy support. Booked per visit, with packages available for 7-day, 14-day or 30-day structured recovery plans designed with your treating doctor.",
    mode: "physical",
    price: 2500,
    priceUnit: "per visit",
    duration: "45–60 min per visit",
    icon: "Syringe",
    accent: "indigo",
    features: [
      "Wound dressing & suture care",
      "Injections & IV cannula management",
      "Catheter & colostomy care",
      "Vitals — BP, sugar, temp, SpO2",
      "Physiotherapy support",
      "7/14/30-day recovery packages",
    ],
  },
  // ============ DOCTOR CONSULTATION ============
  {
    id: "pediatrician",
    name: "Pediatrician Consultation",
    category: "doctor",
    shortDescription:
      "Child specialist for fever, vaccination, growth, allergies & developmental concerns.",
    longDescription:
      "Our paediatricians are available both online (video consult) and at-home visits across Gurgaon. They handle routine vaccination, growth and developmental concerns, fever and infection evaluation, allergy and asthma management, nutrition and weaning guidance, and parental anxiety about colic, sleep and behaviour. Online consults are perfect for follow-ups and minor queries; at-home visits suit newborns and unwell children.",
    mode: "both",
    price: 800,
    onlinePrice: 800,
    inHomePrice: 2000,
    priceUnit: "per consultation",
    duration: "30 min",
    icon: "Baby",
    accent: "rose",
    features: [
      "Vaccination as per IAP schedule",
      "Growth & developmental assessment",
      "Fever, infection & allergy evaluation",
      "Newborn & well-baby check",
      "Parental guidance — colic, sleep, weaning",
      "Online & at-home options",
    ],
  },
  {
    id: "gynecologist",
    name: "Gynaecologist Consultation",
    category: "doctor",
    shortDescription:
      "Women's health expert — pregnancy, PCOS, periods, fertility & menopause.",
    longDescription:
      "Our gynaecologists cover every stage of a woman's life — adolescent menstrual issues, PCOS and fertility evaluation, antenatal and postnatal care, contraception counselling, Pap smear and HPV screening, fibroid and endometriosis management, and menopause support. Available online for follow-ups and sensitive discussions, and at-home for elderly or post-surgery patients who cannot travel.",
    mode: "both",
    price: 1000,
    onlinePrice: 1000,
    inHomePrice: 2500,
    priceUnit: "per consultation",
    duration: "45 min",
    icon: "Stethoscope",
    accent: "rose",
    features: [
      "Pregnancy & antenatal care",
      "PCOS, thyroid & hormonal issues",
      "Menstrual & fertility evaluation",
      "Pap smear & HPV screening",
      "Contraception counselling",
      "Menopause management",
    ],
  },
  {
    id: "geriatric-specialist",
    name: "Geriatric Specialist",
    category: "doctor",
    shortDescription:
      "Senior-care doctor for chronic disease, polypharmacy, memory & fall risk.",
    longDescription:
      "A geriatric specialist understands that an 80-year-old's body responds differently to medication, illness and surgery than a younger adult. They review polypharmacy (interaction between multiple medicines), assess memory and cognitive decline, evaluate fall risk and bone health, manage chronic conditions like diabetes, hypertension, arthritis and heart failure, and coordinate with your existing specialists to avoid duplication.",
    mode: "both",
    price: 1200,
    onlinePrice: 1200,
    inHomePrice: 3000,
    priceUnit: "per consultation",
    duration: "45 min",
    icon: "HeartPulse",
    accent: "rose",
    features: [
      "Polypharmacy review & optimisation",
      "Memory & cognitive assessment",
      "Fall risk & bone health evaluation",
      "Chronic disease management",
      "Multi-specialist coordination",
      "Home visit for mobility-limited",
    ],
  },
  {
    id: "general-physician",
    name: "General Physician",
    category: "doctor",
    shortDescription:
      "Family doctor for everyday illness — fever, cold, infection, lifestyle disease.",
    longDescription:
      "For everyday illness — fever, cold, flu, stomach infection, headache, allergy, or a routine check-up — our general physicians are a quick video call or home visit away. They can prescribe, order lab tests, refer to specialists, and manage chronic lifestyle conditions like diabetes, hypertension and cholesterol. The most affordable and fastest way to access medical advice.",
    mode: "both",
    price: 500,
    onlinePrice: 500,
    inHomePrice: 1500,
    priceUnit: "per consultation",
    duration: "20 min",
    icon: "Stethoscope",
    accent: "rose",
    features: [
      "Fever, cold, flu & infection consult",
      "Lifestyle disease management",
      "Online prescription & lab orders",
      "Specialist referral",
      "Routine health check",
      "Fastest appointment availability",
    ],
  },
  // ============ CAREGIVER VERIFICATION ============
  {
    id: "background-check-basic",
    name: "Basic Background Check",
    category: "verification",
    shortDescription:
      "Identity, address & reference verification for any caregiver you hire.",
    longDescription:
      "Hiring a nanny, attendant or nurse from outside Nurturee? Use our verification service as a safety net. The Basic Background Check covers identity verification (Aadhaar / Voter ID / PAN), current address verification through physical visit, and two personal reference calls. You receive a detailed PDF report within 5 working days. Recommended for casual or short-term caregivers.",
    mode: "physical",
    price: 499,
    priceUnit: "per verification",
    duration: "5 working days",
    icon: "ShieldCheck",
    accent: "amber",
    features: [
      "Identity verification (Aadhaar / Voter / PAN)",
      "Address verification — physical visit",
      "2 personal reference calls",
      "Criminal record check (district court)",
      "Detailed PDF report",
      "Within 5 working days",
    ],
  },
  {
    id: "comprehensive-verification",
    name: "Comprehensive Verification",
    category: "verification",
    shortDescription:
      "Aadhaar + Police + Address + References + Medical + Video — all-in-one.",
    longDescription:
      "Our most thorough verification — designed for full-time live-in caregivers, nannies handling newborns, and attendants caring for vulnerable elders. It combines Aadhaar-based identity, address verification, police verification filing and follow-up, court record check, 3 reference calls, medical fitness certificate, and a video interview by our team to confirm demeanour and communication. A 12-point verified badge is issued on clearance.",
    mode: "physical",
    price: 1499,
    priceUnit: "per verification",
    duration: "7–10 working days",
    icon: "ShieldCheck",
    accent: "amber",
    features: [
      "Aadhaar-based identity verification",
      "Police verification filing + follow-up",
      "Address verification — physical visit",
      "Court record check (district + high court)",
      "3 personal reference calls",
      "Medical fitness certificate",
      "Video interview by Nurturee team",
      "12-point verified badge on clearance",
    ],
  },
  {
    id: "video-verification-addon",
    name: "Video Verification Add-on",
    category: "verification",
    shortDescription:
      "Live video interview & demeanour assessment — add-on to any verification.",
    longDescription:
      "If you have already done a basic verification but want an extra layer of confidence, the Video Verification Add-on is a 20-minute recorded video interview by our trained assessor. They evaluate communication, body language, response to emergency scenarios, and document the caregiver's stated skills. The recording is shared with you along with an assessor's note — so you can meet the caregiver before they enter your home.",
    mode: "online",
    price: 499,
    priceUnit: "per interview",
    duration: "20 min",
    icon: "Video",
    accent: "amber",
    features: [
      "20-min recorded video interview",
      "Communication & demeanour assessment",
      "Emergency scenario response check",
      "Skills self-attestation captured",
      "Recording + assessor notes shared",
      "Schedule within 48 hours",
    ],
  },
];

/**
 * Mock caregivers — these would come from the admin-approved pool in production.
 * Each is fully verified (the data a customer sees AFTER booking + admin assignment).
 */
export const CAREGIVERS: Caregiver[] = [
  {
    id: "cg-001",
    name: "Sunita Devi",
    dob: "1991-04-12",
    age: 34,
    gender: "Female",
    maritalStatus: "Married",
    address: "House 24, Lane 3, Chakkarpur Village, Sector 28, Gurugram, Haryana 122002",
    area: "Sector 28, Gurugram",
    specialization: "Newborn & Jappa Care",
    experienceYears: 9,
    languages: ["Hindi", "Bhojpuri", "Basic English"],
    certifications: ["Jappa Care Training — Asha Foundation", "Newborn Handling Certificate"],
    emergency: {
      name: "Ramesh Kumar (Husband)",
      relation: "Husband",
      phone: "+91 98xxx xxx12",
    },
    aadhaarMasked: "XXXX-XXXX-4521",
    aadhaarVerified: true,
    policeVerification: {
      done: true,
      verifiedOn: "2025-11-02",
      referenceNo: "PVG/GR/2025/88231",
    },
    videoVerification: {
      done: true,
      verifiedOn: "2025-11-05",
    },
    medicalFitness: true,
    referencesChecked: 3,
    photoColor: "from-pink-400 to-rose-500",
  },
  {
    id: "cg-002",
    name: "Geeta Rani",
    dob: "1988-09-23",
    age: 37,
    gender: "Female",
    maritalStatus: "Married",
    address: "Tower B-12, Parsavnath Estate, Sector 45, Gurugram, Haryana 122003",
    area: "Sector 45, Gurugram",
    specialization: "Day Nanny & Infant Care",
    experienceYears: 11,
    languages: ["Hindi", "Punjabi", "English"],
    certifications: [" Infant CPR — Red Cross", "First Aid Certificate"],
    emergency: {
      name: "Mohan Lal (Husband)",
      relation: "Husband",
      phone: "+91 99xxx xxx47",
    },
    aadhaarMasked: "XXXX-XXXX-8830",
    aadhaarVerified: true,
    policeVerification: {
      done: true,
      verifiedOn: "2025-10-18",
      referenceNo: "PVG/GR/2025/87119",
    },
    videoVerification: {
      done: true,
      verifiedOn: "2025-10-20",
    },
    medicalFitness: true,
    referencesChecked: 3,
    photoColor: "from-violet-400 to-indigo-500",
  },
  {
    id: "cg-003",
    name: "Anjali Sharma",
    dob: "1995-01-08",
    age: 30,
    gender: "Female",
    maritalStatus: "Single",
    address: "PG Block, Sushant Lok 1, Sector 43, Gurugram, Haryana 122002",
    area: "Sushant Lok 1, Gurugram",
    specialization: "Postnatal Nurse & Lactation",
    experienceYears: 6,
    languages: ["Hindi", "English", "Bengali"],
    certifications: ["GNM Nursing", "Lactation Counselling Certificate"],
    emergency: {
      name: "Suresh Sharma (Father)",
      relation: "Father",
      phone: "+91 98xxx xx884",
    },
    aadhaarMasked: "XXXX-XXXX-1192",
    aadhaarVerified: true,
    policeVerification: {
      done: true,
      verifiedOn: "2025-12-04",
      referenceNo: "PVG/GR/2025/91002",
    },
    videoVerification: {
      done: true,
      verifiedOn: "2025-12-06",
    },
    medicalFitness: true,
    referencesChecked: 3,
    photoColor: "from-sky-400 to-blue-500",
  },
  {
    id: "cg-004",
    name: "Rajesh Kumar",
    dob: "1986-06-15",
    age: 39,
    gender: "Male",
    maritalStatus: "Married",
    address: "H.No. 78, Wazirabad Village, Sector 52, Gurugram, Haryana 122003",
    area: "Sector 52, Gurugram",
    specialization: "Elder Medical Attendant",
    experienceYears: 8,
    languages: ["Hindi", "English"],
    certifications: ["Male Nursing Attendant — 1 yr", "BLS Certified"],
    emergency: {
      name: "Kavita Devi (Wife)",
      relation: "Wife",
      phone: "+91 97xxx xx221",
    },
    aadhaarMasked: "XXXX-XXXX-6677",
    aadhaarVerified: true,
    policeVerification: {
      done: true,
      verifiedOn: "2025-09-22",
      referenceNo: "PVG/GR/2025/85521",
    },
    videoVerification: {
      done: true,
      verifiedOn: "2025-09-24",
    },
    medicalFitness: true,
    referencesChecked: 3,
    photoColor: "from-emerald-400 to-teal-500",
  },
  {
    id: "cg-005",
    name: "Lakshmi Bai",
    dob: "1990-12-03",
    age: 34,
    gender: "Female",
    maritalStatus: "Widowed",
    address: "Qtr. 14, Tigra Village, Sector 57, Gurugram, Haryana 122003",
    area: "Sector 57, Gurugram",
    specialization: "Elder Companionship & Dementia Care",
    experienceYears: 7,
    languages: ["Hindi", "Marathi"],
    certifications: ["Dementia Care Basics — ARDSI", "First Aid"],
    emergency: {
      name: "Priya (Daughter)",
      relation: "Daughter",
      phone: "+91 90xxx xx119",
    },
    aadhaarMasked: "XXXX-XXXX-3340",
    aadhaarVerified: true,
    policeVerification: {
      done: true,
      verifiedOn: "2025-11-12",
      referenceNo: "PVG/GR/2025/89330",
    },
    videoVerification: {
      done: true,
      verifiedOn: "2025-11-14",
    },
    medicalFitness: true,
    referencesChecked: 3,
    photoColor: "from-amber-400 to-orange-500",
  },
  {
    id: "cg-006",
    name: "Dr. Meera Iyer",
    dob: "1982-03-19",
    age: 43,
    gender: "Female",
    maritalStatus: "Married",
    address: "C-204, Heritage One, Sector 61, Gurugram, Haryana 122011",
    area: "Sector 61, Gurugram",
    specialization: "Gynaecologist & Obstetrician",
    experienceYears: 16,
    languages: ["English", "Hindi", "Tamil"],
    certifications: ["MBBS, MS (OBG)", "Fellowship in Fertility — IIRRH"],
    emergency: {
      name: "Anand Iyer (Husband)",
      relation: "Husband",
      phone: "+91 98xxx xx309",
    },
    aadhaarMasked: "XXXX-XXXX-0088",
    aadhaarVerified: true,
    policeVerification: {
      done: true,
      verifiedOn: "2025-08-15",
      referenceNo: "PVG/GR/2025/83001",
    },
    videoVerification: {
      done: true,
      verifiedOn: "2025-08-17",
    },
    medicalFitness: true,
    referencesChecked: 3,
    photoColor: "from-purple-400 to-fuchsia-500",
  },
];

/**
 * Time slots available for booking.
 */
export const TIME_SLOTS = [
  "08:00 AM – 09:00 AM",
  "09:00 AM – 10:00 AM",
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 01:00 PM",
  "02:00 PM – 03:00 PM",
  "03:00 PM – 04:00 PM",
  "04:00 PM – 05:00 PM",
  "05:00 PM – 06:00 PM",
  "06:00 PM – 07:00 PM",
];

/** Trust symbols used to replace the "Why Trust Us" stats section. */
export const TRUST_PILLARS = [
  {
    icon: "ShieldCheck",
    title: "Background-Verified Caregivers",
    description:
      "Every caregiver clears Aadhaar identity, address verification, police verification and a court-record check before being listed.",
    accent: "blue",
  },
  {
    icon: "Video",
    title: "Video Interview by Our Team",
    description:
      "We meet every caregiver on video before you do — assessing communication, demeanour and emergency-response readiness.",
    accent: "indigo",
  },
  {
    icon: "FileCheck",
    title: "Documents You Can See",
    description:
      "After booking, view your assigned caregiver's verified Aadhaar, police reference number, medical fitness and references.",
    accent: "rose",
  },
  {
    icon: "Headset",
    title: "Real Human Support",
    description:
      "A dedicated support line (Mon–Sat, 8 AM–10 PM) for any concern, with replacement guaranteed if a caregiver doesn't fit.",
    accent: "amber",
  },
  {
    icon: "Lock",
    title: "Your Data Stays Private",
    description:
      "Aadhaar and address documents are masked. Your prescriptions and family information are visible only to you and your caregiver.",
    accent: "emerald",
  },
  {
    icon: "Stethoscope",
    title: "Medically Trained, Not Just Hired",
    description:
      "Our attendants and nurses hold GNM / BSc nursing or equivalent certification and undergo refresher training every 6 months.",
    accent: "violet",
  },
] as const;
