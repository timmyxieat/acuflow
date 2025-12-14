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
// Delay on enter lets layout animation start first, then text fades in
// Exit is immediate so text disappears while layout collapses
export const FADE_SLIDE_TRANSITION = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const,
      delay: 0.1, // Wait for layout to settle before fading in
    },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: {
      duration: 0.15,
      ease: 'easeIn' as const,
      // No delay on exit - disappear immediately
    },
  },
}

// Card selection animations (divider line and label)
// Slide down from top when card becomes selected
export const CARD_SELECTION_ANIMATION = {
  // Container that wraps the selection indicator - animates height
  container: {
    initial: { height: 0, opacity: 0 },
    animate: {
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.2, ease: EASE_OUT },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.15, ease: 'easeIn' as const },
    },
  },
  // Divider line
  divider: {
    initial: { opacity: 0, scaleX: 0 },
    animate: {
      opacity: 1,
      scaleX: 1,
      transition: { duration: 0.2, ease: EASE_OUT },
    },
    exit: {
      opacity: 0,
      scaleX: 0,
      transition: { duration: 0.15, ease: 'easeIn' as const },
    },
  },
  // Label text (slight delay after divider)
  label: {
    initial: { opacity: 0, y: -8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: EASE_OUT, delay: 0.08 },
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: { duration: 0.12, ease: 'easeIn' as const },
    },
  },
}

// SOAP preview content animation
// Animates height for smooth expand/collapse, with staggered content fade
export const SOAP_PREVIEW_ANIMATION = {
  // Container that animates height
  container: {
    initial: { height: 0, opacity: 0 },
    animate: (staggerIndex: number) => ({
      height: 'auto',
      opacity: 1,
      transition: {
        height: { duration: 0.2, ease: EASE_OUT },
        opacity: { duration: 0.2, ease: EASE_OUT },
        delay: staggerIndex * 0.05, // Stagger each section by 50ms
      },
    }),
    exit: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.15, ease: 'easeIn' as const },
        opacity: { duration: 0.1, ease: 'easeIn' as const },
      },
    },
  },
  // Legacy - keeping for backwards compatibility if used elsewhere
  initial: { opacity: 0, y: -12 },
  animate: (staggerIndex: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: EASE_OUT,
      delay: staggerIndex * 0.05, // Stagger each section by 50ms
    },
  }),
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
}

// Button pop animation (fade + scale)
// Subtle pop to draw attention when button appears
export const BUTTON_POP_ANIMATION = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
}
