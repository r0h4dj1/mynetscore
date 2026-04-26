import { Injectable, inject } from '@angular/core';
import { db, Round, Tee } from '../database/db';
import { WhsService } from './whs.service';
import { ROUND_LIMITS, WHS_LIMITS } from '../constants/whs.constants';

export interface RoundUpdate {
  teeId: string;
  date: string;
  grossScore: number;
}

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
    this.assertGrossScoreInRange(round.grossScore);

    return await db.transaction('rw', db.tees, db.rounds, async () => {
      const { differential } = await this.validateAndCalculate(round.teeId, round.grossScore);

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

  /**
   * Updates an existing round, recomputing its differential against the (possibly new) tee.
   *
   * @param id - The id of the round to update.
   * @param updates - The fields to apply to the round.
   */
  async updateRound(id: string, updates: RoundUpdate): Promise<void> {
    this.assertGrossScoreInRange(updates.grossScore);

    await db.transaction('rw', db.tees, db.rounds, async () => {
      const { differential } = await this.validateAndCalculate(updates.teeId, updates.grossScore);

      await db.rounds.update(id, {
        teeId: updates.teeId,
        date: updates.date,
        grossScore: updates.grossScore,
        differential,
      });
    });
  }

  /**
   * Deletes a round by id.
   *
   * @param id - The id of the round to delete.
   */
  async deleteRound(id: string): Promise<void> {
    await db.rounds.delete(id);
  }

  /**
   * Retrieves a round by id.
   *
   * @param id - The id of the round to retrieve.
   * @returns The round, or undefined if no record exists with that id.
   */
  async getRound(id: string): Promise<Round | undefined> {
    return db.rounds.get(id);
  }

  /**
   * Finds an existing round recorded against the same tee and date.
   *
   * @param teeId - The tee identifier.
   * @param date - The round date.
   * @returns The first matching round, if one exists.
   */
  async findDuplicateRound(teeId: string, date: string): Promise<Round | undefined> {
    return db.rounds
      .where('teeId')
      .equals(teeId)
      .and((round) => round.date === date)
      .first();
  }

  private assertGrossScoreInRange(grossScore: number): void {
    if (grossScore < ROUND_LIMITS.MIN_GROSS_SCORE || grossScore > ROUND_LIMITS.MAX_GROSS_SCORE) {
      throw new Error(
        `Gross score must be between ${ROUND_LIMITS.MIN_GROSS_SCORE} and ${ROUND_LIMITS.MAX_GROSS_SCORE}.`,
      );
    }
  }

  private async validateAndCalculate(teeId: string, grossScore: number): Promise<{ tee: Tee; differential: number }> {
    const tee = await db.tees.get(teeId);
    if (!tee) {
      throw new Error(`Tee with ID ${teeId} does not exist.`);
    }

    if (!Number.isFinite(tee.slope) || tee.slope < WHS_LIMITS.MIN_SLOPE || tee.slope > WHS_LIMITS.MAX_SLOPE) {
      throw new Error(
        `Invalid tee slope. Slope must be a number between ${WHS_LIMITS.MIN_SLOPE} and ${WHS_LIMITS.MAX_SLOPE}.`,
      );
    }

    const differential = this.whsService.calculateDifferential(grossScore, tee.rating, tee.slope);
    return { tee, differential };
  }
}
