/**
 * Mock Data Module Index
 *
 * Re-exports all mock data and helper functions from modular files.
 * Import from '@/data/mock-data' for backward compatibility.
 */

// =============================================================================
// Types and Enums
// =============================================================================

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
  AppointmentWithRelations,
  VisitWithAppointment,
  ScheduledAppointmentWithType,
} from "./types";

export {
  SubscriptionTier,
  SubscriptionStatus,
  PractitionerRole,
  AppointmentStatus,
  ConditionStatus,
  BiologicalSex,
  MeasurementSource,
} from "./types";

// =============================================================================
// Mock Data: Clinic & Practitioners
// =============================================================================

export { mockClinic, mockPractitioners, currentPractitioner } from "./clinic";

// =============================================================================
// Mock Data: Patients, Conditions, Measurements, Notes
// =============================================================================

export {
  mockPatients,
  mockConditions,
  mockMeasurements,
  mockPatientNotes,
} from "./patients";

// =============================================================================
// Mock Data: Appointments
// =============================================================================

export {
  mockAppointmentTypes,
  mockAppointments,
  mockPastAppointments,
  mockFutureAppointments,
} from "./appointments";

// =============================================================================
// Mock Data: Visits
// =============================================================================

export { mockVisits } from "./visits";

// =============================================================================
// Helper Functions
// =============================================================================

export {
  getEnrichedAppointments,
  getAllEnrichedAppointments,
  getAppointmentById,
  getPatientTodayAppointmentId,
  getAppointmentsByStatus,
  getAppointmentsByStatusForDate,
  getPatientConditionsWithMeasurements,
  getPatientPinnedNotes,
  searchPatients,
  searchPatientsWithConditions,
  getRecentPatients,
  getAppointmentsForDate,
  calculateAge,
  getPatientDisplayName,
  getStatusDisplay,
  getConditionStatusDisplay,
  getPatientVisitHistory,
  getVisitById,
  getPatientScheduledAppointments,
  // Section-specific history helpers
  getPatientSubjectiveHistory,
  getPatientObjectiveHistory,
  getPatientAssessmentHistory,
  getPatientPlanHistory,
  getPatientVitalsHistory,
  getPatientTonguePulseHistory,
  getPatientTCMPatterns,
  getPatientICDCodes,
  getPatientTreatmentHistory,
  getConditionPainScores,
  // Mock data mutations
  updateAppointmentStatus,
  type SubjectiveHistory,
  type VitalsHistory,
  type TonguePulseHistory,
  type TCMPattern,
  type ICDCode,
  type TreatmentHistory,
  type PainScoreEntry,
  type RecentPatient,
} from "./helpers";

// =============================================================================
// Patient Context Data
// =============================================================================

export type { PatientContextData } from "./patient-context";
export { getPatientContextData } from "./patient-context";
