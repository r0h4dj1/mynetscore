import { Injectable } from '@angular/core';
import { db, Course, Round, Tee } from '../database/db';

export interface RoundRowDisplay extends Round {
  courseName: string;
  teeName: string;
}

/**
 * Loads persisted round history for list-style screens.
 */
@Injectable({
  providedIn: 'root',
})
export class RoundHistoryService {
  /**
   * Returns every round newest-first with resolved course and tee labels.
   *
   * @returns A promise resolving to the full round history for the rounds page.
   */
  async listAll(): Promise<RoundRowDisplay[]> {
    return db.transaction('r', [db.rounds, db.tees, db.courses], async () => {
      const rounds = await db.rounds.orderBy('date').reverse().toArray();
      const teeIds = Array.from(new Set(rounds.map((round) => round.teeId)));
      const tees = teeIds.length > 0 ? await db.tees.bulkGet(teeIds) : [];
      const teeMap = this.createTeeMap(tees);
      const courseIds = Array.from(new Set(tees.flatMap((tee) => (tee ? [tee.courseId] : []))));
      const courses = courseIds.length > 0 ? await db.courses.bulkGet(courseIds) : [];
      const courseMap = this.createCourseMap(courses);

      return rounds.map((round) => {
        const tee = teeMap.get(round.teeId);
        const course = tee ? courseMap.get(tee.courseId) : undefined;

        return {
          ...round,
          courseName: course?.name ?? 'Unknown Course',
          teeName: tee?.name ?? 'Unknown Tee',
        };
      });
    });
  }

  private createTeeMap(tees: (Tee | undefined)[]): Map<string, Tee> {
    return new Map(tees.flatMap((tee) => (tee ? [[tee.id, tee] as const] : [])));
  }

  private createCourseMap(courses: (Course | undefined)[]): Map<string, Course> {
    return new Map(courses.flatMap((course) => (course ? [[course.id, course] as const] : [])));
  }
}
