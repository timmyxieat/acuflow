/**
 * Mock Data for Development
 *
 * Comprehensive sample data for building and testing the UI.
 * Uses Prisma-generated types to ensure type safety.
 */

// Import types from Prisma (browser-safe exports)
import type {
  Clinic,
  Practitioner,
  Patient,
  PatientCondition,
  ConditionMeasurement,
  AppointmentType,
  Appointment,
  PatientNote,
  Visit,
} from "@/generated/prisma/browser";

// Import enums from Prisma
import {
  SubscriptionTier,
  SubscriptionStatus,
  PractitionerRole,
  AppointmentStatus,
  ConditionStatus,
  BiologicalSex,
  MeasurementSource,
} from "@/generated/prisma/browser";

// Re-export types and enums for convenience
export type {
  Clinic,
  Practitioner,
  Patient,
  PatientCondition,
  ConditionMeasurement,
  AppointmentType,
  Appointment,
  PatientNote,
  Visit,
};

export {
  SubscriptionTier,
  SubscriptionStatus,
  PractitionerRole,
  AppointmentStatus,
  ConditionStatus,
  BiologicalSex,
  MeasurementSource,
};

// =============================================================================
// EXTENDED TYPES (for UI with joined data)
// =============================================================================

/**
 * Appointment with related entities loaded for UI display
 */
export interface AppointmentWithRelations extends Appointment {
  patient?: Patient;
  practitioner?: Practitioner;
  appointmentType?: AppointmentType;
  conditions?: PatientCondition[];
}

/**
 * Visit with related appointment data for timeline display
 */
export interface VisitWithAppointment extends Visit {
  appointment?: Appointment & {
    appointmentType?: AppointmentType;
  };
  chiefComplaint?: string; // Extracted from conditions for display
}

// =============================================================================
// MOCK CLINIC
// =============================================================================

export const mockClinic: Clinic = {
  id: "clinic_dev_001",
  name: "Harmony Acupuncture & Wellness",
  phone: "(555) 123-4567",
  email: "info@harmonyacu.com",
  website: "https://harmonyacu.com",
  addressLine1: "123 Wellness Way",
  addressLine2: "Suite 200",
  city: "San Francisco",
  state: "CA",
  zip: "94102",
  taxId: "12-3456789",
  bookingSlug: "harmony-acupuncture",
  subscriptionTier: SubscriptionTier.BASIC,
  subscriptionStatus: SubscriptionStatus.ACTIVE,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// =============================================================================
// MOCK PRACTITIONERS
// =============================================================================

export const mockPractitioners: Practitioner[] = [
  {
    id: "pract_dev_001",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    email: "dr.chen@harmonyacu.com",
    firstName: "Sarah",
    lastName: "Chen",
    credentials: "L.Ac., DAOM",
    npiNumber: "1234567890",
    licenseNumber: "AC12345",
    licenseState: "CA",
    role: PractitionerRole.OWNER,
    slug: "dr-chen",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "pract_dev_002",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    email: "mike.wong@harmonyacu.com",
    firstName: "Michael",
    lastName: "Wong",
    credentials: "L.Ac.",
    npiNumber: "0987654321",
    licenseNumber: "AC67890",
    licenseState: "CA",
    role: PractitionerRole.PRACTITIONER,
    slug: "mike-wong",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Current logged-in practitioner (for development)
export const currentPractitioner = mockPractitioners[0];

// =============================================================================
// MOCK APPOINTMENT TYPES
// =============================================================================

export const mockAppointmentTypes: AppointmentType[] = [
  {
    id: "appt_type_001",
    clinicId: "clinic_dev_001",
    name: "Initial Consultation",
    durationMinutes: 90,
    description:
      "New patient intake, health history review, and first treatment",
    color: "#6366f1", // Indigo
    icon: "clipboard-list", // Lucide icon name
    isDefault: true,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "appt_type_002",
    clinicId: "clinic_dev_001",
    name: "Follow-up Treatment",
    durationMinutes: 60,
    description: "Returning patient treatment session",
    color: "#10b981", // Emerald
    icon: "repeat", // Lucide icon name
    isDefault: true,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "appt_type_003",
    clinicId: "clinic_dev_001",
    name: "Brief Follow-up",
    durationMinutes: 30,
    description: "Quick check-in or maintenance treatment",
    color: "#f59e0b", // Amber
    icon: "clock", // Lucide icon name
    isDefault: false,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// =============================================================================
// MOCK PATIENTS
// =============================================================================

export const mockPatients: Patient[] = [
  {
    id: "patient_001",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "Emily",
    lastName: "Johnson",
    preferredName: "Em",
    dateOfBirth: new Date("1985-03-15"),
    sex: BiologicalSex.FEMALE,
    email: "emily.johnson@email.com",
    phone: "(555) 234-5678",
    addressLine1: "456 Oak Street",
    addressLine2: null,
    city: "San Francisco",
    state: "CA",
    zip: "94103",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: "Blue Shield",
    insuranceMemberId: "BSC123456",
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 0,
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "patient_002",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "Robert",
    lastName: "Martinez",
    preferredName: null,
    dateOfBirth: new Date("1972-08-22"),
    sex: BiologicalSex.MALE,
    email: "robert.martinez@email.com",
    phone: "(555) 345-6789",
    addressLine1: "789 Pine Avenue",
    addressLine2: null,
    city: "Oakland",
    state: "CA",
    zip: "94612",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: "Aetna",
    insuranceMemberId: "AET789012",
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 3, // Has package credits
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: "patient_003",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "Jennifer",
    lastName: "Lee",
    preferredName: "Jen",
    dateOfBirth: new Date("1990-11-08"),
    sex: BiologicalSex.FEMALE,
    email: "jennifer.lee@email.com",
    phone: "(555) 456-7890",
    addressLine1: "321 Cedar Lane",
    addressLine2: null,
    city: "Berkeley",
    state: "CA",
    zip: "94704",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: null,
    insuranceMemberId: null,
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 0,
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-08-01"),
    updatedAt: new Date("2024-08-01"),
  },
  {
    id: "patient_004",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "David",
    lastName: "Kim",
    preferredName: null,
    dateOfBirth: new Date("1968-05-30"),
    sex: BiologicalSex.MALE,
    email: "david.kim@email.com",
    phone: "(555) 567-8901",
    addressLine1: "654 Maple Drive",
    addressLine2: null,
    city: "San Francisco",
    state: "CA",
    zip: "94110",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: "United Healthcare",
    insuranceMemberId: "UHC456789",
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 0,
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-07-01"),
    updatedAt: new Date("2024-07-01"),
  },
  {
    id: "patient_005",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "Maria",
    lastName: "Garcia",
    preferredName: null,
    dateOfBirth: new Date("1995-01-20"),
    sex: BiologicalSex.FEMALE,
    email: "maria.garcia@email.com",
    phone: "(555) 678-9012",
    addressLine1: "987 Birch Court",
    addressLine2: null,
    city: "San Francisco",
    state: "CA",
    zip: "94107",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: null,
    insuranceMemberId: null,
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 5,
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-04-01"),
  },
  {
    id: "patient_006",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "James",
    lastName: "Thompson",
    preferredName: null,
    dateOfBirth: new Date("1980-07-12"),
    sex: BiologicalSex.MALE,
    email: "james.thompson@email.com",
    phone: "(555) 789-0123",
    addressLine1: "147 Elm Street",
    addressLine2: null,
    city: "Daly City",
    state: "CA",
    zip: "94014",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: "Kaiser",
    insuranceMemberId: "KP987654",
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 0,
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-11-01"),
    updatedAt: new Date("2024-11-01"),
  },
  {
    id: "patient_007",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "Susan",
    lastName: "Brown",
    preferredName: "Sue",
    dateOfBirth: new Date("1975-12-03"),
    sex: BiologicalSex.FEMALE,
    email: "susan.brown@email.com",
    phone: "(555) 890-1234",
    addressLine1: null,
    addressLine2: null,
    city: "San Francisco",
    state: "CA",
    zip: "94115",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: null,
    insuranceMemberId: null,
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 0,
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-09-01"),
    updatedAt: new Date("2024-09-01"),
  },
  {
    id: "patient_008",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "William",
    lastName: "Davis",
    preferredName: "Bill",
    dateOfBirth: new Date("1962-09-18"),
    sex: BiologicalSex.MALE,
    email: "william.davis@email.com",
    phone: "(555) 901-2345",
    addressLine1: "258 Walnut Blvd",
    addressLine2: null,
    city: "San Francisco",
    state: "CA",
    zip: "94118",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: "Medicare",
    insuranceMemberId: "MED123456789",
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 0,
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-10-01"),
    updatedAt: new Date("2024-10-01"),
  },
  {
    id: "patient_009",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "Lisa",
    lastName: "Anderson",
    preferredName: null,
    dateOfBirth: new Date("1978-04-25"),
    sex: BiologicalSex.FEMALE,
    email: "lisa.anderson@email.com",
    phone: "(555) 012-3456",
    addressLine1: "369 Spruce Avenue",
    addressLine2: null,
    city: "San Francisco",
    state: "CA",
    zip: "94122",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: "Cigna",
    insuranceMemberId: "CIG789012",
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 0,
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-05-01"),
    updatedAt: new Date("2024-05-01"),
  },
  {
    id: "patient_010",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    firstName: "Michael",
    lastName: "Taylor",
    preferredName: "Mike",
    dateOfBirth: new Date("1988-11-12"),
    sex: BiologicalSex.MALE,
    email: "michael.taylor@email.com",
    phone: "(555) 234-5670",
    addressLine1: "741 Redwood Lane",
    addressLine2: null,
    city: "Oakland",
    state: "CA",
    zip: "94610",
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    stripeCustomerId: null,
    insuranceCompany: null,
    insuranceMemberId: null,
    insuranceGroupNumber: null,
    insurancePhone: null,
    creditBalance: 2,
    pastMedicalHistory: null,
    familyHistory: null,
    socialHistory: null,
    medications: null,
    allergies: null,
    emotionalStatus: null,
    tcmReviewOfSystems: null,
    isActive: true,
    createdAt: new Date("2024-08-15"),
    updatedAt: new Date("2024-08-15"),
  },
];

// =============================================================================
// MOCK PATIENT CONDITIONS
// =============================================================================

export const mockConditions: PatientCondition[] = [
  // Emily Johnson's conditions
  {
    id: "cond_001",
    patientId: "patient_001",
    name: "Low back pain",
    description: "Chronic L4-L5 disc herniation, worse with sitting",
    status: ConditionStatus.IMPROVING,
    priority: 1,
    startedAt: new Date("2024-06-15"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-06-15"),
    updatedAt: new Date("2024-06-15"),
  },
  {
    id: "cond_002",
    patientId: "patient_001",
    name: "Stress/anxiety",
    description: "Work-related stress affecting sleep",
    status: ConditionStatus.ACTIVE,
    priority: 2,
    startedAt: new Date("2024-09-01"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-09-01"),
    updatedAt: new Date("2024-09-01"),
  },

  // Robert Martinez's conditions
  {
    id: "cond_003",
    patientId: "patient_002",
    name: "Knee pain (right)",
    description: "Osteoarthritis, medial compartment",
    status: ConditionStatus.STABLE,
    priority: 1,
    startedAt: new Date("2024-03-10"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-10"),
  },
  {
    id: "cond_004",
    patientId: "patient_002",
    name: "Hypertension",
    description: "Managed with medication, acupuncture for support",
    status: ConditionStatus.STABLE,
    priority: 2,
    startedAt: new Date("2024-01-20"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },

  // Jennifer Lee's conditions
  {
    id: "cond_005",
    patientId: "patient_003",
    name: "Migraine headaches",
    description: "Hormonal migraines, 2-3x per month",
    status: ConditionStatus.IMPROVING,
    priority: 1,
    startedAt: new Date("2024-08-05"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-08-05"),
    updatedAt: new Date("2024-08-05"),
  },
  {
    id: "cond_006",
    patientId: "patient_003",
    name: "Neck tension",
    description: "Computer work related, bilateral trapezius",
    status: ConditionStatus.ACTIVE,
    priority: 2,
    startedAt: new Date("2024-10-01"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-10-01"),
    updatedAt: new Date("2024-10-01"),
  },

  // David Kim's conditions
  {
    id: "cond_007",
    patientId: "patient_004",
    name: "Insomnia",
    description: "Difficulty falling asleep, early waking",
    status: ConditionStatus.IMPROVING,
    priority: 1,
    startedAt: new Date("2024-07-22"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-07-22"),
    updatedAt: new Date("2024-07-22"),
  },
  {
    id: "cond_008",
    patientId: "patient_004",
    name: "Tinnitus",
    description: "Bilateral high-pitched ringing, worse with stress",
    status: ConditionStatus.ACTIVE,
    priority: 2,
    startedAt: new Date("2024-05-15"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-05-15"),
  },

  // Maria Garcia's conditions
  {
    id: "cond_009",
    patientId: "patient_005",
    name: "Dysmenorrhea",
    description: "Painful periods with cramping, days 1-2",
    status: ConditionStatus.IMPROVING,
    priority: 1,
    startedAt: new Date("2024-04-10"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-04-10"),
    updatedAt: new Date("2024-04-10"),
  },

  // James Thompson's conditions
  {
    id: "cond_010",
    patientId: "patient_006",
    name: "Shoulder pain (left)",
    description: "Rotator cuff tendinitis, limited ROM",
    status: ConditionStatus.ACTIVE,
    priority: 1,
    startedAt: new Date("2024-11-01"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-11-01"),
    updatedAt: new Date("2024-11-01"),
  },

  // Susan Brown's conditions
  {
    id: "cond_011",
    patientId: "patient_007",
    name: "Digestive issues",
    description: "IBS-C, bloating, irregular bowel movements",
    status: ConditionStatus.IMPROVING,
    priority: 1,
    startedAt: new Date("2024-09-15"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-09-15"),
    updatedAt: new Date("2024-09-15"),
  },
  {
    id: "cond_012",
    patientId: "patient_007",
    name: "Fatigue",
    description: "Low energy, especially afternoon",
    status: ConditionStatus.ACTIVE,
    priority: 2,
    startedAt: new Date("2024-10-20"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-10-20"),
    updatedAt: new Date("2024-10-20"),
  },

  // William Davis's conditions
  {
    id: "cond_013",
    patientId: "patient_008",
    name: "Sciatica (right)",
    description: "Radiating pain from hip to calf",
    status: ConditionStatus.WORSENING,
    priority: 1,
    startedAt: new Date("2024-10-05"),
    resolvedAt: null,
    trackedMetrics: null,
    createdAt: new Date("2024-10-05"),
    updatedAt: new Date("2024-10-05"),
  },
];

// =============================================================================
// MOCK CONDITION MEASUREMENTS (VAS scores)
// =============================================================================

export const mockMeasurements: ConditionMeasurement[] = [
  // Emily's LBP measurements (improving trend)
  {
    id: "meas_001",
    conditionId: "cond_001",
    visitId: null,
    metricName: "pain_score",
    value: "8",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-06-15"),
  },
  {
    id: "meas_002",
    conditionId: "cond_001",
    visitId: null,
    metricName: "pain_score",
    value: "7",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-07-01"),
  },
  {
    id: "meas_003",
    conditionId: "cond_001",
    visitId: null,
    metricName: "pain_score",
    value: "6",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-08-15"),
  },
  {
    id: "meas_004",
    conditionId: "cond_001",
    visitId: null,
    metricName: "pain_score",
    value: "5",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-10-01"),
  },
  {
    id: "meas_005",
    conditionId: "cond_001",
    visitId: null,
    metricName: "pain_score",
    value: "4",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-11-15"),
  },

  // Jennifer's migraine measurements
  {
    id: "meas_006",
    conditionId: "cond_005",
    visitId: null,
    metricName: "pain_score",
    value: "9",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-08-05"),
  },
  {
    id: "meas_007",
    conditionId: "cond_005",
    visitId: null,
    metricName: "pain_score",
    value: "7",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-09-10"),
  },
  {
    id: "meas_008",
    conditionId: "cond_005",
    visitId: null,
    metricName: "pain_score",
    value: "5",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-10-20"),
  },
  {
    id: "meas_009",
    conditionId: "cond_005",
    visitId: null,
    metricName: "frequency",
    value: "2",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-11-01"),
  },

  // David's insomnia measurements
  {
    id: "meas_010",
    conditionId: "cond_007",
    visitId: null,
    metricName: "sleep_quality",
    value: "3",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-07-22"),
  },
  {
    id: "meas_011",
    conditionId: "cond_007",
    visitId: null,
    metricName: "sleep_quality",
    value: "5",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-09-01"),
  },
  {
    id: "meas_012",
    conditionId: "cond_007",
    visitId: null,
    metricName: "sleep_quality",
    value: "6",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-11-01"),
  },

  // William's sciatica measurements (worsening)
  {
    id: "meas_013",
    conditionId: "cond_013",
    visitId: null,
    metricName: "pain_score",
    value: "5",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-10-05"),
  },
  {
    id: "meas_014",
    conditionId: "cond_013",
    visitId: null,
    metricName: "pain_score",
    value: "6",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-10-20"),
  },
  {
    id: "meas_015",
    conditionId: "cond_013",
    visitId: null,
    metricName: "pain_score",
    value: "7",
    source: MeasurementSource.VISIT,
    recordedAt: new Date("2024-11-10"),
  },
];

// =============================================================================
// MOCK PATIENT NOTES (CRM)
// =============================================================================

export const mockPatientNotes: PatientNote[] = [
  {
    id: "note_001",
    patientId: "patient_001",
    visitId: null,
    content: "Prefers afternoon appointments due to work schedule",
    isPinned: true,
    isPrivate: false,
    createdAt: new Date("2024-06-15"),
    createdBy: "pract_dev_001",
  },
  {
    id: "note_002",
    patientId: "patient_001",
    visitId: null,
    content: "Daughter getting married in March - excited!",
    isPinned: false,
    isPrivate: false,
    createdAt: new Date("2024-11-01"),
    createdBy: "pract_dev_001",
  },
  {
    id: "note_003",
    patientId: "patient_002",
    visitId: null,
    content: "Needle-sensitive - use thinner gauge (0.20mm)",
    isPinned: true,
    isPrivate: false,
    createdAt: new Date("2024-03-10"),
    createdBy: "pract_dev_001",
  },
  {
    id: "note_004",
    patientId: "patient_003",
    visitId: null,
    content: "Works at Google, very busy schedule",
    isPinned: false,
    isPrivate: false,
    createdAt: new Date("2024-08-05"),
    createdBy: "pract_dev_001",
  },
  {
    id: "note_005",
    patientId: "patient_006",
    visitId: null,
    content: "Former college baseball pitcher - relevant to shoulder issue",
    isPinned: true,
    isPrivate: false,
    createdAt: new Date("2024-11-01"),
    createdBy: "pract_dev_001",
  },
  {
    id: "note_006",
    patientId: "patient_008",
    visitId: null,
    content: "Retired teacher, loves gardening - aggravates his back",
    isPinned: false,
    isPrivate: false,
    createdAt: new Date("2024-10-05"),
    createdBy: "pract_dev_001",
  },
];

// =============================================================================
// HELPER: Generate today's appointments
// =============================================================================

function getTodayAt(hours: number, minutes: number = 0): Date {
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);
  return today;
}

// =============================================================================
// MOCK APPOINTMENTS (for today)
// =============================================================================

export const mockAppointments: Appointment[] = [
  // COMPLETED - Early morning (already done, signed)
  {
    id: "appt_010",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_009", // Lisa Anderson
    appointmentTypeId: "appt_type_002",
    scheduledStart: getTodayAt(7, 30),
    scheduledEnd: getTodayAt(8, 30),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getTodayAt(7, 25),
    startedAt: getTodayAt(7, 30),
    needleInsertionAt: getTodayAt(7, 40),
    needleRemovalAt: getTodayAt(8, 10),
    completedAt: getTodayAt(8, 25),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "appt_011",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_010", // Michael Taylor
    appointmentTypeId: "appt_type_003", // Brief follow-up
    scheduledStart: getTodayAt(8, 30),
    scheduledEnd: getTodayAt(9, 0),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getTodayAt(8, 25),
    startedAt: getTodayAt(8, 30),
    needleInsertionAt: getTodayAt(8, 35),
    needleRemovalAt: getTodayAt(8, 50),
    completedAt: getTodayAt(8, 55),
    treatmentDurationMinutes: 15,
    usedEstim: true,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "appt_001",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_002",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getTodayAt(9, 0),
    scheduledEnd: getTodayAt(10, 0),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getTodayAt(8, 55),
    startedAt: getTodayAt(9, 5),
    needleInsertionAt: getTodayAt(9, 15),
    needleRemovalAt: getTodayAt(9, 45),
    completedAt: getTodayAt(9, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // COMPLETED - unsigned (needs signature)
  {
    id: "appt_002",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_007",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getTodayAt(10, 0),
    scheduledEnd: getTodayAt(11, 0),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: false, // Unsigned!
    checkedInAt: getTodayAt(9, 50),
    startedAt: getTodayAt(10, 0),
    needleInsertionAt: getTodayAt(10, 10),
    needleRemovalAt: getTodayAt(10, 40),
    completedAt: getTodayAt(10, 50),
    treatmentDurationMinutes: 30,
    usedEstim: true,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // IN_PROGRESS - State 1: Started, intake/consultation (no needles yet)
  {
    id: "appt_003a",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_004", // David Kim
    appointmentTypeId: "appt_type_001", // Initial consultation
    scheduledStart: getTodayAt(10, 30),
    scheduledEnd: getTodayAt(12, 0),
    status: AppointmentStatus.IN_PROGRESS,
    isLate: false,
    isSigned: false,
    checkedInAt: getTodayAt(10, 25),
    startedAt: getTodayAt(10, 30),
    needleInsertionAt: null, // No needles yet - doing intake
    needleRemovalAt: null,
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // IN_PROGRESS - State 2: Needling (needles in, patient resting)
  {
    id: "appt_003",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_001", // Emily Johnson
    appointmentTypeId: "appt_type_002",
    scheduledStart: getTodayAt(11, 0),
    scheduledEnd: getTodayAt(12, 0),
    status: AppointmentStatus.IN_PROGRESS,
    isLate: false,
    isSigned: false,
    checkedInAt: getTodayAt(10, 55),
    startedAt: getTodayAt(11, 0),
    needleInsertionAt: getTodayAt(11, 10),
    needleRemovalAt: null, // Needles still in
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // IN_PROGRESS - State 3: Needles out, finishing up
  {
    id: "appt_003b",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_005", // Maria Garcia
    appointmentTypeId: "appt_type_003", // Brief follow-up
    scheduledStart: getTodayAt(11, 30),
    scheduledEnd: getTodayAt(12, 0),
    status: AppointmentStatus.IN_PROGRESS,
    isLate: false,
    isSigned: false,
    checkedInAt: getTodayAt(11, 15), // Checked in at 11:15am
    startedAt: getTodayAt(11, 30),
    needleInsertionAt: getTodayAt(11, 35),
    needleRemovalAt: getTodayAt(11, 50), // Needles out, wrapping up
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // CHECKED_IN - Waiting (checked in early, waiting for their noon appointment)
  {
    id: "appt_004",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_003",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getTodayAt(12, 0),
    scheduledEnd: getTodayAt(13, 0),
    status: AppointmentStatus.CHECKED_IN,
    isLate: false,
    isSigned: false,
    checkedInAt: getTodayAt(10, 55), // Checked in early at 10:55am
    startedAt: null,
    needleInsertionAt: null,
    needleRemovalAt: null,
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // SCHEDULED - Upcoming appointments
  {
    id: "appt_007",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_006",
    appointmentTypeId: "appt_type_001", // Initial consultation (new patient)
    scheduledStart: getTodayAt(15, 0),
    scheduledEnd: getTodayAt(16, 30),
    status: AppointmentStatus.SCHEDULED,
    isLate: false,
    isSigned: false,
    checkedInAt: null,
    startedAt: null,
    needleInsertionAt: null,
    needleRemovalAt: null,
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "appt_008",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_008",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getTodayAt(16, 30),
    scheduledEnd: getTodayAt(17, 30),
    status: AppointmentStatus.SCHEDULED,
    isLate: false,
    isSigned: false,
    checkedInAt: null,
    startedAt: null,
    needleInsertionAt: null,
    needleRemovalAt: null,
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // CANCELLED - one cancellation
  {
    id: "appt_009",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_005",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getTodayAt(8, 0),
    scheduledEnd: getTodayAt(9, 0),
    status: AppointmentStatus.CANCELLED,
    isLate: false,
    isSigned: false,
    checkedInAt: null,
    startedAt: null,
    needleInsertionAt: null,
    needleRemovalAt: null,
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: "Patient rescheduled",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// =============================================================================
// MOCK PAST APPOINTMENTS (for visit history)
// =============================================================================

function getPastDate(daysAgo: number, hours: number, minutes: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getFutureDate(daysAhead: number, hours: number, minutes: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// =============================================================================
// MOCK FUTURE APPOINTMENTS (for scheduled visits section)
// =============================================================================

export const mockFutureAppointments: Appointment[] = [
  // Emily Johnson (patient_001) - 3 future scheduled appointments
  {
    id: "future_appt_e1",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_001",
    appointmentTypeId: "appt_type_002", // Follow-up
    scheduledStart: getFutureDate(7, 11),
    scheduledEnd: getFutureDate(7, 12),
    status: AppointmentStatus.SCHEDULED,
    isLate: false,
    isSigned: false,
    checkedInAt: null,
    startedAt: null,
    needleInsertionAt: null,
    needleRemovalAt: null,
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "future_appt_e2",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_001",
    appointmentTypeId: "appt_type_002", // Follow-up
    scheduledStart: getFutureDate(14, 11),
    scheduledEnd: getFutureDate(14, 12),
    status: AppointmentStatus.SCHEDULED,
    isLate: false,
    isSigned: false,
    checkedInAt: null,
    startedAt: null,
    needleInsertionAt: null,
    needleRemovalAt: null,
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "future_appt_e3",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_001",
    appointmentTypeId: "appt_type_002", // Follow-up
    scheduledStart: getFutureDate(21, 11),
    scheduledEnd: getFutureDate(21, 12),
    status: AppointmentStatus.SCHEDULED,
    isLate: false,
    isSigned: false,
    checkedInAt: null,
    startedAt: null,
    needleInsertionAt: null,
    needleRemovalAt: null,
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Jennifer Lee (patient_003) - 1 future appointment
  {
    id: "future_appt_j1",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_003",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getFutureDate(10, 14),
    scheduledEnd: getFutureDate(10, 15),
    status: AppointmentStatus.SCHEDULED,
    isLate: false,
    isSigned: false,
    checkedInAt: null,
    startedAt: null,
    needleInsertionAt: null,
    needleRemovalAt: null,
    completedAt: null,
    treatmentDurationMinutes: null,
    usedEstim: false,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockPastAppointments: Appointment[] = [
  // Emily Johnson - 4 past visits (frequent patient)
  {
    id: "past_appt_e1",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_001",
    appointmentTypeId: "appt_type_001", // Initial
    scheduledStart: getPastDate(90, 10),
    scheduledEnd: getPastDate(90, 11, 30),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(90, 9, 55),
    startedAt: getPastDate(90, 10),
    needleInsertionAt: getPastDate(90, 10, 30),
    needleRemovalAt: getPastDate(90, 11),
    completedAt: getPastDate(90, 11, 20),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(90, 10),
    updatedAt: getPastDate(90, 11, 20),
  },
  {
    id: "past_appt_e2",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_001",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(60, 14),
    scheduledEnd: getPastDate(60, 15),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(60, 13, 55),
    startedAt: getPastDate(60, 14),
    needleInsertionAt: getPastDate(60, 14, 15),
    needleRemovalAt: getPastDate(60, 14, 45),
    completedAt: getPastDate(60, 14, 55),
    treatmentDurationMinutes: 30,
    usedEstim: true,
    cancellationReason: null,
    createdAt: getPastDate(60, 14),
    updatedAt: getPastDate(60, 14, 55),
  },
  {
    id: "past_appt_e3",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_001",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(30, 10),
    scheduledEnd: getPastDate(30, 11),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(30, 9, 50),
    startedAt: getPastDate(30, 10),
    needleInsertionAt: getPastDate(30, 10, 10),
    needleRemovalAt: getPastDate(30, 10, 40),
    completedAt: getPastDate(30, 10, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(30, 10),
    updatedAt: getPastDate(30, 10, 55),
  },
  {
    id: "past_appt_e4",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_001",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(7, 11),
    scheduledEnd: getPastDate(7, 12),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(7, 10, 55),
    startedAt: getPastDate(7, 11),
    needleInsertionAt: getPastDate(7, 11, 10),
    needleRemovalAt: getPastDate(7, 11, 40),
    completedAt: getPastDate(7, 11, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(7, 11),
    updatedAt: getPastDate(7, 11, 55),
  },

  // Robert Martinez - 3 past visits
  {
    id: "past_appt_r1",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_002",
    appointmentTypeId: "appt_type_001",
    scheduledStart: getPastDate(120, 9),
    scheduledEnd: getPastDate(120, 10, 30),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(120, 8, 55),
    startedAt: getPastDate(120, 9),
    needleInsertionAt: getPastDate(120, 9, 30),
    needleRemovalAt: getPastDate(120, 10),
    completedAt: getPastDate(120, 10, 20),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(120, 9),
    updatedAt: getPastDate(120, 10, 20),
  },
  {
    id: "past_appt_r2",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_002",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(45, 15),
    scheduledEnd: getPastDate(45, 16),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(45, 14, 50),
    startedAt: getPastDate(45, 15),
    needleInsertionAt: getPastDate(45, 15, 10),
    needleRemovalAt: getPastDate(45, 15, 40),
    completedAt: getPastDate(45, 15, 55),
    treatmentDurationMinutes: 30,
    usedEstim: true,
    cancellationReason: null,
    createdAt: getPastDate(45, 15),
    updatedAt: getPastDate(45, 15, 55),
  },
  {
    id: "past_appt_r3",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_002",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(14, 9),
    scheduledEnd: getPastDate(14, 10),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(14, 8, 55),
    startedAt: getPastDate(14, 9),
    needleInsertionAt: getPastDate(14, 9, 10),
    needleRemovalAt: getPastDate(14, 9, 40),
    completedAt: getPastDate(14, 9, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(14, 9),
    updatedAt: getPastDate(14, 9, 55),
  },

  // Jennifer Lee - 2 past visits
  {
    id: "past_appt_j1",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_003",
    appointmentTypeId: "appt_type_001",
    scheduledStart: getPastDate(75, 11),
    scheduledEnd: getPastDate(75, 12, 30),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(75, 10, 55),
    startedAt: getPastDate(75, 11),
    needleInsertionAt: getPastDate(75, 11, 30),
    needleRemovalAt: getPastDate(75, 12),
    completedAt: getPastDate(75, 12, 20),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(75, 11),
    updatedAt: getPastDate(75, 12, 20),
  },
  {
    id: "past_appt_j2",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_003",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(21, 14),
    scheduledEnd: getPastDate(21, 15),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(21, 13, 55),
    startedAt: getPastDate(21, 14),
    needleInsertionAt: getPastDate(21, 14, 10),
    needleRemovalAt: getPastDate(21, 14, 40),
    completedAt: getPastDate(21, 14, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(21, 14),
    updatedAt: getPastDate(21, 14, 55),
  },

  // David Kim - 3 past visits
  {
    id: "past_appt_d1",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_004",
    appointmentTypeId: "appt_type_001",
    scheduledStart: getPastDate(100, 10),
    scheduledEnd: getPastDate(100, 11, 30),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(100, 9, 55),
    startedAt: getPastDate(100, 10),
    needleInsertionAt: getPastDate(100, 10, 30),
    needleRemovalAt: getPastDate(100, 11),
    completedAt: getPastDate(100, 11, 20),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(100, 10),
    updatedAt: getPastDate(100, 11, 20),
  },
  {
    id: "past_appt_d2",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_004",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(50, 16),
    scheduledEnd: getPastDate(50, 17),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(50, 15, 55),
    startedAt: getPastDate(50, 16),
    needleInsertionAt: getPastDate(50, 16, 10),
    needleRemovalAt: getPastDate(50, 16, 40),
    completedAt: getPastDate(50, 16, 55),
    treatmentDurationMinutes: 30,
    usedEstim: true,
    cancellationReason: null,
    createdAt: getPastDate(50, 16),
    updatedAt: getPastDate(50, 16, 55),
  },
  {
    id: "past_appt_d3",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_004",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(10, 11),
    scheduledEnd: getPastDate(10, 12),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(10, 10, 55),
    startedAt: getPastDate(10, 11),
    needleInsertionAt: getPastDate(10, 11, 10),
    needleRemovalAt: getPastDate(10, 11, 40),
    completedAt: getPastDate(10, 11, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(10, 11),
    updatedAt: getPastDate(10, 11, 55),
  },

  // Maria Garcia - 5 past visits (package user)
  {
    id: "past_appt_m1",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_005",
    appointmentTypeId: "appt_type_001",
    scheduledStart: getPastDate(150, 9),
    scheduledEnd: getPastDate(150, 10, 30),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(150, 8, 55),
    startedAt: getPastDate(150, 9),
    needleInsertionAt: getPastDate(150, 9, 30),
    needleRemovalAt: getPastDate(150, 10),
    completedAt: getPastDate(150, 10, 20),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(150, 9),
    updatedAt: getPastDate(150, 10, 20),
  },
  {
    id: "past_appt_m2",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_005",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(120, 14),
    scheduledEnd: getPastDate(120, 15),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(120, 13, 55),
    startedAt: getPastDate(120, 14),
    needleInsertionAt: getPastDate(120, 14, 10),
    needleRemovalAt: getPastDate(120, 14, 40),
    completedAt: getPastDate(120, 14, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(120, 14),
    updatedAt: getPastDate(120, 14, 55),
  },
  {
    id: "past_appt_m3",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_005",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(90, 10),
    scheduledEnd: getPastDate(90, 11),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(90, 9, 55),
    startedAt: getPastDate(90, 10),
    needleInsertionAt: getPastDate(90, 10, 10),
    needleRemovalAt: getPastDate(90, 10, 40),
    completedAt: getPastDate(90, 10, 55),
    treatmentDurationMinutes: 30,
    usedEstim: true,
    cancellationReason: null,
    createdAt: getPastDate(90, 10),
    updatedAt: getPastDate(90, 10, 55),
  },
  {
    id: "past_appt_m4",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_005",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(60, 15),
    scheduledEnd: getPastDate(60, 16),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(60, 14, 55),
    startedAt: getPastDate(60, 15),
    needleInsertionAt: getPastDate(60, 15, 10),
    needleRemovalAt: getPastDate(60, 15, 40),
    completedAt: getPastDate(60, 15, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(60, 15),
    updatedAt: getPastDate(60, 15, 55),
  },
  {
    id: "past_appt_m5",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_005",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(30, 11),
    scheduledEnd: getPastDate(30, 12),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(30, 10, 55),
    startedAt: getPastDate(30, 11),
    needleInsertionAt: getPastDate(30, 11, 10),
    needleRemovalAt: getPastDate(30, 11, 40),
    completedAt: getPastDate(30, 11, 55),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(30, 11),
    updatedAt: getPastDate(30, 11, 55),
  },

  // Susan Brown - 2 past visits
  {
    id: "past_appt_s1",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_007",
    appointmentTypeId: "appt_type_001",
    scheduledStart: getPastDate(60, 10),
    scheduledEnd: getPastDate(60, 11, 30),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(60, 9, 55),
    startedAt: getPastDate(60, 10),
    needleInsertionAt: getPastDate(60, 10, 30),
    needleRemovalAt: getPastDate(60, 11),
    completedAt: getPastDate(60, 11, 20),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(60, 10),
    updatedAt: getPastDate(60, 11, 20),
  },
  {
    id: "past_appt_s2",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_007",
    appointmentTypeId: "appt_type_002",
    scheduledStart: getPastDate(21, 14),
    scheduledEnd: getPastDate(21, 15),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(21, 13, 55),
    startedAt: getPastDate(21, 14),
    needleInsertionAt: getPastDate(21, 14, 10),
    needleRemovalAt: getPastDate(21, 14, 40),
    completedAt: getPastDate(21, 14, 55),
    treatmentDurationMinutes: 30,
    usedEstim: true,
    cancellationReason: null,
    createdAt: getPastDate(21, 14),
    updatedAt: getPastDate(21, 14, 55),
  },

  // William Davis - 1 past visit (newer patient)
  {
    id: "past_appt_w1",
    clinicId: "clinic_dev_001",
    practitionerId: "pract_dev_001",
    patientId: "patient_008",
    appointmentTypeId: "appt_type_001",
    scheduledStart: getPastDate(30, 15),
    scheduledEnd: getPastDate(30, 16, 30),
    status: AppointmentStatus.COMPLETED,
    isLate: false,
    isSigned: true,
    checkedInAt: getPastDate(30, 14, 55),
    startedAt: getPastDate(30, 15),
    needleInsertionAt: getPastDate(30, 15, 30),
    needleRemovalAt: getPastDate(30, 16),
    completedAt: getPastDate(30, 16, 20),
    treatmentDurationMinutes: 30,
    usedEstim: false,
    cancellationReason: null,
    createdAt: getPastDate(30, 15),
    updatedAt: getPastDate(30, 16, 20),
  },
];

// =============================================================================
// MOCK VISITS (Clinical documentation for past appointments)
// =============================================================================

export const mockVisits: Visit[] = [
  // Emily Johnson visits
  {
    id: "visit_e1",
    appointmentId: "past_appt_e1",
    subjective: { raw: "New patient. Chief complaint: Low back pain x 3 months. Worse with prolonged sitting at work. Pain 8/10. Also reports work-related stress affecting sleep." },
    objective: { raw: "Tongue: pale, thin white coating. Pulse: wiry, thin. Palpation: tenderness L4-L5 paraspinal, bilateral." },
    assessment: { raw: "Qi and Blood stagnation in lower back. Liver Qi stagnation with underlying Qi deficiency." },
    plan: { raw: "Treatment principle: Move Qi and Blood, relax sinews. Points: BL23, BL25, BL40, GB34 bilateral. LV3, LI4 bilateral (Four Gates). Recommend weekly treatments x 6 weeks." },
    signedAt: getPastDate(90, 11, 20),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(90, 10),
    updatedAt: getPastDate(90, 11, 20),
  },
  {
    id: "visit_e2",
    appointmentId: "past_appt_e2",
    subjective: { raw: "Follow-up for LBP. Pain improved to 6/10. Better able to sit at work. Still some stiffness in morning. Stress levels slightly improved." },
    objective: { raw: "Tongue: pale pink, thin coating. Pulse: less wiry than before. ROM improved ~30%." },
    assessment: { raw: "Qi and Blood stagnation improving. Continue current approach." },
    plan: { raw: "Same protocol with e-stim on BL points. Added GV20, Yintang for stress. Recommend biweekly treatments going forward." },
    signedAt: getPastDate(60, 14, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(60, 14),
    updatedAt: getPastDate(60, 14, 55),
  },
  {
    id: "visit_e3",
    appointmentId: "past_appt_e3",
    subjective: { raw: "LBP 4/10 today. Much better overall. Occasional flare-ups after long drives. Sleep improved, feels less stressed." },
    objective: { raw: "Tongue: pink, thin white coating. Pulse: moderate, slightly wiry. Palpation: minimal tenderness." },
    assessment: { raw: "Significant improvement. Liver Qi stagnation resolving." },
    plan: { raw: "Maintenance treatment. BL23, BL25, GB34, BL40. Four Gates. Added SP6 for overall support." },
    signedAt: getPastDate(30, 10, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(30, 10),
    updatedAt: getPastDate(30, 10, 55),
  },
  {
    id: "visit_e4",
    appointmentId: "past_appt_e4",
    subjective: { raw: "Doing well. LBP 3/10. Had minor flare last week after helping friend move furniture. Stress manageable." },
    objective: { raw: "Tongue: pink, thin coating. Pulse: moderate. Palpation: mild tenderness L4-L5." },
    assessment: { raw: "Stable. Minor flare from overexertion - expected." },
    plan: { raw: "Standard protocol. BL23, BL25, BL40, GB34 bilateral. Four Gates. Advised on proper lifting mechanics." },
    signedAt: getPastDate(7, 11, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(7, 11),
    updatedAt: getPastDate(7, 11, 55),
  },

  // Robert Martinez visits
  {
    id: "visit_r1",
    appointmentId: "past_appt_r1",
    subjective: { raw: "New patient. Right knee pain x 2 years. Diagnosed with OA. Worse with stairs, weather changes. Also managing HTN with medication." },
    objective: { raw: "Tongue: red, dry coating. Pulse: wiry, slightly rapid. Knee: swelling medial compartment, crepitus on flexion." },
    assessment: { raw: "Bi syndrome - Damp-Heat in channels. Kidney/Liver Yin deficiency underlying." },
    plan: { raw: "Points: ST35, Xiyan, ST36, SP9, GB34 (right). KD3, SP6 bilateral for Yin. Recommend 8 treatments." },
    signedAt: getPastDate(120, 10, 20),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(120, 9),
    updatedAt: getPastDate(120, 10, 20),
  },
  {
    id: "visit_r2",
    appointmentId: "past_appt_r2",
    subjective: { raw: "Knee doing better. Less swelling. Can do stairs more easily. BP stable per PCP." },
    objective: { raw: "Tongue: less red. Pulse: less wiry. Knee: minimal swelling, full ROM." },
    assessment: { raw: "Damp-Heat clearing. Good response to treatment." },
    plan: { raw: "Continue knee points with e-stim. Added LV3, LI4 for Qi circulation. Monthly maintenance recommended." },
    signedAt: getPastDate(45, 15, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(45, 15),
    updatedAt: getPastDate(45, 15, 55),
  },
  {
    id: "visit_r3",
    appointmentId: "past_appt_r3",
    subjective: { raw: "Maintenance visit. Knee stable, occasional stiffness in morning. Overall doing well." },
    objective: { raw: "Tongue: pale pink. Pulse: moderate. Knee: no swelling, good ROM." },
    assessment: { raw: "Stable. Bi syndrome well controlled." },
    plan: { raw: "Maintenance protocol: ST35, Xiyan, ST36, GB34. KD3, SP6. Continue monthly." },
    signedAt: getPastDate(14, 9, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(14, 9),
    updatedAt: getPastDate(14, 9, 55),
  },

  // Jennifer Lee visits
  {
    id: "visit_j1",
    appointmentId: "past_appt_j1",
    subjective: { raw: "New patient. Migraine headaches x 5 years. 2-3x/month, often around menses. Pain 9/10 during episodes. Works at computer all day - also has neck tension." },
    objective: { raw: "Tongue: red sides, thin yellow coating. Pulse: wiry, rapid. Neck: bilateral trapezius tension, tender GB21." },
    assessment: { raw: "Liver Yang rising with underlying Liver Blood deficiency. Neck tension contributing." },
    plan: { raw: "Points: GB20, GB21, Taiyang, LV3, LI4, SP6. Recommend twice monthly around cycle." },
    signedAt: getPastDate(75, 12, 20),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(75, 11),
    updatedAt: getPastDate(75, 12, 20),
  },
  {
    id: "visit_j2",
    appointmentId: "past_appt_j2",
    subjective: { raw: "Migraines improved - only 1 this month, intensity 5/10. Neck tension still present but better. Using ergonomic setup now." },
    objective: { raw: "Tongue: less red on sides. Pulse: less wiry. Neck: improved, less tender." },
    assessment: { raw: "Good progress. Continue treating root and branch." },
    plan: { raw: "GB20, GB21, Taiyang, SJ5, LV3, LI4, SP6. Continue twice monthly." },
    signedAt: getPastDate(21, 14, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(21, 14),
    updatedAt: getPastDate(21, 14, 55),
  },

  // David Kim visits
  {
    id: "visit_d1",
    appointmentId: "past_appt_d1",
    subjective: { raw: "New patient. Insomnia x 1 year. Difficulty falling asleep, early waking (3-4am). Also has tinnitus - high pitched, worse with stress. Very stressed at work." },
    objective: { raw: "Tongue: red tip, thin yellow coating. Pulse: thin, rapid. Appears fatigued." },
    assessment: { raw: "Heart and Kidney Yin deficiency. Heart fire disturbing Shen. Tinnitus from Kidney deficiency." },
    plan: { raw: "Points: HT7, PC6, Anmian, SP6, KD3, KD6. Yintang, GV20. Recommend weekly x 8." },
    signedAt: getPastDate(100, 11, 20),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(100, 10),
    updatedAt: getPastDate(100, 11, 20),
  },
  {
    id: "visit_d2",
    appointmentId: "past_appt_d2",
    subjective: { raw: "Sleep quality 5/10 (was 3/10). Falling asleep faster. Still some early waking. Tinnitus unchanged. Work stress continues." },
    objective: { raw: "Tongue: red tip less pronounced. Pulse: less rapid. Appears less fatigued." },
    assessment: { raw: "Improvement in Shen disturbance. Continue nourishing Yin." },
    plan: { raw: "Same protocol with e-stim on auricular points. Added SJ17 for tinnitus. Continue weekly." },
    signedAt: getPastDate(50, 16, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(50, 16),
    updatedAt: getPastDate(50, 16, 55),
  },
  {
    id: "visit_d3",
    appointmentId: "past_appt_d3",
    subjective: { raw: "Sleep much better - 6/10. Sleeping through night most days. Tinnitus slightly improved when not stressed." },
    objective: { raw: "Tongue: pale pink, thin coating. Pulse: moderate, less rapid. Looks more rested." },
    assessment: { raw: "Good progress. Heart fire calming, Kidney Yin strengthening." },
    plan: { raw: "Maintain protocol. HT7, PC6, Anmian, SP6, KD3. Yintang, GV20. Biweekly now." },
    signedAt: getPastDate(10, 11, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(10, 11),
    updatedAt: getPastDate(10, 11, 55),
  },

  // Maria Garcia visits
  {
    id: "visit_m1",
    appointmentId: "past_appt_m1",
    subjective: { raw: "New patient. Dysmenorrhea since teenage years. Severe cramping days 1-2, pain 8/10. Has to miss work. No children yet, hoping to conceive next year." },
    objective: { raw: "Tongue: pale purple, thin coating. Pulse: choppy, thin. Abdomen: tender lower quadrants." },
    assessment: { raw: "Blood stasis in uterus with underlying Blood deficiency. Liver Qi stagnation contributing." },
    plan: { raw: "Points: SP6, SP8, CV4, CV6, ST29 bilateral. LV3, LI4. Recommend weekly, especially pre-menstrual." },
    signedAt: getPastDate(150, 10, 20),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(150, 9),
    updatedAt: getPastDate(150, 10, 20),
  },
  {
    id: "visit_m2",
    appointmentId: "past_appt_m2",
    subjective: { raw: "Last period slightly better - pain 7/10. Still needed ibuprofen but less. Cycle regular." },
    objective: { raw: "Tongue: less purple. Pulse: less choppy. Abdomen: less tender." },
    assessment: { raw: "Blood stasis reducing. Continue building Blood." },
    plan: { raw: "Same protocol. Added BL17, BL20 for Blood production. Continue weekly." },
    signedAt: getPastDate(120, 14, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(120, 14),
    updatedAt: getPastDate(120, 14, 55),
  },
  {
    id: "visit_m3",
    appointmentId: "past_appt_m3",
    subjective: { raw: "Period pain 5/10 this month. Big improvement! Only needed ibuprofen day 1. Energy better overall." },
    objective: { raw: "Tongue: pale pink. Pulse: moderate, less choppy. Abdomen: minimal tenderness." },
    assessment: { raw: "Excellent progress. Blood stasis clearing, Blood building." },
    plan: { raw: "Continue with e-stim on CV4, CV6. SP6, SP8, ST29. Four Gates. Biweekly now." },
    signedAt: getPastDate(90, 10, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(90, 10),
    updatedAt: getPastDate(90, 10, 55),
  },
  {
    id: "visit_m4",
    appointmentId: "past_appt_m4",
    subjective: { raw: "Doing great! Period pain 4/10. No missed work. Starting to plan for pregnancy next few months." },
    objective: { raw: "Tongue: pink, thin coating. Pulse: moderate. Abdomen: soft, non-tender." },
    assessment: { raw: "Significant improvement. Good foundation for fertility." },
    plan: { raw: "Fertility-supportive protocol: SP6, CV4, CV6, KD3, ST36, LV3. Continue biweekly." },
    signedAt: getPastDate(60, 15, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(60, 15),
    updatedAt: getPastDate(60, 15, 55),
  },
  {
    id: "visit_m5",
    appointmentId: "past_appt_m5",
    subjective: { raw: "Period pain 3/10. Very manageable. Energy good. Will start trying to conceive in 2 months." },
    objective: { raw: "Tongue: pink, moist. Pulse: moderate, smooth. Overall excellent presentation." },
    assessment: { raw: "Excellent state. Ready for pre-conception optimization." },
    plan: { raw: "Pre-conception protocol: SP6, CV4, KD3, KD6, ST36, BL23. Monthly maintenance." },
    signedAt: getPastDate(30, 11, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(30, 11),
    updatedAt: getPastDate(30, 11, 55),
  },

  // Susan Brown visits
  {
    id: "visit_s1",
    appointmentId: "past_appt_s1",
    subjective: { raw: "New patient. IBS-C x 3 years. Bloating, constipation (BM every 2-3 days). Also fatigued, especially afternoon slump." },
    objective: { raw: "Tongue: pale, swollen, teeth marks, thin white coating. Pulse: weak, slippery. Abdomen: distended, tender around ST25." },
    assessment: { raw: "Spleen Qi deficiency with Dampness. Secondary Liver overacting on Spleen." },
    plan: { raw: "Points: ST25, ST36, SP6, CV12, CV6. LV3 for Liver/Spleen harmony. Recommend weekly x 6." },
    signedAt: getPastDate(60, 11, 20),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(60, 10),
    updatedAt: getPastDate(60, 11, 20),
  },
  {
    id: "visit_s2",
    appointmentId: "past_appt_s2",
    subjective: { raw: "Bowels more regular - BM every 1-2 days now. Less bloating. Energy somewhat better, afternoon slump less severe." },
    objective: { raw: "Tongue: less swollen. Pulse: slightly stronger. Abdomen: less distended." },
    assessment: { raw: "Spleen Qi strengthening. Dampness reducing." },
    plan: { raw: "Same protocol with e-stim on ST25, CV12. Added SP3 to strengthen Spleen. Continue biweekly." },
    signedAt: getPastDate(21, 14, 55),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(21, 14),
    updatedAt: getPastDate(21, 14, 55),
  },

  // William Davis visits
  {
    id: "visit_w1",
    appointmentId: "past_appt_w1",
    subjective: { raw: "New patient. Right sciatica x 2 months. Pain radiating from hip to calf. 5/10 at rest, 7/10 with activity. Retired teacher, loves gardening - had to stop." },
    objective: { raw: "Tongue: purple hue. Pulse: wiry, choppy. SLR positive at 45° right. Tenderness piriformis, BL points." },
    assessment: { raw: "Qi and Blood stagnation in Taiyang and Shaoyang channels. Underlying Kidney deficiency (age-related)." },
    plan: { raw: "Points: BL25, BL36, BL40, BL57, GB30, GB34 (right). KD3 bilateral. Recommend twice weekly x 3 weeks." },
    signedAt: getPastDate(30, 16, 20),
    signedBy: "Dr. Sarah Chen",
    createdAt: getPastDate(30, 15),
    updatedAt: getPastDate(30, 16, 20),
  },
];

// =============================================================================
// ENRICHED APPOINTMENTS (with joined data for UI)
// =============================================================================

export function getEnrichedAppointments(): AppointmentWithRelations[] {
  // Only return today's appointments (used for Today screen)
  return mockAppointments.map((appt) => ({
    ...appt,
    patient: mockPatients.find((p) => p.id === appt.patientId),
    practitioner: mockPractitioners.find((pr) => pr.id === appt.practitionerId),
    appointmentType: mockAppointmentTypes.find(
      (at) => at.id === appt.appointmentTypeId
    ),
    conditions: mockConditions.filter((c) => c.patientId === appt.patientId),
  }));
}

/**
 * Get a single appointment by ID from all sources (today + future)
 * Used when navigating to a specific appointment
 */
export function getAppointmentById(appointmentId: string): AppointmentWithRelations | null {
  // Search in today's appointments first
  let appt = mockAppointments.find((a) => a.id === appointmentId);

  // If not found, search in future appointments
  if (!appt) {
    appt = mockFutureAppointments.find((a) => a.id === appointmentId);
  }

  if (!appt) return null;

  return {
    ...appt,
    patient: mockPatients.find((p) => p.id === appt.patientId),
    practitioner: mockPractitioners.find((pr) => pr.id === appt.practitionerId),
    appointmentType: mockAppointmentTypes.find(
      (at) => at.id === appt.appointmentTypeId
    ),
    conditions: mockConditions.filter((c) => c.patientId === appt.patientId),
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get today's appointment ID for a patient (if they have one)
 * Returns the first matching appointment ID, or null if patient has no appointment today
 */
export function getPatientTodayAppointmentId(patientId: string): string | null {
  const todayAppt = mockAppointments.find((a) => a.patientId === patientId);
  return todayAppt?.id ?? null;
}

/**
 * Get appointments grouped by status for the Today screen
 * Unsigned and completed are sorted reverse chronologically (most recent first)
 */
export function getAppointmentsByStatus() {
  const enriched = getEnrichedAppointments();

  // Sort by completedAt descending (most recent first)
  const sortByCompletedAtDesc = (
    a: AppointmentWithRelations,
    b: AppointmentWithRelations
  ) => {
    const aTime = a.completedAt?.getTime() ?? 0;
    const bTime = b.completedAt?.getTime() ?? 0;
    return bTime - aTime;
  };

  return {
    inProgress: enriched.filter(
      (a) => a.status === AppointmentStatus.IN_PROGRESS
    ),
    checkedIn: enriched.filter(
      (a) => a.status === AppointmentStatus.CHECKED_IN
    ),
    scheduled: enriched.filter((a) => a.status === AppointmentStatus.SCHEDULED),
    unsigned: enriched
      .filter((a) => a.status === AppointmentStatus.COMPLETED && !a.isSigned)
      .sort(sortByCompletedAtDesc),
    completed: enriched
      .filter((a) => a.status === AppointmentStatus.COMPLETED && a.isSigned)
      .sort(sortByCompletedAtDesc),
    cancelled: enriched.filter(
      (a) =>
        a.status === AppointmentStatus.CANCELLED ||
        a.status === AppointmentStatus.NO_SHOW
    ),
  };
}

/**
 * Get patient's conditions with latest measurements
 */
export function getPatientConditionsWithMeasurements(patientId: string) {
  const conditions = mockConditions.filter((c) => c.patientId === patientId);

  return conditions.map((condition) => {
    const measurements = mockMeasurements
      .filter((m) => m.conditionId === condition.id)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());

    const latestMeasurement = measurements[0];

    return {
      ...condition,
      measurements,
      latestMeasurement,
    };
  });
}

/**
 * Get patient's pinned notes
 */
export function getPatientPinnedNotes(patientId: string) {
  return mockPatientNotes.filter(
    (n) => n.patientId === patientId && n.isPinned
  );
}

/**
 * Search patients by name, phone, or email
 */
export function searchPatients(query: string): Patient[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  return mockPatients.filter((patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const preferredFullName = patient.preferredName
      ? `${patient.preferredName} ${patient.lastName}`.toLowerCase()
      : "";
    const phone = patient.phone.replace(/\D/g, ""); // Remove non-digits
    const queryDigits = lowerQuery.replace(/\D/g, "");

    return (
      fullName.includes(lowerQuery) ||
      preferredFullName.includes(lowerQuery) ||
      patient.email.toLowerCase().includes(lowerQuery) ||
      (queryDigits && phone.includes(queryDigits))
    );
  });
}

/**
 * Get appointments for a specific date
 */
export function getAppointmentsForDate(date: Date): AppointmentWithRelations[] {
  const enriched = getEnrichedAppointments();
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return enriched.filter((appt) => {
    const apptDate = new Date(appt.scheduledStart);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate.getTime() === targetDate.getTime();
  });
}

/**
 * Calculate patient age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Format patient display name
 */
export function getPatientDisplayName(patient: Patient): string {
  if (patient.preferredName) {
    return `${patient.preferredName} ${patient.lastName}`;
  }
  return `${patient.firstName} ${patient.lastName}`;
}

/**
 * Get status display info (color, label)
 */
export function getStatusDisplay(
  status: AppointmentStatus,
  isSigned?: boolean
) {
  if (status === AppointmentStatus.COMPLETED && !isSigned) {
    return {
      label: "Unsigned",
      color: "amber",
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
    };
  }

  const statusMap: Record<
    AppointmentStatus,
    { label: string; color: string; bgColor: string; textColor: string }
  > = {
    [AppointmentStatus.IN_PROGRESS]: {
      label: "In Progress",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    [AppointmentStatus.CHECKED_IN]: {
      label: "Checked In",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    },
    [AppointmentStatus.SCHEDULED]: {
      label: "Scheduled",
      color: "slate",
      bgColor: "bg-slate-100",
      textColor: "text-slate-600",
    },
    [AppointmentStatus.COMPLETED]: {
      label: "Completed",
      color: "slate",
      bgColor: "bg-slate-100",
      textColor: "text-slate-600",
    },
    [AppointmentStatus.CANCELLED]: {
      label: "Cancelled",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    },
    [AppointmentStatus.NO_SHOW]: {
      label: "No Show",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    },
  };

  return statusMap[status];
}

/**
 * Get condition status display info
 */
export function getConditionStatusDisplay(status: ConditionStatus) {
  const statusMap: Record<
    ConditionStatus,
    { label: string; color: string; bgColor: string; textColor: string }
  > = {
    [ConditionStatus.ACTIVE]: {
      label: "Active",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    [ConditionStatus.IMPROVING]: {
      label: "Improving",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    },
    [ConditionStatus.WORSENING]: {
      label: "Worsening",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    },
    [ConditionStatus.STABLE]: {
      label: "Stable",
      color: "gray",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
    },
    [ConditionStatus.RESOLVED]: {
      label: "Resolved",
      color: "slate",
      bgColor: "bg-slate-100",
      textColor: "text-slate-500",
    },
  };

  return statusMap[status];
}

/**
 * Get visit history for a patient (with enriched data)
 * Returns visits sorted by date (most recent first)
 */
export function getPatientVisitHistory(patientId: string): VisitWithAppointment[] {
  // Get all past appointments for this patient
  const patientPastAppointments = mockPastAppointments.filter(
    (appt) => appt.patientId === patientId && appt.status === AppointmentStatus.COMPLETED
  );

  // Get visits for these appointments
  const visits: VisitWithAppointment[] = [];

  for (const appt of patientPastAppointments) {
    const visit = mockVisits.find((v) => v.appointmentId === appt.id);
    if (visit) {
      // Extract chief complaint from subjective (first sentence or truncated)
      const subjective = visit.subjective as { raw?: string } | null;
      const rawText = subjective?.raw || "";

      // Try to extract chief complaint from patterns like "Chief complaint:" or first sentence
      let chiefComplaint = "";
      const ccMatch = rawText.match(/Chief complaint:?\s*([^.]+)/i);
      if (ccMatch) {
        chiefComplaint = ccMatch[1].trim();
      } else {
        // Get first meaningful phrase (up to first period or 50 chars)
        const firstSentence = rawText.split(".")[0];
        chiefComplaint = firstSentence.length > 50
          ? firstSentence.substring(0, 47) + "..."
          : firstSentence;
      }

      visits.push({
        ...visit,
        appointment: {
          ...appt,
          appointmentType: mockAppointmentTypes.find(
            (at) => at.id === appt.appointmentTypeId
          ),
        },
        chiefComplaint,
      });
    }
  }

  // Sort by date (most recent first)
  return visits.sort((a, b) => {
    const dateA = a.appointment?.scheduledStart ? new Date(a.appointment.scheduledStart).getTime() : 0;
    const dateB = b.appointment?.scheduledStart ? new Date(b.appointment.scheduledStart).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Get a single visit by ID with enriched data
 */
export function getVisitById(visitId: string): VisitWithAppointment | null {
  const visit = mockVisits.find((v) => v.id === visitId);
  if (!visit) return null;

  // Find the appointment for this visit
  const appointment = mockPastAppointments.find((a) => a.id === visit.appointmentId);
  if (!appointment) return null;

  // Extract chief complaint
  const subjective = visit.subjective as { raw?: string } | null;
  const rawText = subjective?.raw || "";
  let chiefComplaint = "";
  const ccMatch = rawText.match(/Chief complaint:?\s*([^.]+)/i);
  if (ccMatch) {
    chiefComplaint = ccMatch[1].trim();
  } else {
    const firstSentence = rawText.split(".")[0];
    chiefComplaint = firstSentence.length > 50
      ? firstSentence.substring(0, 47) + "..."
      : firstSentence;
  }

  return {
    ...visit,
    appointment: {
      ...appointment,
      appointmentType: mockAppointmentTypes.find(
        (at) => at.id === appointment.appointmentTypeId
      ),
    },
    chiefComplaint,
  };
}

/**
 * Scheduled appointment with appointment type for display
 */
export interface ScheduledAppointmentWithType {
  id: string;
  patientId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: AppointmentStatus;
  isSigned: boolean;
  appointmentType?: AppointmentType;
  isFuture: boolean; // True if scheduled for a future date (not today)
}

/**
 * Get all scheduled appointments for a patient (today + future)
 * Excludes completed/cancelled/no-show appointments
 * Returns sorted by date ascending (nearest first)
 */
export function getPatientScheduledAppointments(
  patientId: string,
  currentAppointmentId?: string
): ScheduledAppointmentWithType[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's appointments for this patient (from mockAppointments)
  const todayAppointments = mockAppointments.filter((appt) => {
    if (appt.patientId !== patientId) return false;
    // Include all non-completed/cancelled statuses, plus the current appointment regardless of status
    const isCurrentAppt = appt.id === currentAppointmentId;
    const isActiveStatus =
      appt.status === AppointmentStatus.SCHEDULED ||
      appt.status === AppointmentStatus.CHECKED_IN ||
      appt.status === AppointmentStatus.IN_PROGRESS;
    return isCurrentAppt || isActiveStatus;
  });

  // Get future appointments for this patient
  const futureAppointments = mockFutureAppointments.filter(
    (appt) => appt.patientId === patientId
  );

  // Combine and enrich with appointment type
  const allAppointments = [...todayAppointments, ...futureAppointments].map((appt) => {
    const apptDate = new Date(appt.scheduledStart);
    apptDate.setHours(0, 0, 0, 0);
    const isFuture = apptDate.getTime() >= tomorrow.getTime();

    return {
      id: appt.id,
      patientId: appt.patientId,
      scheduledStart: appt.scheduledStart,
      scheduledEnd: appt.scheduledEnd,
      status: appt.status,
      isSigned: 'isSigned' in appt ? appt.isSigned : false,
      appointmentType: mockAppointmentTypes.find(
        (at) => at.id === appt.appointmentTypeId
      ),
      isFuture,
    };
  });

  // Sort by date ascending (nearest first)
  return allAppointments.sort(
    (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
  );
}

// =============================================================================
// Patient Context Data (Layer 1 - Background Info for display)
// =============================================================================

export interface PatientContextData {
  occupation?: string
  maritalStatus?: string
  children?: string
  stressLevel?: 'Low' | 'Moderate' | 'High'
  emotionalState?: string
  pastSurgeries?: string[]
  priorDiagnoses?: string[]
  familyHistory?: string[]
  currentMedications?: string[]
  allergies?: string[]
}

// Mock context data for patients
const mockPatientContextData: Record<string, PatientContextData> = {
  patient_001: {
    occupation: 'Marketing Manager',
    maritalStatus: 'Married',
    children: '2 kids (8, 5)',
    stressLevel: 'High',
    emotionalState: 'Anxious about work deadlines',
    pastSurgeries: ['Appendectomy (2015)'],
    priorDiagnoses: ['Migraines', 'TMJ'],
    familyHistory: ['Mother: Hypertension', 'Father: Type 2 Diabetes'],
    currentMedications: ['Sumatriptan PRN', 'Vitamin D 2000IU'],
    allergies: ['Penicillin'],
  },
  patient_002: {
    occupation: 'Software Engineer',
    maritalStatus: 'Single',
    stressLevel: 'Moderate',
    emotionalState: 'Generally positive, some work stress',
    pastSurgeries: ['Knee arthroscopy (2020)'],
    priorDiagnoses: ['Chronic low back pain', 'Sciatica'],
    familyHistory: ['Father: Heart disease'],
    currentMedications: ['Ibuprofen PRN'],
    allergies: [],
  },
  patient_003: {
    occupation: 'Yoga Instructor',
    maritalStatus: 'Married',
    children: '1 child (3)',
    stressLevel: 'Low',
    emotionalState: 'Calm, focused on wellness',
    pastSurgeries: [],
    priorDiagnoses: ['Hypothyroidism'],
    familyHistory: ['Mother: Thyroid issues', 'Grandmother: Osteoporosis'],
    currentMedications: ['Levothyroxine 50mcg'],
    allergies: [],
  },
  patient_004: {
    occupation: 'Retired Teacher',
    maritalStatus: 'Widowed',
    stressLevel: 'Moderate',
    emotionalState: 'Processing grief, finding purpose',
    pastSurgeries: ['Hip replacement (2022)', 'Cataract surgery (2021)'],
    priorDiagnoses: ['Osteoarthritis', 'Hypertension'],
    familyHistory: ['Both parents: Arthritis'],
    currentMedications: ['Lisinopril 10mg', 'Glucosamine'],
    allergies: ['Sulfa drugs'],
  },
  patient_005: {
    occupation: 'Executive Chef',
    maritalStatus: 'Divorced',
    children: '1 teen (16)',
    stressLevel: 'High',
    emotionalState: 'Stressed, irregular sleep from work hours',
    pastSurgeries: [],
    priorDiagnoses: ['GERD', 'Insomnia'],
    familyHistory: ['Father: GERD'],
    currentMedications: ['Omeprazole 20mg', 'Melatonin 5mg'],
    allergies: [],
  },
  patient_006: {
    occupation: 'College Student',
    maritalStatus: 'Single',
    stressLevel: 'Moderate',
    emotionalState: 'Anxious about finals',
    pastSurgeries: [],
    priorDiagnoses: ['Anxiety', 'Tension headaches'],
    familyHistory: ['Mother: Anxiety disorder'],
    currentMedications: [],
    allergies: ['Latex'],
  },
  patient_007: {
    occupation: 'Accountant',
    maritalStatus: 'Married',
    children: '3 kids',
    stressLevel: 'Moderate',
    emotionalState: 'Balanced but busy',
    pastSurgeries: ['C-section x2'],
    priorDiagnoses: ['Chronic neck pain', 'Carpal tunnel'],
    familyHistory: ['Father: Diabetes', 'Mother: Breast cancer (survivor)'],
    currentMedications: ['Prenatal vitamin'],
    allergies: [],
  },
  patient_008: {
    occupation: 'Construction Worker',
    maritalStatus: 'Married',
    children: '1 child (10)',
    stressLevel: 'Low',
    emotionalState: 'Easygoing',
    pastSurgeries: ['Rotator cuff repair (2019)'],
    priorDiagnoses: ['Chronic shoulder pain', 'Low back strain'],
    familyHistory: [],
    currentMedications: ['Fish oil'],
    allergies: [],
  },
  patient_009: {
    occupation: 'Nurse',
    maritalStatus: 'Single',
    stressLevel: 'High',
    emotionalState: 'Compassion fatigue, needs self-care',
    pastSurgeries: [],
    priorDiagnoses: ['Plantar fasciitis', 'Varicose veins'],
    familyHistory: ['Mother: Varicose veins'],
    currentMedications: ['Iron supplement'],
    allergies: ['Codeine'],
  },
  patient_010: {
    occupation: 'Entrepreneur',
    maritalStatus: 'Engaged',
    stressLevel: 'High',
    emotionalState: 'Excited but overwhelmed with wedding planning',
    pastSurgeries: [],
    priorDiagnoses: ['IBS', 'Stress-related tension'],
    familyHistory: ['Father: Heart disease', 'Mother: IBS'],
    currentMedications: ['Probiotics'],
    allergies: [],
  },
}

/**
 * Get patient context data for display in Patient Context panel
 */
export function getPatientContextData(patientId: string): PatientContextData | undefined {
  return mockPatientContextData[patientId]
}
