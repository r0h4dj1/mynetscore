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
