/**
 * Mock Data for Development
 *
 * Comprehensive sample data for building and testing the UI.
 * Includes a clinic, practitioners, patients, appointments, and conditions.
 */

// =============================================================================
// TYPE DEFINITIONS (matching Prisma schema)
// =============================================================================

export type SubscriptionTier = 'BASIC' | 'PREMIUM'
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING'
export type PractitionerRole = 'OWNER' | 'ADMIN' | 'PRACTITIONER'
export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type ConditionStatus = 'ACTIVE' | 'IMPROVING' | 'WORSENING' | 'STABLE' | 'RESOLVED'
export type BiologicalSex = 'MALE' | 'FEMALE' | 'OTHER'
export type PointSide = 'BILATERAL' | 'LEFT' | 'RIGHT' | 'CENTER'
export type NeedlingTechnique = 'TONIFYING' | 'REDUCING' | 'EVEN'
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'WRITTEN_OFF'

// =============================================================================
// INTERFACES
// =============================================================================

export interface Clinic {
  id: string
  name: string
  phone: string
  email: string
  website?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zip: string
  taxId?: string
  bookingSlug: string
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
}

export interface Practitioner {
  id: string
  clinicId: string
  email: string
  firstName: string
  lastName: string
  credentials?: string
  npiNumber?: string
  licenseNumber?: string
  licenseState?: string
  role: PractitionerRole
  slug?: string
  isActive: boolean
}

export interface Patient {
  id: string
  clinicId: string
  firstName: string
  lastName: string
  preferredName?: string
  dateOfBirth: Date
  sex?: BiologicalSex
  email: string
  phone: string
  addressLine1?: string
  city?: string
  state?: string
  zip?: string
  insuranceCompany?: string
  insuranceMemberId?: string
  creditBalance: number
  isActive: boolean
}

export interface PatientCondition {
  id: string
  patientId: string
  name: string
  description?: string
  status: ConditionStatus
  priority?: number
  startedAt: Date
  resolvedAt?: Date
}

export interface ConditionMeasurement {
  id: string
  conditionId: string
  visitId?: string
  metricName: string
  value: string
  recordedAt: Date
}

export interface AppointmentType {
  id: string
  clinicId: string
  name: string
  durationMinutes: number
  description?: string
  color?: string
  isDefault: boolean
}

export interface Appointment {
  id: string
  clinicId: string
  practitionerId: string
  patientId: string
  appointmentTypeId: string
  scheduledStart: Date
  scheduledEnd: Date
  status: AppointmentStatus
  isLate: boolean
  isSigned: boolean
  checkedInAt?: Date
  startedAt?: Date
  needleInsertionAt?: Date
  needleRemovalAt?: Date
  completedAt?: Date
  treatmentDurationMinutes?: number
  usedEstim: boolean
  // Joined data for UI
  patient?: Patient
  practitioner?: Practitioner
  appointmentType?: AppointmentType
  conditions?: PatientCondition[]
}

export interface PatientNote {
  id: string
  patientId: string
  content: string
  isPinned: boolean
  isPrivate: boolean
  createdAt: Date
  createdBy?: string
}

// =============================================================================
// MOCK CLINIC
// =============================================================================

export const mockClinic: Clinic = {
  id: 'clinic_dev_001',
  name: 'Harmony Acupuncture & Wellness',
  phone: '(555) 123-4567',
  email: 'info@harmonyacu.com',
  website: 'https://harmonyacu.com',
  addressLine1: '123 Wellness Way',
  addressLine2: 'Suite 200',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  taxId: '12-3456789',
  bookingSlug: 'harmony-acupuncture',
  subscriptionTier: 'BASIC',
  subscriptionStatus: 'ACTIVE',
}

// =============================================================================
// MOCK PRACTITIONERS
// =============================================================================

export const mockPractitioners: Practitioner[] = [
  {
    id: 'pract_dev_001',
    clinicId: 'clinic_dev_001',
    email: 'dr.chen@harmonyacu.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    credentials: 'L.Ac., DAOM',
    npiNumber: '1234567890',
    licenseNumber: 'AC12345',
    licenseState: 'CA',
    role: 'OWNER',
    slug: 'dr-chen',
    isActive: true,
  },
  {
    id: 'pract_dev_002',
    clinicId: 'clinic_dev_001',
    email: 'mike.wong@harmonyacu.com',
    firstName: 'Michael',
    lastName: 'Wong',
    credentials: 'L.Ac.',
    npiNumber: '0987654321',
    licenseNumber: 'AC67890',
    licenseState: 'CA',
    role: 'PRACTITIONER',
    slug: 'mike-wong',
    isActive: true,
  },
]

// Current logged-in practitioner (for development)
export const currentPractitioner = mockPractitioners[0]

// =============================================================================
// MOCK APPOINTMENT TYPES
// =============================================================================

export const mockAppointmentTypes: AppointmentType[] = [
  {
    id: 'appt_type_001',
    clinicId: 'clinic_dev_001',
    name: 'Initial Consultation',
    durationMinutes: 90,
    description: 'New patient intake, health history review, and first treatment',
    color: '#6366f1', // Indigo
    isDefault: true,
  },
  {
    id: 'appt_type_002',
    clinicId: 'clinic_dev_001',
    name: 'Follow-up Treatment',
    durationMinutes: 60,
    description: 'Returning patient treatment session',
    color: '#10b981', // Emerald
    isDefault: true,
  },
  {
    id: 'appt_type_003',
    clinicId: 'clinic_dev_001',
    name: 'Brief Follow-up',
    durationMinutes: 30,
    description: 'Quick check-in or maintenance treatment',
    color: '#f59e0b', // Amber
    isDefault: false,
  },
]

// =============================================================================
// MOCK PATIENTS
// =============================================================================

export const mockPatients: Patient[] = [
  {
    id: 'patient_001',
    clinicId: 'clinic_dev_001',
    firstName: 'Emily',
    lastName: 'Johnson',
    preferredName: 'Em',
    dateOfBirth: new Date('1985-03-15'),
    sex: 'FEMALE',
    email: 'emily.johnson@email.com',
    phone: '(555) 234-5678',
    addressLine1: '456 Oak Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94103',
    insuranceCompany: 'Blue Shield',
    insuranceMemberId: 'BSC123456',
    creditBalance: 0,
    isActive: true,
  },
  {
    id: 'patient_002',
    clinicId: 'clinic_dev_001',
    firstName: 'Robert',
    lastName: 'Martinez',
    dateOfBirth: new Date('1972-08-22'),
    sex: 'MALE',
    email: 'robert.martinez@email.com',
    phone: '(555) 345-6789',
    addressLine1: '789 Pine Avenue',
    city: 'Oakland',
    state: 'CA',
    zip: '94612',
    insuranceCompany: 'Aetna',
    insuranceMemberId: 'AET789012',
    creditBalance: 3, // Has package credits
    isActive: true,
  },
  {
    id: 'patient_003',
    clinicId: 'clinic_dev_001',
    firstName: 'Jennifer',
    lastName: 'Lee',
    preferredName: 'Jen',
    dateOfBirth: new Date('1990-11-08'),
    sex: 'FEMALE',
    email: 'jennifer.lee@email.com',
    phone: '(555) 456-7890',
    addressLine1: '321 Cedar Lane',
    city: 'Berkeley',
    state: 'CA',
    zip: '94704',
    creditBalance: 0,
    isActive: true,
  },
  {
    id: 'patient_004',
    clinicId: 'clinic_dev_001',
    firstName: 'David',
    lastName: 'Kim',
    dateOfBirth: new Date('1968-05-30'),
    sex: 'MALE',
    email: 'david.kim@email.com',
    phone: '(555) 567-8901',
    addressLine1: '654 Maple Drive',
    city: 'San Francisco',
    state: 'CA',
    zip: '94110',
    insuranceCompany: 'United Healthcare',
    insuranceMemberId: 'UHC456789',
    creditBalance: 0,
    isActive: true,
  },
  {
    id: 'patient_005',
    clinicId: 'clinic_dev_001',
    firstName: 'Maria',
    lastName: 'Garcia',
    dateOfBirth: new Date('1995-01-20'),
    sex: 'FEMALE',
    email: 'maria.garcia@email.com',
    phone: '(555) 678-9012',
    addressLine1: '987 Birch Court',
    city: 'San Francisco',
    state: 'CA',
    zip: '94107',
    creditBalance: 5,
    isActive: true,
  },
  {
    id: 'patient_006',
    clinicId: 'clinic_dev_001',
    firstName: 'James',
    lastName: 'Thompson',
    dateOfBirth: new Date('1980-07-12'),
    sex: 'MALE',
    email: 'james.thompson@email.com',
    phone: '(555) 789-0123',
    addressLine1: '147 Elm Street',
    city: 'Daly City',
    state: 'CA',
    zip: '94014',
    insuranceCompany: 'Kaiser',
    insuranceMemberId: 'KP987654',
    creditBalance: 0,
    isActive: true,
  },
  {
    id: 'patient_007',
    clinicId: 'clinic_dev_001',
    firstName: 'Susan',
    lastName: 'Brown',
    preferredName: 'Sue',
    dateOfBirth: new Date('1975-12-03'),
    sex: 'FEMALE',
    email: 'susan.brown@email.com',
    phone: '(555) 890-1234',
    city: 'San Francisco',
    state: 'CA',
    zip: '94115',
    creditBalance: 0,
    isActive: true,
  },
  {
    id: 'patient_008',
    clinicId: 'clinic_dev_001',
    firstName: 'William',
    lastName: 'Davis',
    preferredName: 'Bill',
    dateOfBirth: new Date('1962-09-18'),
    sex: 'MALE',
    email: 'william.davis@email.com',
    phone: '(555) 901-2345',
    addressLine1: '258 Walnut Blvd',
    city: 'San Francisco',
    state: 'CA',
    zip: '94118',
    insuranceCompany: 'Medicare',
    insuranceMemberId: 'MED123456789',
    creditBalance: 0,
    isActive: true,
  },
]

// =============================================================================
// MOCK PATIENT CONDITIONS
// =============================================================================

export const mockConditions: PatientCondition[] = [
  // Emily Johnson's conditions
  {
    id: 'cond_001',
    patientId: 'patient_001',
    name: 'Low back pain',
    description: 'Chronic L4-L5 disc herniation, worse with sitting',
    status: 'IMPROVING',
    priority: 1,
    startedAt: new Date('2024-06-15'),
  },
  {
    id: 'cond_002',
    patientId: 'patient_001',
    name: 'Stress/anxiety',
    description: 'Work-related stress affecting sleep',
    status: 'ACTIVE',
    priority: 2,
    startedAt: new Date('2024-09-01'),
  },

  // Robert Martinez's conditions
  {
    id: 'cond_003',
    patientId: 'patient_002',
    name: 'Knee pain (right)',
    description: 'Osteoarthritis, medial compartment',
    status: 'STABLE',
    priority: 1,
    startedAt: new Date('2024-03-10'),
  },
  {
    id: 'cond_004',
    patientId: 'patient_002',
    name: 'Hypertension',
    description: 'Managed with medication, acupuncture for support',
    status: 'STABLE',
    priority: 2,
    startedAt: new Date('2024-01-20'),
  },

  // Jennifer Lee's conditions
  {
    id: 'cond_005',
    patientId: 'patient_003',
    name: 'Migraine headaches',
    description: 'Hormonal migraines, 2-3x per month',
    status: 'IMPROVING',
    priority: 1,
    startedAt: new Date('2024-08-05'),
  },
  {
    id: 'cond_006',
    patientId: 'patient_003',
    name: 'Neck tension',
    description: 'Computer work related, bilateral trapezius',
    status: 'ACTIVE',
    priority: 2,
    startedAt: new Date('2024-10-01'),
  },

  // David Kim's conditions
  {
    id: 'cond_007',
    patientId: 'patient_004',
    name: 'Insomnia',
    description: 'Difficulty falling asleep, early waking',
    status: 'IMPROVING',
    priority: 1,
    startedAt: new Date('2024-07-22'),
  },
  {
    id: 'cond_008',
    patientId: 'patient_004',
    name: 'Tinnitus',
    description: 'Bilateral high-pitched ringing, worse with stress',
    status: 'ACTIVE',
    priority: 2,
    startedAt: new Date('2024-05-15'),
  },

  // Maria Garcia's conditions
  {
    id: 'cond_009',
    patientId: 'patient_005',
    name: 'Dysmenorrhea',
    description: 'Painful periods with cramping, days 1-2',
    status: 'IMPROVING',
    priority: 1,
    startedAt: new Date('2024-04-10'),
  },

  // James Thompson's conditions
  {
    id: 'cond_010',
    patientId: 'patient_006',
    name: 'Shoulder pain (left)',
    description: 'Rotator cuff tendinitis, limited ROM',
    status: 'ACTIVE',
    priority: 1,
    startedAt: new Date('2024-11-01'),
  },

  // Susan Brown's conditions
  {
    id: 'cond_011',
    patientId: 'patient_007',
    name: 'Digestive issues',
    description: 'IBS-C, bloating, irregular bowel movements',
    status: 'IMPROVING',
    priority: 1,
    startedAt: new Date('2024-09-15'),
  },
  {
    id: 'cond_012',
    patientId: 'patient_007',
    name: 'Fatigue',
    description: 'Low energy, especially afternoon',
    status: 'ACTIVE',
    priority: 2,
    startedAt: new Date('2024-10-20'),
  },

  // William Davis's conditions
  {
    id: 'cond_013',
    patientId: 'patient_008',
    name: 'Sciatica (right)',
    description: 'Radiating pain from hip to calf',
    status: 'WORSENING',
    priority: 1,
    startedAt: new Date('2024-10-05'),
  },
]

// =============================================================================
// MOCK CONDITION MEASUREMENTS (VAS scores)
// =============================================================================

export const mockMeasurements: ConditionMeasurement[] = [
  // Emily's LBP measurements (improving trend)
  { id: 'meas_001', conditionId: 'cond_001', metricName: 'pain_score', value: '8', recordedAt: new Date('2024-06-15') },
  { id: 'meas_002', conditionId: 'cond_001', metricName: 'pain_score', value: '7', recordedAt: new Date('2024-07-01') },
  { id: 'meas_003', conditionId: 'cond_001', metricName: 'pain_score', value: '6', recordedAt: new Date('2024-08-15') },
  { id: 'meas_004', conditionId: 'cond_001', metricName: 'pain_score', value: '5', recordedAt: new Date('2024-10-01') },
  { id: 'meas_005', conditionId: 'cond_001', metricName: 'pain_score', value: '4', recordedAt: new Date('2024-11-15') },

  // Jennifer's migraine measurements
  { id: 'meas_006', conditionId: 'cond_005', metricName: 'pain_score', value: '9', recordedAt: new Date('2024-08-05') },
  { id: 'meas_007', conditionId: 'cond_005', metricName: 'pain_score', value: '7', recordedAt: new Date('2024-09-10') },
  { id: 'meas_008', conditionId: 'cond_005', metricName: 'pain_score', value: '5', recordedAt: new Date('2024-10-20') },
  { id: 'meas_009', conditionId: 'cond_005', metricName: 'frequency', value: '2', recordedAt: new Date('2024-11-01') },

  // David's insomnia measurements
  { id: 'meas_010', conditionId: 'cond_007', metricName: 'sleep_quality', value: '3', recordedAt: new Date('2024-07-22') },
  { id: 'meas_011', conditionId: 'cond_007', metricName: 'sleep_quality', value: '5', recordedAt: new Date('2024-09-01') },
  { id: 'meas_012', conditionId: 'cond_007', metricName: 'sleep_quality', value: '6', recordedAt: new Date('2024-11-01') },

  // William's sciatica measurements (worsening)
  { id: 'meas_013', conditionId: 'cond_013', metricName: 'pain_score', value: '5', recordedAt: new Date('2024-10-05') },
  { id: 'meas_014', conditionId: 'cond_013', metricName: 'pain_score', value: '6', recordedAt: new Date('2024-10-20') },
  { id: 'meas_015', conditionId: 'cond_013', metricName: 'pain_score', value: '7', recordedAt: new Date('2024-11-10') },
]

// =============================================================================
// MOCK PATIENT NOTES (CRM)
// =============================================================================

export const mockPatientNotes: PatientNote[] = [
  {
    id: 'note_001',
    patientId: 'patient_001',
    content: 'Prefers afternoon appointments due to work schedule',
    isPinned: true,
    isPrivate: false,
    createdAt: new Date('2024-06-15'),
    createdBy: 'pract_dev_001',
  },
  {
    id: 'note_002',
    patientId: 'patient_001',
    content: 'Daughter getting married in March - excited!',
    isPinned: false,
    isPrivate: false,
    createdAt: new Date('2024-11-01'),
    createdBy: 'pract_dev_001',
  },
  {
    id: 'note_003',
    patientId: 'patient_002',
    content: 'Needle-sensitive - use thinner gauge (0.20mm)',
    isPinned: true,
    isPrivate: false,
    createdAt: new Date('2024-03-10'),
    createdBy: 'pract_dev_001',
  },
  {
    id: 'note_004',
    patientId: 'patient_003',
    content: 'Works at Google, very busy schedule',
    isPinned: false,
    isPrivate: false,
    createdAt: new Date('2024-08-05'),
    createdBy: 'pract_dev_001',
  },
  {
    id: 'note_005',
    patientId: 'patient_006',
    content: 'Former college baseball pitcher - relevant to shoulder issue',
    isPinned: true,
    isPrivate: false,
    createdAt: new Date('2024-11-01'),
    createdBy: 'pract_dev_001',
  },
  {
    id: 'note_006',
    patientId: 'patient_008',
    content: 'Retired teacher, loves gardening - aggravates his back',
    isPinned: false,
    isPrivate: false,
    createdAt: new Date('2024-10-05'),
    createdBy: 'pract_dev_001',
  },
]

// =============================================================================
// HELPER: Generate today's appointments
// =============================================================================

function getTodayAt(hours: number, minutes: number = 0): Date {
  const today = new Date()
  today.setHours(hours, minutes, 0, 0)
  return today
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

// =============================================================================
// MOCK APPOINTMENTS (for today)
// =============================================================================

export const mockAppointments: Appointment[] = [
  // COMPLETED - Early morning (already done, signed)
  {
    id: 'appt_001',
    clinicId: 'clinic_dev_001',
    practitionerId: 'pract_dev_001',
    patientId: 'patient_002',
    appointmentTypeId: 'appt_type_002',
    scheduledStart: getTodayAt(9, 0),
    scheduledEnd: getTodayAt(10, 0),
    status: 'COMPLETED',
    isLate: false,
    isSigned: true,
    checkedInAt: getTodayAt(8, 55),
    startedAt: getTodayAt(9, 5),
    needleInsertionAt: getTodayAt(9, 15),
    needleRemovalAt: getTodayAt(9, 45),
    completedAt: getTodayAt(9, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
  },

  // COMPLETED - unsigned (needs signature)
  {
    id: 'appt_002',
    clinicId: 'clinic_dev_001',
    practitionerId: 'pract_dev_001',
    patientId: 'patient_007',
    appointmentTypeId: 'appt_type_002',
    scheduledStart: getTodayAt(10, 0),
    scheduledEnd: getTodayAt(11, 0),
    status: 'COMPLETED',
    isLate: false,
    isSigned: false, // Unsigned!
    checkedInAt: getTodayAt(9, 50),
    startedAt: getTodayAt(10, 0),
    needleInsertionAt: getTodayAt(10, 10),
    needleRemovalAt: getTodayAt(10, 40),
    completedAt: getTodayAt(10, 50),
    treatmentDurationMinutes: 30,
    usedEstim: true,
  },

  // IN_PROGRESS - Currently treating
  {
    id: 'appt_003',
    clinicId: 'clinic_dev_001',
    practitionerId: 'pract_dev_001',
    patientId: 'patient_001',
    appointmentTypeId: 'appt_type_002',
    scheduledStart: getTodayAt(11, 0),
    scheduledEnd: getTodayAt(12, 0),
    status: 'IN_PROGRESS',
    isLate: false,
    isSigned: false,
    checkedInAt: getTodayAt(10, 55),
    startedAt: getTodayAt(11, 0),
    needleInsertionAt: getTodayAt(11, 10),
    usedEstim: false,
  },

  // CHECKED_IN - Waiting
  {
    id: 'appt_004',
    clinicId: 'clinic_dev_001',
    practitionerId: 'pract_dev_001',
    patientId: 'patient_003',
    appointmentTypeId: 'appt_type_002',
    scheduledStart: getTodayAt(12, 0),
    scheduledEnd: getTodayAt(13, 0),
    status: 'CHECKED_IN',
    isLate: false,
    isSigned: false,
    checkedInAt: getTodayAt(11, 45),
    usedEstim: false,
  },

  // SCHEDULED - Upcoming appointments
  {
    id: 'appt_005',
    clinicId: 'clinic_dev_001',
    practitionerId: 'pract_dev_001',
    patientId: 'patient_004',
    appointmentTypeId: 'appt_type_002',
    scheduledStart: getTodayAt(13, 30),
    scheduledEnd: getTodayAt(14, 30),
    status: 'SCHEDULED',
    isLate: false,
    isSigned: false,
    usedEstim: false,
  },
  {
    id: 'appt_006',
    clinicId: 'clinic_dev_001',
    practitionerId: 'pract_dev_001',
    patientId: 'patient_005',
    appointmentTypeId: 'appt_type_003', // Brief follow-up
    scheduledStart: getTodayAt(14, 30),
    scheduledEnd: getTodayAt(15, 0),
    status: 'SCHEDULED',
    isLate: false,
    isSigned: false,
    usedEstim: false,
  },
  {
    id: 'appt_007',
    clinicId: 'clinic_dev_001',
    practitionerId: 'pract_dev_001',
    patientId: 'patient_006',
    appointmentTypeId: 'appt_type_001', // Initial consultation (new patient)
    scheduledStart: getTodayAt(15, 0),
    scheduledEnd: getTodayAt(16, 30),
    status: 'SCHEDULED',
    isLate: false,
    isSigned: false,
    usedEstim: false,
  },
  {
    id: 'appt_008',
    clinicId: 'clinic_dev_001',
    practitionerId: 'pract_dev_001',
    patientId: 'patient_008',
    appointmentTypeId: 'appt_type_002',
    scheduledStart: getTodayAt(16, 30),
    scheduledEnd: getTodayAt(17, 30),
    status: 'SCHEDULED',
    isLate: false,
    isSigned: false,
    usedEstim: false,
  },

  // CANCELLED - one cancellation
  {
    id: 'appt_009',
    clinicId: 'clinic_dev_001',
    practitionerId: 'pract_dev_001',
    patientId: 'patient_005',
    appointmentTypeId: 'appt_type_002',
    scheduledStart: getTodayAt(8, 0),
    scheduledEnd: getTodayAt(9, 0),
    status: 'CANCELLED',
    isLate: false,
    isSigned: false,
    usedEstim: false,
  },
]

// =============================================================================
// ENRICHED APPOINTMENTS (with joined data for UI)
// =============================================================================

export function getEnrichedAppointments(): Appointment[] {
  return mockAppointments.map((appt) => ({
    ...appt,
    patient: mockPatients.find((p) => p.id === appt.patientId),
    practitioner: mockPractitioners.find((pr) => pr.id === appt.practitionerId),
    appointmentType: mockAppointmentTypes.find((at) => at.id === appt.appointmentTypeId),
    conditions: mockConditions.filter((c) => c.patientId === appt.patientId),
  }))
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get appointments grouped by status for the Today screen
 */
export function getAppointmentsByStatus() {
  const enriched = getEnrichedAppointments()

  return {
    inProgress: enriched.filter((a) => a.status === 'IN_PROGRESS'),
    checkedIn: enriched.filter((a) => a.status === 'CHECKED_IN'),
    scheduled: enriched.filter((a) => a.status === 'SCHEDULED'),
    unsigned: enriched.filter((a) => a.status === 'COMPLETED' && !a.isSigned),
    completed: enriched.filter((a) => a.status === 'COMPLETED' && a.isSigned),
    cancelled: enriched.filter((a) => a.status === 'CANCELLED' || a.status === 'NO_SHOW'),
  }
}

/**
 * Get patient's conditions with latest measurements
 */
export function getPatientConditionsWithMeasurements(patientId: string) {
  const conditions = mockConditions.filter((c) => c.patientId === patientId)

  return conditions.map((condition) => {
    const measurements = mockMeasurements
      .filter((m) => m.conditionId === condition.id)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())

    const latestMeasurement = measurements[0]

    return {
      ...condition,
      measurements,
      latestMeasurement,
    }
  })
}

/**
 * Get patient's pinned notes
 */
export function getPatientPinnedNotes(patientId: string) {
  return mockPatientNotes.filter((n) => n.patientId === patientId && n.isPinned)
}

/**
 * Search patients by name, phone, or email
 */
export function searchPatients(query: string): Patient[] {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return []

  return mockPatients.filter((patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase()
    const preferredFullName = patient.preferredName
      ? `${patient.preferredName} ${patient.lastName}`.toLowerCase()
      : ''
    const phone = patient.phone.replace(/\D/g, '') // Remove non-digits
    const queryDigits = lowerQuery.replace(/\D/g, '')

    return (
      fullName.includes(lowerQuery) ||
      preferredFullName.includes(lowerQuery) ||
      patient.email.toLowerCase().includes(lowerQuery) ||
      (queryDigits && phone.includes(queryDigits))
    )
  })
}

/**
 * Get appointments for a specific date
 */
export function getAppointmentsForDate(date: Date): Appointment[] {
  const enriched = getEnrichedAppointments()
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  return enriched.filter((appt) => {
    const apptDate = new Date(appt.scheduledStart)
    apptDate.setHours(0, 0, 0, 0)
    return apptDate.getTime() === targetDate.getTime()
  })
}

/**
 * Calculate patient age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = today.getMonth() - dateOfBirth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--
  }

  return age
}

/**
 * Format patient display name
 */
export function getPatientDisplayName(patient: Patient): string {
  if (patient.preferredName) {
    return `${patient.preferredName} ${patient.lastName}`
  }
  return `${patient.firstName} ${patient.lastName}`
}

/**
 * Get status display info (color, label)
 */
export function getStatusDisplay(status: AppointmentStatus, isSigned?: boolean) {
  if (status === 'COMPLETED' && !isSigned) {
    return { label: 'Unsigned', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-700' }
  }

  const statusMap: Record<AppointmentStatus, { label: string; color: string; bgColor: string; textColor: string }> = {
    IN_PROGRESS: { label: 'In Progress', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    CHECKED_IN: { label: 'Checked In', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    SCHEDULED: { label: 'Scheduled', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
    COMPLETED: { label: 'Completed', color: 'slate', bgColor: 'bg-slate-100', textColor: 'text-slate-600' },
    CANCELLED: { label: 'Cancelled', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    NO_SHOW: { label: 'No Show', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  }

  return statusMap[status]
}

/**
 * Get condition status display info
 */
export function getConditionStatusDisplay(status: ConditionStatus) {
  const statusMap: Record<ConditionStatus, { label: string; color: string; bgColor: string; textColor: string }> = {
    ACTIVE: { label: 'Active', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    IMPROVING: { label: 'Improving', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    WORSENING: { label: 'Worsening', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    STABLE: { label: 'Stable', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
    RESOLVED: { label: 'Resolved', color: 'slate', bgColor: 'bg-slate-100', textColor: 'text-slate-500' },
  }

  return statusMap[status]
}
