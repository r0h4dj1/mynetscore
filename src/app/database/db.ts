import Dexie, { type Table } from 'dexie';

export interface Course {
  id: string;
  name: string;
}

export interface Tee {
  id: string;
  courseId: string;
  name: string;
  rating: number;
  slope: number;
  par: number;
}

export interface Round {
  id: string;
  teeId: string;
  date: string;
  grossScore: number;
  differential: number;
}

export interface Setting {
  key: string;
  value: string;
}

/**
 * The core IndexedDB database for MyNetScore utilizing Dexie.
 * Handles the offline storage of courses, tees, rounds, and user settings.
 */
export class AppDB extends Dexie {
  courses!: Table<Course, string>;
  tees!: Table<Tee, string>;
  rounds!: Table<Round, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('MyNetScoreDB');

    this.version(1).stores({
      courses: 'id, name',
      tees: 'id, courseId, &[courseId+name]',
      rounds: 'id, teeId, date',
      settings: 'key',
    });

    this.on('populate', async () => {
      await this.settings.add({ key: 'region', value: 'standard' });
    });
  }
}

export const db = new AppDB();
