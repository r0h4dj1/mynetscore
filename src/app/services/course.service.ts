import { Injectable } from '@angular/core';
import { db, Course, Tee } from '../database/db';
import { WHS_LIMITS } from '../constants/whs.constants';

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
   * Adds a new course and its initial tee to the database atomically.
   *
   * @param courseName - The name of the course to add.
   * @param teeData - The initial tee data (name, rating, slope, par).
   * @returns A promise resolving to the created course and tee objects.
   */
  async addCourseWithTee(
    courseName: string,
    teeData: Omit<Tee, 'id' | 'courseId'>,
  ): Promise<{ course: Course; tee: Tee }> {
    return db.transaction('rw', [db.courses, db.tees], async () => {
      const courseId = crypto.randomUUID();
      const course: Course = { id: courseId, name: courseName };
      await db.courses.add(course);

      const teeId = await this.addTee({
        courseId,
        ...teeData,
      });

      const tee: Tee = {
        id: teeId,
        courseId,
        ...teeData,
      };

      return { course, tee };
    });
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
   * Retrieves all courses with their associated tee counts.
   * Optimized to avoid N+1 query patterns by fetching all relevant data in two batches
   * and joining in-memory.
   *
   * @returns A promise resolving to an array of courses with tee counts.
   */
  async getCoursesWithTeeCounts(): Promise<(Course & { teeCount: number })[]> {
    return db.transaction('r', [db.courses, db.tees], async () => {
      const courses = await db.courses.toArray();
      const allTees = await db.tees.toArray();

      const teeCountMap = allTees.reduce(
        (acc, tee) => {
          acc[tee.courseId] = (acc[tee.courseId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return courses.map((course) => ({
        ...course,
        teeCount: teeCountMap[course.id] || 0,
      }));
    });
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
   * Retrieves a specific tee by its ID.
   *
   * @param teeId - The ID of the tee to retrieve.
   * @returns A promise resolving to the tee, or undefined if not found.
   */
  async getTeeById(teeId: string): Promise<Tee | undefined> {
    return db.tees.get(teeId);
  }

  /**
   * Adds a new tee to a specific course.
   * Throws an error if:
   * - The slope is not between WHS_LIMITS.MIN_SLOPE and WHS_LIMITS.MAX_SLOPE.
   * - The course does not exist.
   * - A tee with the same name already exists for the course.
   *
   * @param tee - The tee object containing the course ID, name, rating, slope, and par.
   * @returns A promise resolving to the generated tee ID.
   */
  async addTee(tee: Omit<Tee, 'id'>): Promise<string> {
    this.validateSlope(tee.slope);

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
   * Updates a course name.
   *
   * @param id - The course ID to update.
   * @param name - The new course name.
   */
  async updateCourse(id: string, name: string): Promise<void> {
    const updated = await db.courses.update(id, { name });
    if (updated === 0) {
      throw new Error(`Course with ID ${id} does not exist.`);
    }
  }

  /**
   * Updates a tee's editable properties.
   * Throws an error when slope is outside the allowed WHS range or a duplicate tee name exists for the same course.
   *
   * @param id - The tee ID to update.
   * @param name - The tee name.
   * @param rating - The course rating.
   * @param slope - The slope rating.
   * @param par - The par value.
   */
  async updateTee(id: string, name: string, rating: number, slope: number, par: number): Promise<void> {
    this.validateSlope(slope);

    const currentTee = await db.tees.get(id);
    if (!currentTee) {
      throw new Error(`Tee with ID ${id} does not exist.`);
    }

    const existingTee = await db.tees.where('[courseId+name]').equals([currentTee.courseId, name]).first();
    if (existingTee && existingTee.id !== id) {
      throw new Error(`A tee named "${name}" already exists for this course.`);
    }

    await db.tees.update(id, {
      name,
      rating,
      slope,
      par,
    });
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

  /**
   * Validates that the slope is within the WHS allowed range.
   *
   * @param slope - The slope to validate.
   * @throws Error if the slope is invalid.
   */
  private validateSlope(slope: number): void {
    if (!Number.isFinite(slope) || slope < WHS_LIMITS.MIN_SLOPE || slope > WHS_LIMITS.MAX_SLOPE) {
      throw new Error(
        `Invalid tee slope. Slope must be a number between ${WHS_LIMITS.MIN_SLOPE} and ${WHS_LIMITS.MAX_SLOPE}.`,
      );
    }
  }
}
