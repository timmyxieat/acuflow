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

/**
 * Enrich a list of raw appointments with patient, practitioner, and type data
 */
function enrichAppointments(appointments: typeof mockAppointments): AppointmentWithRelations[] {
  return appointments.map((appt) => ({
    ...appt,
    patient: mockPatients.find((p) => p.id === appt.patientId),
    practitioner: mockPractitioners.find((pr) => pr.id === appt.practitionerId),
    appointmentType: mockAppointmentTypes.find(
      (at) => at.id === appt.appointmentTypeId
    ),
    conditions: mockConditions.filter((c) => c.patientId === appt.patientId),
  }));
}

export function getEnrichedAppointments(): AppointmentWithRelations[] {
  // Only return today's appointments (used for Today screen)
  return enrichAppointments(mockAppointments);
}

/**
 * Get all appointments from all sources (today + past + future), enriched
 */
export function getAllEnrichedAppointments(): AppointmentWithRelations[] {
  const allAppointments = [
    ...mockAppointments,
    ...mockPastAppointments,
    ...mockFutureAppointments,
  ];
  return enrichAppointments(allAppointments);
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
 * Search patients by name, phone, email, OR condition name
 * Enhanced search for the command palette
 */
export function searchPatientsWithConditions(query: string): Patient[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  // First get patients matching by name/phone/email
  const matchedByInfo = new Set(searchPatients(query).map(p => p.id));

  // Then find patients matching by condition name
  const patientIdsWithMatchingConditions = mockConditions
    .filter((condition) => condition.name.toLowerCase().includes(lowerQuery))
    .map((condition) => condition.patientId);

  // Combine both sets
  const allMatchedIds = new Set([...matchedByInfo, ...patientIdsWithMatchingConditions]);

  // Return patients in a consistent order (those with today appointments first)
  const matchedPatients = mockPatients.filter((p) => allMatchedIds.has(p.id));

  // Sort: patients with today appointments first, then alphabetically by name
  return matchedPatients.sort((a, b) => {
    const aHasToday = mockAppointments.some((appt) => appt.patientId === a.id);
    const bHasToday = mockAppointments.some((appt) => appt.patientId === b.id);

    if (aHasToday && !bHasToday) return -1;
    if (!aHasToday && bHasToday) return 1;

    // Both have today or both don't - sort alphabetically
    const aName = `${a.lastName} ${a.firstName}`.toLowerCase();
    const bName = `${b.lastName} ${b.firstName}`.toLowerCase();
    return aName.localeCompare(bName);
  });
}

/**
 * Get recent patients for the search empty state
 * Returns patients from recent visits (last 30 days) + today's patients
 * Sorted by: today's patients first (by status priority), then by most recent visit
 */
export interface RecentPatient {
  patient: Patient
  lastVisitDate: Date | null
  todayAppointment: AppointmentWithRelations | null
}

export function getRecentPatients(limit = 8): RecentPatient[] {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get today's appointments (enriched)
  const todayAppointments = enrichAppointments(mockAppointments)

  // Get past appointments within last 30 days
  const recentPastAppointments = mockPastAppointments.filter((appt) => {
    const apptDate = new Date(appt.scheduledStart)
    return apptDate >= thirtyDaysAgo && appt.status === AppointmentStatus.COMPLETED
  })

  // Build a map of patient ID -> most recent visit date
  const patientLastVisit = new Map<string, Date>()
  for (const appt of recentPastAppointments) {
    const existing = patientLastVisit.get(appt.patientId)
    const apptDate = new Date(appt.scheduledStart)
    if (!existing || apptDate > existing) {
      patientLastVisit.set(appt.patientId, apptDate)
    }
  }

  // Build a map of patient ID -> today's appointment (if any)
  const patientTodayAppointment = new Map<string, AppointmentWithRelations>()
  for (const appt of todayAppointments) {
    // Only store active appointments (not cancelled/no-show)
    if (appt.status !== AppointmentStatus.CANCELLED && appt.status !== AppointmentStatus.NO_SHOW) {
      patientTodayAppointment.set(appt.patientId, appt)
    }
  }

  // Collect all relevant patient IDs
  const patientIds = new Set([
    ...patientLastVisit.keys(),
    ...patientTodayAppointment.keys(),
  ])

  // Build result list
  const results: RecentPatient[] = []
  for (const patientId of patientIds) {
    const patient = mockPatients.find((p) => p.id === patientId)
    if (!patient) continue

    results.push({
      patient,
      lastVisitDate: patientLastVisit.get(patientId) || null,
      todayAppointment: patientTodayAppointment.get(patientId) || null,
    })
  }

  // Sort: today's patients first (by status priority), then by most recent visit
  const statusPriority: Record<AppointmentStatus, number> = {
    [AppointmentStatus.IN_PROGRESS]: 0,
    [AppointmentStatus.CHECKED_IN]: 1,
    [AppointmentStatus.SCHEDULED]: 2,
    [AppointmentStatus.COMPLETED]: 3, // Unsigned/Completed
    [AppointmentStatus.CANCELLED]: 4,
    [AppointmentStatus.NO_SHOW]: 5,
  }

  results.sort((a, b) => {
    const aHasToday = a.todayAppointment !== null
    const bHasToday = b.todayAppointment !== null

    // Today's patients come first
    if (aHasToday && !bHasToday) return -1
    if (!aHasToday && bHasToday) return 1

    // Both have today appointments - sort by status priority
    if (aHasToday && bHasToday) {
      const aPriority = statusPriority[a.todayAppointment!.status]
      const bPriority = statusPriority[b.todayAppointment!.status]
      if (aPriority !== bPriority) return aPriority - bPriority
      // Same status - sort by scheduled time
      return a.todayAppointment!.scheduledStart.getTime() - b.todayAppointment!.scheduledStart.getTime()
    }

    // Neither has today - sort by most recent visit
    const aDate = a.lastVisitDate?.getTime() ?? 0
    const bDate = b.lastVisitDate?.getTime() ?? 0
    return bDate - aDate
  })

  return results.slice(0, limit)
}

/**
 * Get appointments for a specific date (searches all sources: today, past, future)
 */
export function getAppointmentsForDate(date: Date): AppointmentWithRelations[] {
  const enriched = getAllEnrichedAppointments();
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return enriched.filter((appt) => {
    const apptDate = new Date(appt.scheduledStart);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate.getTime() === targetDate.getTime();
  });
}

/**
 * Get appointments grouped by status for a specific date
 * Used by PatientCards and TodayScreen when viewing any date
 */
export function getAppointmentsByStatusForDate(date: Date) {
  const enriched = getAppointmentsForDate(date);

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

// =============================================================================
// SECTION-SPECIFIC HISTORY HELPERS (for adaptive Patient Context panel)
// =============================================================================

export interface SubjectiveHistory {
  visitId: string
  visitDate: Date
  content: string
  chiefComplaint?: string
}

export interface VitalsHistory {
  visitId: string
  visitDate: Date
  bp?: string
  hr?: string
  temp?: string
}

export interface TonguePulseHistory {
  visitId: string
  visitDate: Date
  tongue?: string
  pulse?: string
}

export interface TCMPattern {
  pattern: string
  visitIds: string[]
  lastUsed: Date
}

export interface ICDCode {
  code: string
  description: string
  visitIds: string[]
}

export interface TreatmentHistory {
  visitId: string
  visitDate: Date
  points: string[]
  duration?: number
  usedEstim: boolean
}

export interface PainScoreEntry {
  visitId: string
  visitDate: Date
  score: number
  conditionId: string
}

/**
 * Get historical subjective notes for a patient
 * Returns array of {visitId, visitDate, content, chiefComplaint} for past visits
 */
export function getPatientSubjectiveHistory(patientId: string, limit = 5): SubjectiveHistory[] {
  const visits = getPatientVisitHistory(patientId).slice(0, limit);

  return visits.map((visit) => {
    const subjective = visit.subjective as { raw?: string } | null;
    return {
      visitId: visit.id,
      visitDate: visit.appointment?.scheduledStart ? new Date(visit.appointment.scheduledStart) : new Date(visit.createdAt),
      content: subjective?.raw || '',
      chiefComplaint: visit.chiefComplaint,
    };
  });
}

/**
 * Get historical objective notes for a patient
 */
export function getPatientObjectiveHistory(patientId: string, limit = 5): { visitId: string; visitDate: Date; content: string }[] {
  const visits = getPatientVisitHistory(patientId).slice(0, limit);

  return visits.map((visit) => {
    const objective = visit.objective as { raw?: string } | null;
    return {
      visitId: visit.id,
      visitDate: visit.appointment?.scheduledStart ? new Date(visit.appointment.scheduledStart) : new Date(visit.createdAt),
      content: objective?.raw || '',
    };
  });
}

/**
 * Get historical assessment notes for a patient
 */
export function getPatientAssessmentHistory(patientId: string, limit = 5): { visitId: string; visitDate: Date; content: string }[] {
  const visits = getPatientVisitHistory(patientId).slice(0, limit);

  return visits.map((visit) => {
    const assessment = visit.assessment as { raw?: string } | null;
    return {
      visitId: visit.id,
      visitDate: visit.appointment?.scheduledStart ? new Date(visit.appointment.scheduledStart) : new Date(visit.createdAt),
      content: assessment?.raw || '',
    };
  });
}

/**
 * Get historical plan notes for a patient
 */
export function getPatientPlanHistory(patientId: string, limit = 5): { visitId: string; visitDate: Date; content: string }[] {
  const visits = getPatientVisitHistory(patientId).slice(0, limit);

  return visits.map((visit) => {
    const plan = visit.plan as { raw?: string } | null;
    return {
      visitId: visit.id,
      visitDate: visit.appointment?.scheduledStart ? new Date(visit.appointment.scheduledStart) : new Date(visit.createdAt),
      content: plan?.raw || '',
    };
  });
}

/**
 * Get vitals history (BP, HR, Temp) across visits
 * Extracts from objective notes using patterns like "BP: 128/82" or "HR: 72"
 */
export function getPatientVitalsHistory(patientId: string, limit = 5): VitalsHistory[] {
  const visits = getPatientVisitHistory(patientId).slice(0, limit);

  return visits.map((visit) => {
    const objective = visit.objective as { raw?: string } | null;
    const rawText = objective?.raw || '';

    // Extract BP (pattern: "BP: 128/82" or "BP 128/82")
    const bpMatch = rawText.match(/BP:?\s*(\d{2,3}\/\d{2,3})/i);
    // Extract HR (pattern: "HR: 72" or "HR 72 bpm" or "pulse...72 bpm")
    const hrMatch = rawText.match(/(?:HR|heart rate):?\s*(\d{2,3})\s*(?:bpm)?/i) ||
                   rawText.match(/pulse[^,]*?(\d{2,3})\s*bpm/i);
    // Extract Temp (pattern: "Temp: 98.6" or "Temperature: 98.6")
    const tempMatch = rawText.match(/temp(?:erature)?:?\s*([\d.]+)/i);

    return {
      visitId: visit.id,
      visitDate: visit.appointment?.scheduledStart ? new Date(visit.appointment.scheduledStart) : new Date(visit.createdAt),
      bp: bpMatch?.[1],
      hr: hrMatch?.[1],
      temp: tempMatch?.[1],
    };
  });
}

/**
 * Get tongue/pulse history across visits
 * Extracts from objective notes using patterns like "Tongue: red, thin coat" or "Pulse: wiry"
 */
export function getPatientTonguePulseHistory(patientId: string, limit = 5): TonguePulseHistory[] {
  const visits = getPatientVisitHistory(patientId).slice(0, limit);

  return visits.map((visit) => {
    const objective = visit.objective as { raw?: string } | null;
    const rawText = objective?.raw || '';

    // Extract Tongue (pattern: "Tongue: red, thin coat" up to next label or period)
    const tongueMatch = rawText.match(/Tongue:?\s*([^.]*?)(?=\n|Pulse:|BP:|HR:|$)/i);
    // Extract Pulse (pattern: "Pulse: wiry, rapid" up to next label or period)
    const pulseMatch = rawText.match(/Pulse:?\s*([^.]*?)(?=\n|Tongue:|BP:|HR:|$)/i);

    return {
      visitId: visit.id,
      visitDate: visit.appointment?.scheduledStart ? new Date(visit.appointment.scheduledStart) : new Date(visit.createdAt),
      tongue: tongueMatch?.[1]?.trim(),
      pulse: pulseMatch?.[1]?.trim(),
    };
  });
}

/**
 * Get TCM patterns used across visits
 * Returns unique patterns with visit IDs where they were used
 */
export function getPatientTCMPatterns(patientId: string): TCMPattern[] {
  const visits = getPatientVisitHistory(patientId);
  const patternMap = new Map<string, { visitIds: string[]; lastUsed: Date }>();

  // Common TCM patterns to search for
  const tcmPatterns = [
    'Liver Qi Stagnation', 'Qi Stagnation', 'Blood Stasis', 'Blood Stagnation',
    'Kidney Yang Deficiency', 'Kidney Yin Deficiency', 'Qi Deficiency',
    'Spleen Qi Deficiency', 'Heart Blood Deficiency', 'Liver Blood Deficiency',
    'Damp Heat', 'Cold Damp', 'Phlegm', 'Wind Cold', 'Wind Heat',
    'Yin Deficiency', 'Yang Deficiency',
  ];

  for (const visit of visits) {
    const assessment = visit.assessment as { raw?: string } | null;
    const rawText = assessment?.raw || '';
    const visitDate = visit.appointment?.scheduledStart ? new Date(visit.appointment.scheduledStart) : new Date(visit.createdAt);

    for (const pattern of tcmPatterns) {
      if (rawText.toLowerCase().includes(pattern.toLowerCase())) {
        const existing = patternMap.get(pattern);
        if (existing) {
          existing.visitIds.push(visit.id);
          if (visitDate > existing.lastUsed) {
            existing.lastUsed = visitDate;
          }
        } else {
          patternMap.set(pattern, { visitIds: [visit.id], lastUsed: visitDate });
        }
      }
    }
  }

  return Array.from(patternMap.entries())
    .map(([pattern, data]) => ({ pattern, ...data }))
    .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
}

/**
 * Get ICD-10 codes used across visits
 * Extracts codes like "M54.5" from assessment text
 */
export function getPatientICDCodes(patientId: string): ICDCode[] {
  const visits = getPatientVisitHistory(patientId);
  const codeMap = new Map<string, string[]>();

  // Common ICD-10 codes in acupuncture
  const icdDescriptions: Record<string, string> = {
    'M54.5': 'Low back pain',
    'M54.2': 'Cervicalgia (neck pain)',
    'G43.909': 'Migraine, unspecified',
    'M25.561': 'Pain in right knee',
    'M25.562': 'Pain in left knee',
    'R51': 'Headache',
    'G47.00': 'Insomnia, unspecified',
    'H93.19': 'Tinnitus, unspecified ear',
    'N94.6': 'Dysmenorrhea, unspecified',
    'M79.3': 'Panniculitis, unspecified',
  };

  for (const visit of visits) {
    const assessment = visit.assessment as { raw?: string } | null;
    const rawText = assessment?.raw || '';

    // Match ICD-10 patterns (letter followed by 2 digits, optionally with decimal)
    const matches = rawText.match(/[A-Z]\d{2}(?:\.\d{1,4})?/g) || [];

    for (const code of matches) {
      const existing = codeMap.get(code);
      if (existing) {
        existing.push(visit.id);
      } else {
        codeMap.set(code, [visit.id]);
      }
    }
  }

  return Array.from(codeMap.entries())
    .map(([code, visitIds]) => ({
      code,
      description: icdDescriptions[code] || 'Unknown',
      visitIds,
    }))
    .sort((a, b) => b.visitIds.length - a.visitIds.length);
}

/**
 * Get treatment points history across visits
 * Extracts point codes like "LI4", "ST36" from plan text
 */
export function getPatientTreatmentHistory(patientId: string, limit = 5): TreatmentHistory[] {
  const visits = getPatientVisitHistory(patientId).slice(0, limit);

  return visits.map((visit) => {
    const plan = visit.plan as { raw?: string } | null;
    const rawText = plan?.raw || '';

    // Match acupuncture point patterns (2 letters + 1-2 digits)
    const pointMatches = rawText.match(/\b(LU|LI|ST|SP|HT|SI|BL|KD|PC|SJ|GB|LV|RN|DU)\d{1,2}\b/gi) || [];
    const uniquePoints = [...new Set(pointMatches.map(p => p.toUpperCase()))];

    // Extract duration if mentioned (e.g., "20 min" or "25 minutes")
    const durationMatch = rawText.match(/(\d{1,2})\s*min(?:ute)?s?/i);

    // Check for e-stim mention
    const usedEstim = /e-?stim|electro/i.test(rawText);

    return {
      visitId: visit.id,
      visitDate: visit.appointment?.scheduledStart ? new Date(visit.appointment.scheduledStart) : new Date(visit.createdAt),
      points: uniquePoints,
      duration: durationMatch ? parseInt(durationMatch[1], 10) : undefined,
      usedEstim,
    };
  });
}

/**
 * Get pain scores for a specific condition over time
 */
export function getConditionPainScores(conditionId: string): PainScoreEntry[] {
  const measurements = mockMeasurements
    .filter((m) => m.conditionId === conditionId && m.metricName === 'pain_score')
    .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());

  return measurements.map((m) => ({
    visitId: m.visitId || '',
    visitDate: m.recordedAt,
    score: parseInt(m.value, 10),
    conditionId: m.conditionId,
  }));
}
