// Shared animation configurations for consistent transitions across the app

// Easing curves
export const EASE_OUT = [0.4, 0, 0.2, 1] as const

// Sidebar (PatientCards) animation config
export const SIDEBAR_ANIMATION = {
  expandedWidth: 200,
  collapsedWidth: 'auto' as const,
  transition: {
    duration: 0.3,
    ease: EASE_OUT,
  },
}

// Content slide animation config (Timeline, main content)
export const CONTENT_SLIDE_ANIMATION = {
  // Horizontal slide (for Timeline when collapsing/expanding)
  horizontal: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  },
  // Vertical slide (for appointment-to-appointment navigation)
  vertical: {
    getInitial: (direction: 'up' | 'down' | null) => ({
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      opacity: 0,
    }),
    animate: { y: 0, opacity: 1 },
    getExit: (direction: 'up' | 'down' | null) => ({
      y: direction === 'up' ? -50 : direction === 'down' ? 50 : 0,
      opacity: 0,
    }),
  },
  transition: {
    duration: 0.3,
    ease: EASE_OUT,
    delay: 0.05, // Slight delay for stagger effect
  },
}

// Spring transition for layout animations (avatars, times, etc.)
export const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 35,
}

// Fade + slide transition for text elements (names, status titles)
export const FADE_SLIDE_TRANSITION = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: {
    duration: 0.2,
    ease: 'easeOut' as const,
  },
}
