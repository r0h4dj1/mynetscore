import type { Course, Round, Tee } from '../../src/app/database/db';

export interface CourseAndTeeInput {
  courseName: string;
  teeName: string;
  rating: number;
  slope: number;
  par: number;
}

declare global {
  namespace Cypress {
    interface Chainable {
      resetDb(): Chainable<void>;
      seedRounds(rounds: Round[]): Chainable<void>;
      dbRounds(): Chainable<Round[]>;
      dbTees(): Chainable<Tee[]>;
      dbCourses(): Chainable<Course[]>;
      createCourseAndTee(input: CourseAndTeeInput): Chainable<void>;
      logRound(grossScore: number, courseName?: string, teeName?: string): Chainable<void>;
    }
  }
}

export {};
