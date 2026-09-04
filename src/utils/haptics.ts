/**
 * Haptic feedback utility using the HTML5 Vibration API (navigator.vibrate).
 * Gracefully no-ops on devices or browsers that do not support haptics.
 */
export const haptic = {
  /** Ultra-light tap (8ms) for tab switching, selection, reordering */
  selection: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // Ignore errors in environments where vibration is blocked
      }
    }
  },

  /** Light tap (14ms) for standard button clicks, toggles, icon clicks */
  light: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(14);
      } catch {
        // Ignore
      }
    }
  },

  /** Medium affirmative pulse (25ms) for primary action triggers (e.g. Convert, Split, Compress) */
  medium: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Ignore
      }
    }
  },

  /** Double-pulse tactile confirmation pattern for successful operations or file additions */
  success: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([15, 45, 25]);
      } catch {
        // Ignore
      }
    }
  },

  /** Warning or error pattern for invalid inputs or interrupted operations */
  error: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([35, 50, 35]);
      } catch {
        // Ignore
      }
    }
  },
};
