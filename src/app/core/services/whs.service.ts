import { Injectable } from '@angular/core';

export type HandicapTrend = 'improving' | 'worsening' | 'stable';

export interface ProvisionalTableEntry {
  lowestN: number;
  adjustment: number;
}

/**
 * Service for calculating World Handicap System (WHS) differentials and indexes.
 */
@Injectable({
  providedIn: 'root',
})
export class WhsService {
  private readonly PROVISIONAL_TABLE: Record<number, ProvisionalTableEntry> = {
    3: { lowestN: 1, adjustment: -2 },
    4: { lowestN: 1, adjustment: -1 },
    5: { lowestN: 1, adjustment: 0 },
    6: { lowestN: 2, adjustment: -1 },
    7: { lowestN: 2, adjustment: 0 },
    8: { lowestN: 2, adjustment: 0 },
    9: { lowestN: 3, adjustment: 0 },
    10: { lowestN: 3, adjustment: 0 },
    11: { lowestN: 3, adjustment: 0 },
    12: { lowestN: 4, adjustment: 0 },
    13: { lowestN: 4, adjustment: 0 },
    14: { lowestN: 4, adjustment: 0 },
    15: { lowestN: 5, adjustment: 0 },
    16: { lowestN: 5, adjustment: 0 },
    17: { lowestN: 6, adjustment: 0 },
    18: { lowestN: 6, adjustment: 0 },
    19: { lowestN: 7, adjustment: 0 },
  };

  /**
   * Calculates the differential for a single round.
   * WHS formula: (Gross Score - Course Rating) x (113 / Slope Rating)
   *
   * @param score - The gross score for the round.
   * @param rating - The Course Rating.
   * @param slope - The Slope Rating.
   * @returns The calculated differential.
   */
  calculateDifferential(score: number, rating: number, slope: number): number {
    const rawDifferential = (score - rating) * (113 / slope);
    // Round to 2dp first to eliminate floating-point noise, then to 1dp
    const roundedTo2dp = Math.round(rawDifferential * 100) / 100;
    return Math.round(roundedTo2dp * 10) / 10;
  }

  /**
   * Calculates the handicap index based on an array of historical differentials.
   * Applies the provisional table for 3-19 rounds, or lowest 8 of 20.
   * Assumes the differentials array is ordered from most recent to oldest.
   *
   * @param differentials - An array of historical differentials.
   * @param isGolfAustralia - Flag to apply the Golf Australia 0.93 multiplier.
   * @returns The calculated handicap index or null if insufficient rounds.
   */
  calculateHandicapIndex(differentials: number[], isGolfAustralia = false): number | null {
    if (!differentials || differentials.length < 3) {
      return null;
    }

    const recentDifferentials = differentials.slice(0, 20);
    const numRounds = recentDifferentials.length;

    let lowestN: number;
    let adjustment: number;

    if (numRounds >= 20) {
      lowestN = 8;
      adjustment = 0;
    } else {
      const entry = this.PROVISIONAL_TABLE[numRounds];
      lowestN = entry.lowestN;
      adjustment = entry.adjustment;
    }

    const sortedDifferentials = [...recentDifferentials].sort((a, b) => a - b);
    const lowestDifferentials = sortedDifferentials.slice(0, lowestN);

    const sum = lowestDifferentials.reduce((acc, val) => acc + val, 0);
    let average = sum / lowestN;

    if (isGolfAustralia) {
      average *= 0.93;
    }

    const index = average + adjustment;

    return Math.round(index * 10) / 10;
  }

  /**
   * Determines the trend of the handicap index compared to a previous index.
   *
   * @param current - The current handicap index.
   * @param previous - The previous handicap index.
   * @returns The determined trend ('improving', 'worsening', or 'stable').
   */
  determineTrend(current: number | null, previous: number | null): HandicapTrend {
    if (current === null || previous === null) {
      return 'stable';
    }

    const delta = current - previous;
    const roundedDelta = Math.round(delta * 10) / 10;

    if (roundedDelta < -0.1) {
      return 'improving';
    } else if (roundedDelta > 0.1) {
      return 'worsening';
    }
    return 'stable';
  }
}
