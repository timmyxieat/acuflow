/**
 * Helper Functions for Mock Data
 *
 * Query functions to get, search, and transform mock data.
 */

import type {
  Patient,
  AppointmentWithRelations,
  VisitWithAppointment,
  ScheduledAppointmentWithType,
} from "./types";
import { AppointmentStatus, ConditionStatus } from "./types";
import { mockPractitioners } from "./clinic";
import { mockPatients, mockConditions, mockMeasurements, mockPatientNotes } from "./patients";
import {
  mockAppointmentTypes,
  mockAppointments,
  mockPastAppointments,
  mockFutureAppointments,
} from "./appointments";
import { mockVisits } from "./visits";

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
 * Get a single appointment by ID from all sources (today + future + past)
 * Used when navigating to a specific appointment
 */
export function getAppointmentById(appointmentId: string): AppointmentWithRelations | null {
  // Search in today's appointments first
  let appt = mockAppointments.find((a) => a.id === appointmentId);

  // If not found, search in future appointments
  if (!appt) {
    appt = mockFutureAppointments.find((a) => a.id === appointmentId);
  }

  // If not found, search in past appointments
  if (!appt) {
    appt = mockPastAppointments.find((a) => a.id === appointmentId);
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
    // Include active statuses, completed appointments, and the current appointment
    const isCurrentAppt = appt.id === currentAppointmentId;
    const isActiveStatus =
      appt.status === AppointmentStatus.SCHEDULED ||
      appt.status === AppointmentStatus.CHECKED_IN ||
      appt.status === AppointmentStatus.IN_PROGRESS;
    const isCompleted = appt.status === AppointmentStatus.COMPLETED;
    // Exclude cancelled and no_show
    return isCurrentAppt || isActiveStatus || isCompleted;
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
      completedAt: 'completedAt' in appt && appt.completedAt ? appt.completedAt : undefined,
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
