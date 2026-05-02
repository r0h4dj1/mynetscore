import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { db, Round, Tee, Course } from '../database/db';
import { SettingsService } from './settings.service';
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
  private readonly settingsService = inject(SettingsService);
  private refreshChain: Promise<void> = Promise.resolve();
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

  constructor() {
    effect(() => {
      // Read the signal to track it as a dependency for this effect
      this.settingsService.region();
      void this.refresh();
    });
  }

  /**
   * Reloads persisted rounds and recomputes the current handicap snapshot.
   *
   * @returns A promise that resolves when the snapshot refresh completes.
   */
  refresh(): Promise<void> {
    this.refreshChain = this.refreshChain.then(() => this.runRefresh());
    return this.refreshChain;
  }

  private async runRefresh(): Promise<void> {
    const snapshot = await db.transaction('r', [db.rounds, db.tees, db.courses], async () => {
      const [recent21Rounds, totalRounds, teeKeys] = await Promise.all([
        db.rounds.orderBy('date').reverse().limit(21).toArray(),
        db.rounds.count(),
        db.rounds.orderBy('teeId').uniqueKeys(),
      ]);

      const recentRounds = recent21Rounds.slice(0, 20);
      const recentDifferentials = recentRounds.map((round) => round.differential);
      const usedRounds = this.whsService.getCountingRounds(recentRounds);
      const usedRoundIds = usedRounds.map((round) => round.id);
      const usedDifferentials = usedRounds.map((round) => round.differential);
      const isGolfAustralia = this.settingsService.region() === 'golfAustralia';
      const currentIndex = this.whsService.calculateHandicapIndex(recentDifferentials, isGolfAustralia);

      let trend: 'improving' | 'worsening' | 'stable' | 'none' = 'none';
      if (recent21Rounds.length > 1) {
        const previousDifferentials = recent21Rounds.slice(1, 21).map((round) => round.differential);
        const previousIndex = this.whsService.calculateHandicapIndex(previousDifferentials, isGolfAustralia);

        if (currentIndex !== null && previousIndex !== null) {
          trend = this.whsService.determineTrend(currentIndex, previousIndex);
        }
      }

      const teeIds = this.getUniqueStringKeys(teeKeys);
      const tees = teeIds.length > 0 ? await db.tees.bulkGet(teeIds) : [];
      const teeMap = this.createTeeMap(tees);
      const courseIds = Array.from(new Set(tees.flatMap((tee) => (tee ? [tee.courseId] : []))));
      const courses = courseIds.length > 0 ? await db.courses.bulkGet(courseIds) : [];
      const courseMap = this.createCourseMap(courses);

      const recentDisplayRounds: RecentRoundDisplay[] = recentRounds.slice(0, RECENT_DISPLAY_COUNT).map((round) => {
        const tee = teeMap.get(round.teeId);
        const course = tee ? courseMap.get(tee.courseId) : undefined;

        return {
          id: round.id,
          teeId: round.teeId,
          date: round.date,
          grossScore: round.grossScore,
          differential: round.differential,
          courseName: course?.name ?? 'Unknown Course',
        };
      });

      return {
        handicapIndex: currentIndex,
        totalRoundsInWindow: recentRounds.length,
        usedRoundIds,
        usedDifferentials,
        totalRounds,
        totalCoursesPlayed: courseIds.length,
        trend,
        recentRounds: recentDisplayRounds,
      };
    });

    this.snapshotState.set(snapshot);
  }

  private getUniqueStringKeys(keys: readonly unknown[]): string[] {
    return Array.from(new Set(keys.filter((key): key is string => typeof key === 'string')));
  }

  private createTeeMap(tees: (Tee | undefined)[]): Map<string, Tee> {
    return new Map(tees.flatMap((tee) => (tee ? [[tee.id, tee] as const] : [])));
  }

  private createCourseMap(courses: (Course | undefined)[]): Map<string, Course> {
    return new Map(courses.flatMap((course) => (course ? [[course.id, course] as const] : [])));
  }
}
