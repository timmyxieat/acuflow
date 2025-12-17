/**
 * Extended Types for UI with joined data
 *
 * These types extend Prisma-generated types to include related entities
 * that are commonly loaded together for UI display.
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
  completedAt?: Date; // When the appointment was completed
  appointmentType?: AppointmentType;
  isFuture: boolean; // True if scheduled for a future date (not today)
}
