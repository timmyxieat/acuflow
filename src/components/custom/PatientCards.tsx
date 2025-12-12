"use client";

import { useMemo, useState, useEffect } from "react";
import { getDevNow, formatTime } from "@/lib/dev-time";
import { getStatusColor } from "@/lib/constants";
import { Timer, Bell } from "lucide-react";
import { ScrollableArea } from "./ScrollableArea";
import {
  getAppointmentsByStatus,
  getPatientDisplayName,
  type AppointmentWithRelations,
  AppointmentStatus,
} from "@/data/mock-data";

// Variant to status mapping for header colors
const VARIANT_STATUS_MAP: Record<
  string,
  { status: AppointmentStatus; isSigned?: boolean }
> = {
  inProgress: { status: AppointmentStatus.IN_PROGRESS },
  checkedIn: { status: AppointmentStatus.CHECKED_IN },
  scheduled: { status: AppointmentStatus.SCHEDULED },
  unsigned: { status: AppointmentStatus.COMPLETED, isSigned: false },
  completed: { status: AppointmentStatus.COMPLETED, isSigned: true },
};

// Format time as compact "10:30A" or "2:45P"
function formatCompactTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "P" : "A";
  return `${hour12}:${minutes.toString().padStart(2, "0")}${ampm}`;
}

interface PatientCardsProps {
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void;
  onAppointmentDoubleClick?: (appointment: AppointmentWithRelations) => void;
  onAppointmentHover?: (appointmentId: string | null) => void;
  hoveredAppointmentId?: string | null;
  selectedAppointmentId?: string;
  /** Compact mode shows only avatar and time */
  compact?: boolean;
}

interface StatusSectionProps {
  title: string;
  appointments: AppointmentWithRelations[];
  onAppointmentClick?: (appointment: AppointmentWithRelations) => void;
  onAppointmentDoubleClick?: (appointment: AppointmentWithRelations) => void;
  onAppointmentHover?: (appointmentId: string | null) => void;
  hoveredAppointmentId?: string | null;
  selectedAppointmentId?: string;
  variant: "inProgress" | "checkedIn" | "scheduled" | "unsigned" | "completed";
  compact?: boolean;
}

function StatusSection({
  title,
  appointments,
  onAppointmentClick,
  onAppointmentDoubleClick,
  onAppointmentHover,
  hoveredAppointmentId,
  selectedAppointmentId,
  variant,
  compact,
}: StatusSectionProps) {
  if (appointments.length === 0) return null;

  const statusMapping = VARIANT_STATUS_MAP[variant];
  const statusColor = getStatusColor(
    statusMapping.status,
    statusMapping.isSigned
  );

  return (
    <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
      {/* Section header - hide in compact mode */}
      {!compact && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground pl-2">
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <span>{title}</span>
          <span>({appointments.length})</span>
        </div>
      )}

      {/* Cards */}
      <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
        {appointments.map((appointment) => (
          <PatientCard
            key={appointment.id}
            appointment={appointment}
            onClick={() => onAppointmentClick?.(appointment)}
            onDoubleClick={() => onAppointmentDoubleClick?.(appointment)}
            onHover={(isHovered) =>
              onAppointmentHover?.(isHovered ? appointment.id : null)
            }
            isHovered={appointment.id === hoveredAppointmentId}
            isSelected={appointment.id === selectedAppointmentId}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

interface PatientCardProps {
  appointment: AppointmentWithRelations;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  isHovered?: boolean;
  isSelected?: boolean;
  compact?: boolean;
}

function PatientCard({
  appointment,
  onClick,
  onDoubleClick,
  onHover,
  isHovered,
  isSelected,
  compact,
}: PatientCardProps) {
  const patient = appointment.patient;
  if (!patient) return null;

  const displayName = getPatientDisplayName(patient);

  // Get the time display based on status
  const getTimeDisplay = (): {
    text: string;
    icon?: typeof Timer;
    shake?: boolean;
  } => {
    const now = getDevNow();
    const NEEDLE_RETENTION_MINUTES = 20; // Standard needle retention time

    // In Progress with needles - show needle timer countdown or complete state
    if (appointment.status === AppointmentStatus.IN_PROGRESS) {
      if (appointment.needleInsertionAt && !appointment.needleRemovalAt) {
        const msElapsed = now - appointment.needleInsertionAt.getTime();
        const targetMs = NEEDLE_RETENTION_MINUTES * 60000;
        const msRemaining = targetMs - msElapsed;

        if (msRemaining <= 0) {
          // Timer complete
          return {
            text: "Timer is up",
            icon: Bell,
            shake: true,
          };
        }

        // Timer still counting down
        const totalSeconds = Math.ceil(msRemaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        return {
          text: timeStr,
          icon: Timer,
        };
      }
    }

    // All other cases - show start time (compact format if in compact mode)
    if (compact) {
      return { text: formatCompactTime(appointment.scheduledStart) };
    }
    return { text: formatTime(appointment.scheduledStart) };
  };

  const timeDisplay = getTimeDisplay();

  // Get initials for avatar
  const initials = `${patient.firstName?.[0] || ""}${
    patient.lastName?.[0] || ""
  }`.toUpperCase();

  // Get status color for hover/selected states
  const statusColor = getStatusColor(appointment.status, appointment.isSigned);
  const isCompleted =
    appointment.status === AppointmentStatus.COMPLETED && appointment.isSigned;

  // Calculate styles based on state
  // No background by default, inset left border + background on hover/selection
  const getStyles = () => {
    if (isSelected) {
      return {
        backgroundColor: isCompleted ? `${statusColor}50` : `${statusColor}30`,
        boxShadow: `inset 3px 0 0 0 ${statusColor}`,
      };
    }
    if (isHovered) {
      return {
        backgroundColor: isCompleted ? `${statusColor}33` : `${statusColor}18`,
        boxShadow: `inset 3px 0 0 0 ${statusColor}`,
      };
    }
    return {
      backgroundColor: "transparent",
      boxShadow: "none",
    };
  };

  // Compact mode: avatar + time stacked vertically, centered
  if (compact) {
    return (
      <button
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
        className="w-full transition-all py-2 px-1 flex flex-col items-center gap-1"
        style={getStyles()}
      >
        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {initials}
        </div>
        {/* Time */}
        <div
          className="flex items-center gap-0.5 text-[10px] text-muted-foreground"
          suppressHydrationWarning
        >
          {timeDisplay.icon && (
            <timeDisplay.icon
              className={`h-2.5 w-2.5 ${
                timeDisplay.shake ? "animate-bell-shake" : ""
              }`}
            />
          )}
          <span>{timeDisplay.text}</span>
        </div>
      </button>
    );
  }

  // Full mode: avatar + name/time horizontally
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className="w-full text-left transition-all p-2"
      style={getStyles()}
    >
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {initials}
        </div>

        {/* Name and Time */}
        <div className="min-w-0 flex-1">
          {/* Patient name */}
          <div className="truncate text-sm font-medium">{displayName}</div>
          {/* Time display - below name, smaller font */}
          <div
            className="flex items-center gap-1 text-[11px] text-muted-foreground"
            suppressHydrationWarning
          >
            {timeDisplay.icon && (
              <timeDisplay.icon
                className={`h-3 w-3 ${
                  timeDisplay.shake ? "animate-bell-shake" : ""
                }`}
              />
            )}
            <span>{timeDisplay.text}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function PatientCards({
  onAppointmentClick,
  onAppointmentDoubleClick,
  onAppointmentHover,
  hoveredAppointmentId,
  selectedAppointmentId,
  compact,
}: PatientCardsProps) {
  const groupedAppointments = useMemo(() => getAppointmentsByStatus(), []);

  // Force re-render every second to update timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar">
      <ScrollableArea
        className={compact ? "flex flex-col gap-1 py-2" : "flex flex-col gap-3 py-3"}
        deps={[groupedAppointments]}
        hideScrollbar
      >
        {/* In Progress - Most important, shows first */}
        <StatusSection
          title="In Progress"
          appointments={groupedAppointments.inProgress}
          onAppointmentClick={onAppointmentClick}
          onAppointmentDoubleClick={onAppointmentDoubleClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="inProgress"
          compact={compact}
        />

        {/* Checked In - Waiting */}
        <StatusSection
          title="Checked In"
          appointments={groupedAppointments.checkedIn}
          onAppointmentClick={onAppointmentClick}
          onAppointmentDoubleClick={onAppointmentDoubleClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="checkedIn"
          compact={compact}
        />

        {/* Scheduled - Upcoming */}
        <StatusSection
          title="Scheduled"
          appointments={groupedAppointments.scheduled}
          onAppointmentClick={onAppointmentClick}
          onAppointmentDoubleClick={onAppointmentDoubleClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="scheduled"
          compact={compact}
        />

        {/* Divider between active/upcoming and completed sections */}
        {!compact &&
          (groupedAppointments.inProgress.length > 0 ||
            groupedAppointments.checkedIn.length > 0 ||
            groupedAppointments.scheduled.length > 0) &&
          (groupedAppointments.unsigned.length > 0 ||
            groupedAppointments.completed.length > 0) && (
            <div className="border-t border-border -mx-2" />
          )}

        {/* Unsigned - Need attention */}
        <StatusSection
          title="Unsigned"
          appointments={groupedAppointments.unsigned}
          onAppointmentClick={onAppointmentClick}
          onAppointmentDoubleClick={onAppointmentDoubleClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="unsigned"
          compact={compact}
        />

        {/* Completed - Done for today */}
        <StatusSection
          title="Completed"
          appointments={groupedAppointments.completed}
          onAppointmentClick={onAppointmentClick}
          onAppointmentDoubleClick={onAppointmentDoubleClick}
          onAppointmentHover={onAppointmentHover}
          hoveredAppointmentId={hoveredAppointmentId}
          selectedAppointmentId={selectedAppointmentId}
          variant="completed"
          compact={compact}
        />

        {/* Empty state */}
        {Object.values(groupedAppointments).every(
          (arr) => arr.length === 0
        ) && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No appointments today
          </div>
        )}
      </ScrollableArea>
    </div>
  );
}
