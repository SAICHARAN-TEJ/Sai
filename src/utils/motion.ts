/**
 * Canonical studio motion tokens — defined once, never inline.
 * Calibrated from `motion-dev-animations-skill`, `klik-anim` motion-library
 * measured spring plots, and `claude-motion` timing laws.
 */

// Bezier travel curves (use for type reveals, camera moves, exits)
export const EASE = [0.83, 0, 0.17, 1] as const; // thin-peak house travel
export const EASE_OUT = [0.16, 1, 0.3, 1] as const; // crisp arrival, long settle
export const EASE_IN = [0.7, 0, 0.84, 0] as const; // fast exit (half of entrance)
export const WHIP = [0.9, 0, 0.1, 1] as const; // showreel cut / veil whip
export const GLIDE = [0.4, 0, 0.2, 1] as const; // calm UI glide near body text

// Measured spring physics (use for tactile UI controls, tabs, panels, hits)
export const SPRING = {
  /** Finger-flick: tabs, pills, micro-accents (~8% overshoot, 400ms settle) */
  snap: { type: 'spring' as const, damping: 16, stiffness: 260, mass: 0.6 },
  /** Tactile notch: segmented switches & layoutId gliders */
  notch: { type: 'spring' as const, damping: 24, stiffness: 320, mass: 0.75 },
  /** Damper door: modals, preview cards, panels (0% overshoot, calm settle) */
  smooth: { type: 'spring' as const, damping: 28, stiffness: 210, mass: 1.0 },
  /** Mass arriving: large editorial stages & showcase containers */
  heavy: { type: 'spring' as const, damping: 22, stiffness: 130, mass: 1.35 },
} as const;

export const REEL_HOLD_MS = 3600;
