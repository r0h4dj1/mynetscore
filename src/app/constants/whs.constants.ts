/**
 * Global constants for the World Handicap System (WHS).
 */
export const WHS_LIMITS = {
  /**
   * The minimum allowable slope rating.
   */
  MIN_SLOPE: 55,

  /**
   * The maximum allowable slope rating.
   */
  MAX_SLOPE: 155,

  /**
   * The standard slope rating used as a divisor in the differential formula.
   */
  STANDARD_SLOPE: 113,
} as const;

/**
 * Golf Australia handicap adjustment multiplier.
 */
export const GOLF_AUSTRALIA_MULTIPLIER = 0.93;

/**
 * Shared round-entry score limits.
 */
export const ROUND_LIMITS = {
  /**
   * Minimum allowable gross score.
   */
  MIN_GROSS_SCORE: 20,

  /**
   * Maximum allowable gross score.
   */
  MAX_GROSS_SCORE: 300,
} as const;
