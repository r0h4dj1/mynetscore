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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addCourse', () => {
    it('should add a course and return its id', async () => {
      const id = await service.addCourse('Pebble Beach');
      expect(id).toBeDefined();

      const course = await db.courses.get(id);
      expect(course).toEqual({ id, name: 'Pebble Beach' });
    });
  });

  describe('updateCourse', () => {
    it('should update a course name', async () => {
      const courseId = await service.addCourse('Old Name');

      await service.updateCourse(courseId, 'New Name');

      const course = await db.courses.get(courseId);
      expect(course).toEqual({ id: courseId, name: 'New Name' });
    });

    it('should throw an error when updating a non-existent course', async () => {
      await expect(service.updateCourse('missing-course', 'Renamed')).rejects.toThrow(/does not exist/);
    });
  });

  describe('addTee', () => {
    it('should add a tee if the course exists and tee name is unique', async () => {
      const courseId = await service.addCourse('Augusta National');

      const teeId = await service.addTee({
        courseId,
        name: 'Masters',
        rating: 78.1,
        slope: 148,
        par: 72,
      });

      expect(teeId).toBeDefined();
      const tee = await db.tees.get(teeId);
      expect(tee).toMatchObject({
        id: teeId,
        courseId,
        name: 'Masters',
        rating: 78.1,
        slope: 148,
        par: 72,
      });
    });

    it('should throw an error if the course does not exist', async () => {
      await expect(
        service.addTee({
          courseId: 'non-existent',
          name: 'Blue',
          rating: 70,
          slope: 120,
          par: 72,
        }),
      ).rejects.toThrow(/does not exist/);
    });

    it('should throw an error if the slope is invalid', async () => {
      await expect(
        service.addTee({
          courseId: 'any-course',
          name: 'Invalid',
          rating: 70,
          slope: 0,
          par: 72,
        }),
      ).rejects.toThrow(/Invalid tee slope/);
    });

    it('should throw an error if a tee with the same name already exists for the course', async () => {
      const courseId = await service.addCourse('St Andrews');

      await service.addTee({
        courseId,
        name: 'Old',
        rating: 73,
        slope: 132,
        par: 72,
      });

      await expect(
        service.addTee({
          courseId,
          name: 'Old',
          rating: 74,
          slope: 135,
          par: 72,
        }),
      ).rejects.toThrow(/already exists/);
    });
  });

  describe('deleteTee', () => {
    it('should delete a tee if it has no associated rounds', async () => {
      const courseId = await service.addCourse('Local Muni');
      const teeId = await service.addTee({ courseId, name: 'White', rating: 70, slope: 113, par: 72 });

      await service.deleteTee(teeId);

      const tee = await db.tees.get(teeId);
      expect(tee).toBeUndefined();
    });

    it('should throw an error if the tee has associated rounds', async () => {
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

      // Verify tee was not deleted
      const tee = await db.tees.get(teeId);
      expect(tee).toBeDefined();
    });
  });

  describe('updateTee', () => {
    it('should update tee fields when validation passes', async () => {
      const courseId = await service.addCourse('TPC Sawgrass');
      const teeId = await service.addTee({
        courseId,
        name: 'Gold',
        rating: 73,
        slope: 140,
        par: 72,
      });

      await service.updateTee(teeId, 'Championship', 74.4, 145, 72);

      const tee = await db.tees.get(teeId);
      expect(tee).toMatchObject({
        id: teeId,
        courseId,
        name: 'Championship',
        rating: 74.4,
        slope: 145,
        par: 72,
      });
    });

    it('should throw an error for invalid slope during tee update', async () => {
      const courseId = await service.addCourse('Royal County Down');
      const teeId = await service.addTee({
        courseId,
        name: 'Blue',
        rating: 72,
        slope: 130,
        par: 71,
      });

      await expect(service.updateTee(teeId, 'Blue', 72, 200, 71)).rejects.toThrow(/Invalid tee slope/);
    });

    it('should throw an error if updated tee name duplicates another tee on the same course', async () => {
      const courseId = await service.addCourse('Kiawah Island');
      await service.addTee({
        courseId,
        name: 'Black',
        rating: 77,
        slope: 150,
        par: 72,
      });
      const teeId = await service.addTee({
        courseId,
        name: 'Blue',
        rating: 74,
        slope: 140,
        par: 72,
      });

      await expect(service.updateTee(teeId, 'Black', 74, 140, 72)).rejects.toThrow(/already exists/);
    });

    it('should throw an error when updating a non-existent tee', async () => {
      await expect(service.updateTee('missing-tee', 'White', 70, 113, 72)).rejects.toThrow(/does not exist/);
    });
  });

  describe('deleteCourse', () => {
    it('should delete a course and its tees if there are no associated rounds', async () => {
      const courseId = await service.addCourse('Bethpage Black');
      await service.addTee({ courseId, name: 'Black', rating: 77.5, slope: 155, par: 71 });
      await service.addTee({ courseId, name: 'Blue', rating: 74, slope: 140, par: 71 });

      await service.deleteCourse(courseId);

      const course = await db.courses.get(courseId);
      expect(course).toBeUndefined();

      const tees = await db.tees.where({ courseId }).toArray();
      expect(tees.length).toBe(0);
    });

    it('should throw an error if any of the course tees have associated rounds', async () => {
      const courseId = await service.addCourse('Bethpage Black');
      const teeId1 = await service.addTee({ courseId, name: 'Black', rating: 77.5, slope: 155, par: 71 });
      await service.addTee({ courseId, name: 'Blue', rating: 74, slope: 140, par: 71 });

      await db.rounds.add({
        id: crypto.randomUUID(),
        teeId: teeId1,
        date: new Date().toISOString(),
        grossScore: 90,
        differential: 15,
      });

      await expect(service.deleteCourse(courseId)).rejects.toThrow(/associated rounds/);

      // Verify course and tees were not deleted
      const course = await db.courses.get(courseId);
      expect(course).toBeDefined();

      const tees = await db.tees.where({ courseId }).toArray();
      expect(tees.length).toBe(2);
    });

    it('should prevent race conditions when deleting a course concurrently with adding a round', async () => {
      const courseId = await service.addCourse('Bethpage Black');
      const teeId = await service.addTee({ courseId, name: 'Black', rating: 77.5, slope: 155, par: 71 });

      // Simulate a concurrent addRound and deleteCourse
      // We wrap it in a transaction to emulate a correct implementation that would lock tables
      const addRoundTask = async () => {
        await db.transaction('rw', db.tees, db.rounds, async () => {
          const tee = await db.tees.get(teeId);
          if (!tee) throw new Error('Tee does not exist');

          await new Promise((resolve) => setTimeout(resolve, 10));

          await db.rounds.add({
            id: crypto.randomUUID(),
            teeId,
            date: new Date().toISOString(),
            grossScore: 85,
            differential: 10,
          });
        });
      };

      await Promise.allSettled([service.deleteCourse(courseId), addRoundTask()]);

      const course = await db.courses.get(courseId);
      const tees = await db.tees.where({ courseId }).toArray();
      const rounds = await db.rounds.where({ teeId }).toArray();

      const isCleanlyDeleted = course === undefined && tees.length === 0 && rounds.length === 0;
      const isRetained = course !== undefined && tees.length === 1 && rounds.length === 1;

      expect(isCleanlyDeleted || isRetained).toBe(true);
    });
  });
});
