import { Injectable, computed, inject, signal } from '@angular/core';
import { db } from '../database/db';
import { WhsService } from './whs.service';

export interface HandicapStateSnapshot {
  handicapIndex: number | null;
  totalRoundsCounted: number;
  usedDifferentials: number[];
}

/**
 * Maintains the current handicap snapshot derived from persisted rounds.
 */
@Injectable({
  providedIn: 'root',
})
export class HandicapStateService {
  private readonly whsService = inject(WhsService);
  private readonly snapshotState = signal<HandicapStateSnapshot>({
    handicapIndex: null,
    totalRoundsCounted: 0,
    usedDifferentials: [],
  });

  readonly snapshot = computed(() => this.snapshotState());
  readonly handicapIndex = computed(() => this.snapshotState().handicapIndex);
  readonly totalRoundsCounted = computed(() => this.snapshotState().totalRoundsCounted);
  readonly usedDifferentials = computed(() => this.snapshotState().usedDifferentials);

  /**
   * Reloads persisted rounds and recomputes the current handicap snapshot.
   */
  async refresh(): Promise<void> {
    const recentRounds = await db.rounds.orderBy('date').reverse().limit(20).toArray();
    const recentDifferentials = recentRounds.map((round) => round.differential);
    const usedDifferentials = this.whsService.getCountingDifferentials(recentDifferentials);

    this.snapshotState.set({
      handicapIndex: this.whsService.calculateHandicapIndex(recentDifferentials),
      totalRoundsCounted: recentRounds.length,
      usedDifferentials,
    });
  }
}
