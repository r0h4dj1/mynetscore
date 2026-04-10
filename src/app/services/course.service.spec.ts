import { CourseService } from './course.service';
import { db } from '../database/db';

describe('CourseService', () => {
  let service: CourseService;

  beforeEach(async () => {
    service = new CourseService();

    await db.transaction('rw', db.courses, db.tees, db.rounds, async () => {
      await db.courses.clear();
      await db.tees.clear();
      await db.rounds.clear();
    });
  });

  describe('addCourseWithTee', () => {
    it('should add a course and tee atomically', async () => {
      const { course, tee } = await service.addCourseWithTee('Pebble Beach', {
        name: 'Blue',
        rating: 74,
        slope: 140,
        par: 72,
      });

      expect(course.id).toBeDefined();
      expect(course.name).toBe('Pebble Beach');

      expect(tee.id).toBeDefined();
      expect(tee.courseId).toBe(course.id);
      expect(tee.name).toBe('Blue');

      const savedCourse = await db.courses.get(course.id);
      const savedTee = await db.tees.get(tee.id);

      expect(savedCourse).toBeDefined();
      expect(savedTee).toBeDefined();
    });
  });

  describe('getCoursesWithTeeCounts', () => {
    it('should retrieve courses with accurate tee counts', async () => {
      const course1Id = await service.addCourse('Course 1');
      const course2Id = await service.addCourse('Course 2');
      const course3Id = await service.addCourse('Course 3');

      await service.addTee({ courseId: course1Id, name: 'Tee 1', rating: 70, slope: 113, par: 72 });
      await service.addTee({ courseId: course1Id, name: 'Tee 2', rating: 71, slope: 120, par: 72 });

      await service.addTee({ courseId: course2Id, name: 'Tee 1', rating: 70, slope: 113, par: 72 });

      const coursesWithCounts = await service.getCoursesWithTeeCounts();

      expect(coursesWithCounts.length).toBe(3);

      const c1 = coursesWithCounts.find((c) => c.id === course1Id);
      expect(c1?.teeCount).toBe(2);

      const c2 = coursesWithCounts.find((c) => c.id === course2Id);
      expect(c2?.teeCount).toBe(1);

      const c3 = coursesWithCounts.find((c) => c.id === course3Id);
      expect(c3?.teeCount).toBe(0);
    });
  });

  describe('addTee / updateTee', () => {
    it('should throw an error if the slope is invalid', async () => {
      const courseId = await service.addCourse('Any Course');

      await expect(service.addTee({ courseId, name: 'Invalid', rating: 70, slope: 0, par: 72 })).rejects.toThrow(
        /Invalid tee slope/,
      );
    });

    it('should throw an error if a tee with the same name already exists for the course', async () => {
      const courseId = await service.addCourse('St Andrews');
      await service.addTee({ courseId, name: 'Old', rating: 73, slope: 132, par: 72 });

      await expect(service.addTee({ courseId, name: 'Old', rating: 74, slope: 135, par: 72 })).rejects.toThrow(
        /already exists/,
      );
    });

    it('should allow updating tee properties if validation passes', async () => {
      const courseId = await service.addCourse('TPC Sawgrass');
      const teeId = await service.addTee({ courseId, name: 'Gold', rating: 73, slope: 140, par: 72 });

      await service.updateTee(teeId, 'Championship', 74.4, 145, 72);

      const tee = await db.tees.get(teeId);
      expect(tee).toMatchObject({ name: 'Championship', rating: 74.4, slope: 145, par: 72 });
    });

    it('should prevent updating to a duplicate tee name on the same course', async () => {
      const courseId = await service.addCourse('Kiawah Island');
      await service.addTee({ courseId, name: 'Black', rating: 77, slope: 150, par: 72 });
      const teeId = await service.addTee({ courseId, name: 'Blue', rating: 74, slope: 140, par: 72 });

      await expect(service.updateTee(teeId, 'Black', 74, 140, 72)).rejects.toThrow(/already exists/);
    });
  });

  describe('deleteTee', () => {
    it('should throw an error when deleting a tee that has associated rounds', async () => {
      const courseId = await service.addCourse('Local Muni');
      const teeId = await service.addTee({ courseId, name: 'White', rating: 70, slope: 113, par: 72 });

      await db.rounds.add({
        id: crypto.randomUUID(),
        teeId,
        date: new Date().toISOString(),
        grossScore: 85,
        differential: 10,
      });

      await expect(service.deleteTee(teeId)).rejects.toThrow(/associated rounds/);
    });
  });

  describe('deleteCourse', () => {
    it('should throw an error when deleting a course with tees that have associated rounds', async () => {
      const courseId = await service.addCourse('Bethpage Black');
      const teeId = await service.addTee({ courseId, name: 'Black', rating: 77.5, slope: 155, par: 71 });

      await db.rounds.add({
        id: crypto.randomUUID(),
        teeId,
        date: new Date().toISOString(),
        grossScore: 90,
        differential: 15,
      });

      await expect(service.deleteCourse(courseId)).rejects.toThrow(/associated rounds/);
    });

    it('should delete a course and all its tees if there are no associated rounds', async () => {
      const courseId = await service.addCourse('Clean Course');
      await service.addTee({ courseId, name: 'Red', rating: 68, slope: 110, par: 71 });
      await service.addTee({ courseId, name: 'White', rating: 70, slope: 115, par: 71 });

      await service.deleteCourse(courseId);

      const course = await db.courses.get(courseId);
      expect(course).toBeUndefined();

      const tees = await db.tees.where({ courseId }).toArray();
      expect(tees.length).toBe(0);
    });
  });
});
