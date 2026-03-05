import { Injectable } from '@angular/core';
import { db, Round } from '../database/db';

/**
 * Service for managing golf rounds.
 */
@Injectable({
  providedIn: 'root',
})
export class RoundService {
  /**
   * Adds a new round to the database, calculating its differential.
   *
   * @param round - The round data without id and differential.
   * @returns A promise that resolves to the new round's ID.
   */
  async addRound(round: Omit<Round, 'id' | 'differential'>): Promise<string> {
    if (round.grossScore < 20 || round.grossScore > 300) {
      throw new Error('Gross score must be between 20 and 300.');
    }

    return await db.transaction('rw', db.tees, db.rounds, async () => {
      const tee = await db.tees.get(round.teeId);
      if (!tee) {
        throw new Error(`Tee with ID ${round.teeId} does not exist.`);
      }

      if (!Number.isFinite(tee.slope) || tee.slope < 55 || tee.slope > 155) {
        throw new Error('Invalid tee slope. Slope must be a number between 55 and 155.');
      }

      // Calculate differential: (Gross Score - Course Rating) x (113 / Slope Rating)
      // Round to 2dp first to eliminate floating-point noise, then to 1dp.
      const rawDifferential = (round.grossScore - tee.rating) * (113 / tee.slope);
      const roundedTo2dp = Math.round(rawDifferential * 100) / 100;
      const differential = Math.round(roundedTo2dp * 10) / 10;

      const id = crypto.randomUUID();
      const newRound: Round = {
        ...round,
        id,
        differential,
      };

      await db.rounds.add(newRound);
      return id;
    });
  }
}
