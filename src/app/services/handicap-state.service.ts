import { Injectable, computed, inject, signal } from '@angular/core';
import { db, Round } from '../database/db';
import { WhsService } from './whs.service';

export interface RecentRoundDisplay extends Round {
  courseName: string;
}

export const RECENT_DISPLAY_COUNT = 3;

export interface HandicapStateSnapshot {
  handicapIndex: number | null;
  totalRoundsInWindow: number;
  usedRoundIds: string[];
  usedDifferentials: number[];
  totalRounds: number;
  totalCoursesPlayed: number;
  trend: 'improving' | 'worsening' | 'stable' | 'none';
  recentRounds: RecentRoundDisplay[];
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
    totalRoundsInWindow: 0,
    usedRoundIds: [],
    usedDifferentials: [],
    totalRounds: 0,
    totalCoursesPlayed: 0,
    trend: 'none',
    recentRounds: [],
  });

  readonly handicapIndex = computed(() => this.snapshotState().handicapIndex);
  readonly totalRoundsInWindow = computed(() => this.snapshotState().totalRoundsInWindow);
  readonly usedRoundIds = computed(() => this.snapshotState().usedRoundIds);
  readonly usedDifferentials = computed(() => this.snapshotState().usedDifferentials);
  readonly totalRounds = computed(() => this.snapshotState().totalRounds);
  readonly totalCoursesPlayed = computed(() => this.snapshotState().totalCoursesPlayed);
  readonly trend = computed(() => this.snapshotState().trend);
  readonly recentRounds = computed(() => this.snapshotState().recentRounds);

  /**
   * Reloads persisted rounds and recomputes the current handicap snapshot.
   */
  async refresh(): Promise<void> {
    const recent21Rounds = await db.rounds.orderBy('date').reverse().limit(21).toArray();
    const recentRounds = recent21Rounds.slice(0, 20);
    const recentDifferentials = recentRounds.map((round) => round.differential);
    const usedRounds = this.whsService.getCountingRounds(recentRounds);
    const usedRoundIds = usedRounds.map((r) => r.id);
    const usedDifferentials = usedRounds.map((r) => r.differential);

    const currentIndex = this.whsService.calculateHandicapIndex(recentDifferentials);

    let trend: 'improving' | 'worsening' | 'stable' | 'none' = 'none';
    if (recent21Rounds.length > 1) {
      const previousDifferentials = recent21Rounds.slice(1, 21).map((r) => r.differential);
      const previousIndex = this.whsService.calculateHandicapIndex(previousDifferentials);

      if (currentIndex !== null && previousIndex !== null) {
        trend = this.whsService.determineTrend(currentIndex, previousIndex);
      }
    }

    const totalRounds = await db.rounds.count();

    const uniqueTeeIds = (await db.rounds.orderBy('teeId').uniqueKeys()) as string[];
    const tees = await db.tees.bulkGet(uniqueTeeIds);
    const uniqueCourseIds = new Set(tees.map((tee) => tee?.courseId).filter((id) => id !== undefined));
    const totalCoursesPlayed = uniqueCourseIds.size;

    const recentDisplayRounds = await Promise.all(
      recent21Rounds.slice(0, RECENT_DISPLAY_COUNT).map(async (r) => {
        const tee = await db.tees.get(r.teeId);
        const course = tee ? await db.courses.get(tee.courseId) : undefined;
        return { ...r, courseName: course?.name || 'Unknown Course' };
      }),
    );

    this.snapshotState.set({
      handicapIndex: currentIndex,
      totalRoundsInWindow: recentRounds.length,
      usedRoundIds,
      usedDifferentials,
      totalRounds,
      totalCoursesPlayed,
      trend,
      recentRounds: recentDisplayRounds,
    });
  }
}
