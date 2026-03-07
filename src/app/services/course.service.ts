import { Injectable } from '@angular/core';
import { db, Course, Tee } from '../database/db';

/**
 * Service responsible for managing courses and their associated tees
 * within the local IndexedDB database.
 */
@Injectable({
  providedIn: 'root',
})
export class CourseService {
  /**
   * Adds a new course to the database.
   *
   * @param name - The name of the course to add.
   * @returns A promise resolving to the generated course ID.
   */
  async addCourse(name: string): Promise<string> {
    const id = crypto.randomUUID();
    await db.courses.add({ id, name });
    return id;
  }

  /**
   * Retrieves all saved courses from the database.
   *
   * @returns A promise resolving to an array of all courses.
   */
  async getCourses(): Promise<Course[]> {
    return db.courses.toArray();
  }

  /**
   * Retrieves a specific course by its ID.
   *
   * @param id - The ID of the course to retrieve.
   * @returns A promise resolving to the course, or undefined if not found.
   */
  async getCourse(id: string): Promise<Course | undefined> {
    return db.courses.get(id);
  }

  /**
   * Retrieves all tees associated with a specific course.
   *
   * @param courseId - The ID of the course.
   * @returns A promise resolving to an array of tees for the course.
   */
  async getTees(courseId: string): Promise<Tee[]> {
    return db.tees.where({ courseId }).toArray();
  }

  /**
   * Adds a new tee to a specific course.
   * Throws an error if the course does not exist or if a tee with the same name already exists for the course.
   *
   * @param tee - The tee object containing the course ID, name, rating, slope, and par.
   * @returns A promise resolving to the generated tee ID.
   */
  async addTee(tee: Omit<Tee, 'id'>): Promise<string> {
    if (!Number.isFinite(tee.slope) || tee.slope < 55 || tee.slope > 155) {
      throw new Error('Invalid tee slope. Slope must be a number between 55 and 155.');
    }

    const course = await db.courses.get(tee.courseId);
    if (!course) {
      throw new Error(`Course with ID ${tee.courseId} does not exist.`);
    }

    const existingTee = await db.tees.where('[courseId+name]').equals([tee.courseId, tee.name]).first();
    if (existingTee) {
      throw new Error(`A tee named "${tee.name}" already exists for this course.`);
    }

    const id = crypto.randomUUID();
    await db.tees.add({ ...tee, id });
    return id;
  }

  /**
   * Deletes a tee from the database.
   * Throws an error if the tee has associated rounds.
   *
   * @param teeId - The ID of the tee to delete.
   */
  async deleteTee(teeId: string): Promise<void> {
    await db.transaction('rw', db.tees, db.rounds, async () => {
      const roundCount = await db.rounds.where({ teeId }).count();
      if (roundCount > 0) {
        throw new Error('Cannot delete tee because it has associated rounds.');
      }
      await db.tees.delete(teeId);
    });
  }

  /**
   * Deletes a course and all of its associated tees from the database.
   * Throws an error if any of the associated tees have recorded rounds.
   *
   * @param courseId - The ID of the course to delete.
   */
  async deleteCourse(courseId: string): Promise<void> {
    await db.transaction('rw', db.courses, db.tees, db.rounds, async () => {
      const tees = await db.tees.where({ courseId }).toArray();
      const teeIds = tees.map((t) => t.id);

      if (teeIds.length > 0) {
        const roundCount = await db.rounds.where('teeId').anyOf(teeIds).count();
        if (roundCount > 0) {
          throw new Error('Cannot delete course because it has tees with associated rounds.');
        }
        await db.tees.bulkDelete(teeIds);
      }

      await db.courses.delete(courseId);
    });
  }
}
