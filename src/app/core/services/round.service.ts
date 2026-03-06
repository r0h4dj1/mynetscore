import { Injectable, inject } from '@angular/core';
import { db, Round } from '../database/db';
import { WhsService } from './whs.service';

/**
 * Service for managing golf rounds.
 */
@Injectable({
  providedIn: 'root',
})
export class RoundService {
  private readonly whsService = inject(WhsService);

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

      const differential = this.whsService.calculateDifferential(round.grossScore, tee.rating, tee.slope);

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
