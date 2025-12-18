"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { getDevNow, formatTime } from "@/lib/dev-time";
import { getStatusColor } from "@/lib/constants";
import { SPRING_TRANSITION } from "@/lib/animations";
import { useTransition } from "@/contexts/TransitionContext";
import { Timer, Bell, ChevronLeft, Pause } from "lucide-react";
import { ScrollableArea } from "./ScrollableArea";
import {
  getAppointmentsByStatusForDate,
  getPatientDisplayName,
  type AppointmentWithRelations,
  AppointmentStatus,
} from "@/data/mock-data";
import { isToday } from "@/lib/date-utils";

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

// Format seconds as MM:SS for FAB timer display
function formatTimerSeconds(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? "-" : "";
  return `${sign}${mins}:${secs.toString().padStart(2, "0")}`;
}

interface PatientCardsProps {
  /** The date to show appointments for (defaults to today) */
  date?: Date;
  onAppointmentClick?: (appointment: AppointmentWithRelations, rect?: DOMRect) => void;
  onAppointmentDoubleClick?: (appointment: AppointmentWithRelations) => void;
  onAppointmentHover?: (appointmentId: string | null) => void;
  hoveredAppointmentId?: string | null;
  selectedAppointmentId?: string;
  /** Patient ID to highlight (used when viewing appointment from different day) */
  selectedPatientId?: string;
  /** Compact mode shows only avatar and time */
  compact?: boolean;
  /** Callback to toggle compact/expanded mode */
  onToggleCompact?: () => void;
  /** Hide the header (date display and collapse button) */
  hideHeader?: boolean;
  /** Active timer state from FAB - synced across components */
  activeTimerAppointmentId?: string;
  activeTimerSeconds?: number | null;
  isTimerRunning?: boolean;
}

interface StatusSectionProps {
  title: string;
  appointments: AppointmentWithRelations[];
  onAppointmentClick?: (appointment: AppointmentWithRelations, rect?: DOMRect) => void;
  onAppointmentDoubleClick?: (appointment: AppointmentWithRelations) => void;
  onAppointmentHover?: (appointmentId: string | null) => void;
  hoveredAppointmentId?: string | null;
  selectedAppointmentId?: string;
  selectedPatientId?: string;
  variant: "inProgress" | "checkedIn" | "scheduled" | "unsigned" | "completed";
  compact?: boolean;
  activeTimerAppointmentId?: string;
  activeTimerSeconds?: number | null;
  isTimerRunning?: boolean;
}

function StatusSection({
  title,
  appointments,
  onAppointmentClick,
  onAppointmentDoubleClick,
  onAppointmentHover,
  hoveredAppointmentId,
  selectedAppointmentId,
  selectedPatientId,
  variant,
  compact,
  activeTimerAppointmentId,
  activeTimerSeconds,
  isTimerRunning,
}: StatusSectionProps) {
  if (appointments.length === 0) return null;

  const statusMapping = VARIANT_STATUS_MAP[variant];
  const statusColor = getStatusColor(
    statusMapping.status,
    statusMapping.isSigned
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Section header - compact shows dot + count, full shows dot + title + count */}
      <div className="flex items-center gap-1.5 px-3 text-sm font-medium text-foreground">
        <motion.div
          layoutId={`status-dot-${variant}`}
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
          transition={SPRING_TRANSITION}
        />
        {!compact && (
          <span className="whitespace-nowrap">{title}</span>
        )}
        <motion.span
          layoutId={`status-count-${variant}`}
          className={compact ? "text-muted-foreground font-normal" : ""}
          transition={SPRING_TRANSITION}
        >
          ({appointments.length})
        </motion.span>
      </div>

      {/* Cards - no gap so left borders connect into one line */}
      <div className="flex flex-col">
        {appointments.map((appointment) => {
          // Select by appointment ID first, fall back to patient ID
          const isSelected = appointment.id === selectedAppointmentId ||
            (!!selectedPatientId && appointment.patient?.id === selectedPatientId);
          return (
            <PatientCard
              key={appointment.id}
              appointment={appointment}
              onClick={(rect) => onAppointmentClick?.(appointment, rect)}
              onDoubleClick={() => onAppointmentDoubleClick?.(appointment)}
              onHover={(isHovered) =>
                onAppointmentHover?.(isHovered ? appointment.id : null)
              }
              isHovered={appointment.id === hoveredAppointmentId}
              isSelected={isSelected}
              compact={compact}
              activeTimerSeconds={appointment.id === activeTimerAppointmentId ? activeTimerSeconds : undefined}
              isTimerRunning={appointment.id === activeTimerAppointmentId ? isTimerRunning : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

interface PatientCardProps {
  appointment: AppointmentWithRelations;
  onClick?: (rect: DOMRect) => void;
  onDoubleClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  isHovered?: boolean;
  isSelected?: boolean;
  compact?: boolean;
  activeTimerSeconds?: number | null;
  isTimerRunning?: boolean;
}

function PatientCard({
  appointment,
  onClick,
  onDoubleClick,
  onHover,
  isHovered: _isHovered,
  isSelected,
  compact,
  activeTimerSeconds,
  isTimerRunning,
}: PatientCardProps) {
  const patient = appointment.patient;
  if (!patient) return null;

  const displayName = getPatientDisplayName(patient);

  // Get the time display based on status
  const getTimeDisplay = (
    isCompact?: boolean
  ): {
    text: string;
    icon?: typeof Timer;
    shake?: boolean;
    isFabTimer?: boolean;
  } => {
    // If FAB timer is active for this appointment, show it instead
    if (activeTimerSeconds !== undefined && activeTimerSeconds !== null) {
      const isOver = activeTimerSeconds <= 0;
      const isPaused = !isTimerRunning;
      return {
        text: formatTimerSeconds(activeTimerSeconds),
        icon: isOver ? Bell : isPaused ? Pause : Timer,
        shake: isOver,
        isFabTimer: true,
      };
    }

    const now = getDevNow();
    const NEEDLE_RETENTION_MINUTES = 20; // Standard needle retention time

    // In Progress with needles - show needle timer countdown or complete state
    if (appointment.status === AppointmentStatus.IN_PROGRESS) {
      if (appointment.needleInsertionAt && !appointment.needleRemovalAt) {
        const msElapsed = now - appointment.needleInsertionAt.getTime();
        const targetMs = NEEDLE_RETENTION_MINUTES * 60000;
        const msRemaining = targetMs - msElapsed;

        if (msRemaining <= 0) {
          // Timer complete - shorter text for compact mode
          return {
            text: isCompact ? "Done" : "Timer is up",
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
    if (isCompact) {
      return { text: formatCompactTime(appointment.scheduledStart) };
    }
    return { text: formatTime(appointment.scheduledStart) };
  };

  const timeDisplay = getTimeDisplay(compact);

  // Get initials for avatar
  const initials = `${patient.firstName?.[0] || ""}${
    patient.lastName?.[0] || ""
  }`.toUpperCase();

  // Get status color for hover/selected states
  const statusColor = getStatusColor(appointment.status, appointment.isSigned);
  const isCompleted =
    appointment.status === AppointmentStatus.COMPLETED && appointment.isSigned;

  // Static muted border on all cards; selection indicator handles full-color + background
  const mutedBorder = `inset 3px 0 0 0 ${statusColor}40`;

  // Card height: 62px (avatar 32px + gap 4px + time 14px + padding 12px = 62px)
  const CARD_HEIGHT = "h-[62px]";

  const appointmentId = appointment.id;

  // Unified layout - elements animate between compact and full positions
  return (
    <motion.button
      data-appointment-id={appointmentId}
      onClick={(e) => onClick?.(e.currentTarget.getBoundingClientRect())}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={`group relative px-3 ${
        compact
          ? `flex flex-col items-start justify-center gap-1 ${CARD_HEIGHT}`
          : `w-full text-left flex items-center ${CARD_HEIGHT}`
      }`}
      style={{ boxShadow: mutedBorder }}
    >
      {/* Hover background - CSS-only, respects @media (hover: hover) so no flash on touch */}
      {!isSelected && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ backgroundColor: `${statusColor}15` }}
        />
      )}

      {/* Selection indicator - shared layoutId so it morphs between cards */}
      {/* Handles background fill + full-color left border */}
      {isSelected && (
        <motion.div
          layoutId="selection-indicator"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: isCompleted ? `${statusColor}40` : `${statusColor}25`,
            boxShadow: `inset 3px 0 0 0 ${statusColor}`,
          }}
          transition={SPRING_TRANSITION}
        />
      )}

      {/* Content wrapper - changes layout direction */}
      <div
        className={`relative z-10 flex ${
          compact ? "flex-col items-start gap-1" : "items-start gap-2"
        }`}
      >
        {/* Avatar */}
        <motion.div
          layoutId={`avatar-${appointmentId}`}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
          transition={SPRING_TRANSITION}
        >
          {initials}
        </motion.div>

        {/* Expanded mode: Name + Time stacked vertically */}
        {!compact && (
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            {/* Name - static in expanded mode, no animation on selection */}
            <div className="truncate text-sm font-medium">{displayName}</div>
            {/* Time - below name */}
            <motion.div
              layoutId={`time-${appointmentId}`}
              layout="position"
              className={`flex items-center gap-1 text-[11px] ${
                timeDisplay.isFabTimer
                  ? timeDisplay.shake
                    ? "text-red-600 font-medium"
                    : "text-blue-600 font-medium"
                  : "text-muted-foreground"
              }`}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              suppressHydrationWarning
            >
              {timeDisplay.icon && (
                <timeDisplay.icon
                  className={`h-3 w-3 flex-shrink-0 ${
                    timeDisplay.shake ? "animate-bell-shake" : ""
                  }`}
                />
              )}
              <span suppressHydrationWarning>{timeDisplay.text}</span>
            </motion.div>
          </div>
        )}

        {/* Compact mode: Time below avatar - centered text, no cutoff */}
        {compact && (
          <motion.div
            layoutId={`time-${appointmentId}`}
            layout="position"
            className="w-8 text-center"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            suppressHydrationWarning
          >
            <div className={`flex items-center justify-center gap-0.5 text-[10px] whitespace-nowrap ${
              timeDisplay.isFabTimer
                ? timeDisplay.shake
                  ? "text-red-600 font-medium"
                  : "text-blue-600 font-medium"
                : "text-muted-foreground"
            }`}>
              {timeDisplay.icon && (
                <timeDisplay.icon
                  className={`h-2.5 w-2.5 flex-shrink-0 ${
                    timeDisplay.shake ? "animate-bell-shake" : ""
                  }`}
                />
              )}
              <span suppressHydrationWarning>{timeDisplay.text}</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

export function PatientCards({
  date,
  onAppointmentClick,
  onAppointmentDoubleClick,
  onAppointmentHover,
  hoveredAppointmentId,
  selectedAppointmentId,
  selectedPatientId,
  compact,
  onToggleCompact,
  hideHeader,
  activeTimerAppointmentId,
  activeTimerSeconds,
  isTimerRunning,
}: PatientCardsProps) {
  const selectedDate = date ?? new Date();
  const groupedAppointments = useMemo(
    () => getAppointmentsByStatusForDate(selectedDate),
    [selectedDate]
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const { isTransitioning, previousPatientCardsCollapsed } = useTransition();

  // Only animate chevron during navigation if the collapsed state is actually changing
  const shouldAnimateChevron = isTransitioning &&
    previousPatientCardsCollapsed !== null &&
    previousPatientCardsCollapsed !== compact;

  // Force re-render every second to update timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to selected appointment card when selection changes (only if not visible)
  // Use longer timeout to let selection indicator's layoutId animation settle
  useEffect(() => {
    if (selectedAppointmentId && containerRef.current) {
      const timeoutId = setTimeout(() => {
        const cardElement = containerRef.current?.querySelector(
          `[data-appointment-id="${selectedAppointmentId}"]`
        ) as HTMLElement | null;

        if (cardElement) {
          const scrollableParent = cardElement.closest('.scrollbar-none, .scrollbar-auto') as HTMLElement | null;
          if (!scrollableParent) return;

          const cardRect = cardElement.getBoundingClientRect();
          const parentRect = scrollableParent.getBoundingClientRect();

          // Check if card is fully visible within the scrollable area
          const isFullyVisible =
            cardRect.top >= parentRect.top &&
            cardRect.bottom <= parentRect.bottom;

          // Only scroll if not fully visible
          if (!isFullyVisible) {
            // Use "nearest" to minimize movement - just enough to make it visible
            // Use "auto" behavior to avoid competing with layoutId animation
            cardElement.scrollIntoView({
              behavior: "auto",
              block: "nearest",
            });
          }
        }
      }, 350); // Wait for selection indicator animation to complete
      return () => clearTimeout(timeoutId);
    }
  }, [selectedAppointmentId]);

  return (
    <LayoutGroup>
      <div ref={containerRef} className="flex h-full flex-col overflow-hidden bg-sidebar">
        {/* Header row with date info and collapse/expand button */}
        {onToggleCompact && !hideHeader && (
          <div className="flex items-center justify-between flex-shrink-0 h-11 px-3">
            {/* Date display - only show in expanded mode */}
            {!compact && (
              <span className="text-sm font-medium text-muted-foreground">
                {isToday(selectedDate) ? "Today" : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {" "}
                <span className="font-normal">
                  ({groupedAppointments.inProgress.length +
                   groupedAppointments.checkedIn.length +
                   groupedAppointments.scheduled.length +
                   groupedAppointments.unsigned.length +
                   groupedAppointments.completed.length})
                </span>
              </span>
            )}
            {/* Collapse/expand button */}
            <button
              onClick={onToggleCompact}
              className={`flex h-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${
                compact ? "w-full" : "w-11"
              }`}
              aria-label={compact ? "Expand patient cards" : "Collapse patient cards"}
            >
              <motion.div
                initial={
                  shouldAnimateChevron
                    ? { rotate: compact ? 0 : 180 }
                    : false
                }
                animate={{
                  rotate: compact ? 180 : 0
                }}
                transition={SPRING_TRANSITION}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
            </button>
          </div>
        )}
        <ScrollableArea
          className="flex flex-col gap-3 py-3"
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
          selectedPatientId={selectedPatientId}
          variant="inProgress"
          compact={compact}
          activeTimerAppointmentId={activeTimerAppointmentId}
          activeTimerSeconds={activeTimerSeconds}
          isTimerRunning={isTimerRunning}
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
          selectedPatientId={selectedPatientId}
          variant="checkedIn"
          compact={compact}
          activeTimerAppointmentId={activeTimerAppointmentId}
          activeTimerSeconds={activeTimerSeconds}
          isTimerRunning={isTimerRunning}
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
          selectedPatientId={selectedPatientId}
          variant="scheduled"
          compact={compact}
          activeTimerAppointmentId={activeTimerAppointmentId}
          activeTimerSeconds={activeTimerSeconds}
          isTimerRunning={isTimerRunning}
        />

        {/* Divider between active/upcoming and completed sections */}
        {(groupedAppointments.inProgress.length > 0 ||
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
          selectedPatientId={selectedPatientId}
          variant="unsigned"
          compact={compact}
          activeTimerAppointmentId={activeTimerAppointmentId}
          activeTimerSeconds={activeTimerSeconds}
          isTimerRunning={isTimerRunning}
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
          selectedPatientId={selectedPatientId}
          variant="completed"
          compact={compact}
          activeTimerAppointmentId={activeTimerAppointmentId}
          activeTimerSeconds={activeTimerSeconds}
          isTimerRunning={isTimerRunning}
        />

        {/* Empty state */}
        {Object.values(groupedAppointments).every(
          (arr) => arr.length === 0
        ) && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm px-3 text-center">
            {isToday(selectedDate)
              ? "No appointments today"
              : `No appointments on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            }
          </div>
        )}
        </ScrollableArea>
      </div>
    </LayoutGroup>
  );
}
