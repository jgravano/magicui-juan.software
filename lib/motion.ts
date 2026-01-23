export const MOTION_EASING = "cubic-bezier(0.23, 1, 0.32, 1)" as const

export const MOTION_DURATION = {
  fast: 300,
  base: 500,
  slow: 800,
} as const

export const MOTION_TRANSITION = {
  fast: `all ${MOTION_DURATION.fast}ms ${MOTION_EASING}`,
  base: `all ${MOTION_DURATION.base}ms ${MOTION_EASING}`,
  slow: `all ${MOTION_DURATION.slow}ms ${MOTION_EASING}`,
} as const

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

export const getReducedMotionDuration = (duration: number) =>
  prefersReducedMotion() ? Math.min(duration, 120) : duration

export const EASING = {
  // Primary easing - smooth, intentional deceleration
  default: MOTION_EASING,
} as const

export const DURATION = {
  instant: 150,
  fast: 300,
  normal: 500,
  slow: 800,
  reveal: 1000,
} as const

export const STAGGER = {
  tight: 50,
  normal: 80,
  relaxed: 120,
  dramatic: 200,
} as const

// Scroll-based timing offsets
export const SCROLL_OFFSET = {
  immediate: "0px",
  early: "-100px",
  normal: "-50px",
  late: "50px",
} as const

// Animation presets for common patterns
export const getRevealStyles = (isInView: boolean, delay = 0) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? "translateY(0)" : "translateY(24px)",
  transition: `opacity ${DURATION.slow}ms ${EASING.default} ${delay}ms, transform ${DURATION.slow}ms ${EASING.default} ${delay}ms`,
})

export const getStaggeredRevealStyles = (isInView: boolean, index: number, baseDelay = 0) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? "translateY(0)" : "translateY(24px)",
  transition: `opacity ${DURATION.slow}ms ${EASING.default} ${baseDelay + index * STAGGER.normal}ms, transform ${DURATION.slow}ms ${EASING.default} ${baseDelay + index * STAGGER.normal}ms`,
})

export const getWordRevealStyles = (isInView: boolean, index: number, baseDelay = 0) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? "translateY(0)" : "translateY(100%)",
  transition: `opacity ${DURATION.normal}ms ${EASING.default} ${baseDelay + index * STAGGER.tight}ms, transform ${DURATION.normal}ms ${EASING.default} ${baseDelay + index * STAGGER.tight}ms`,
})

export const getLineRevealStyles = (isInView: boolean, index: number, baseDelay = 0) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? "translateY(0)" : "translateY(20px)",
  transition: `opacity ${DURATION.slow}ms ${EASING.default} ${baseDelay + index * STAGGER.relaxed}ms, transform ${DURATION.slow}ms ${EASING.default} ${baseDelay + index * STAGGER.relaxed}ms`,
})

// Hover interaction styles
export const getHoverStyles = () => ({
  transition: `transform ${DURATION.fast}ms ${EASING.default}, opacity ${DURATION.fast}ms ${EASING.default}`,
})

export const HOVER_SCALE = {
  subtle: "scale(1.02)",
  normal: "scale(1.05)",
  emphasis: "scale(1.08)",
} as const

export const HOVER_LIFT = {
  subtle: "translateY(-2px)",
  normal: "translateY(-4px)",
  emphasis: "translateY(-8px)",
} as const
