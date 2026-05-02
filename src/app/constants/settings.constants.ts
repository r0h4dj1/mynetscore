/**
 * Supported regional rulesets for handicap calculation.
 */
export const REGIONS = ['standard', 'golfAustralia'] as const;

export type Region = (typeof REGIONS)[number];

/**
 * Type guard for supported region values.
 *
 * @param value - Candidate region string.
 * @returns True when the value matches a supported region.
 */
export function isRegion(value: string | undefined): value is Region {
  return REGIONS.some((region) => region === value);
}
