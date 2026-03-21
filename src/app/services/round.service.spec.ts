import { Injector, runInInjectionContext } from '@angular/core';
import { RoundService } from './round.service';
import { db } from '../database/db';
import { WhsService } from './whs.service';
import { ROUND_LIMITS } from '../constants/whs.constants';

describe('RoundService', () => {
  let service: RoundService;

  beforeEach(async () => {
    const injector = Injector.create({
      providers: [{ provide: WhsService, useClass: WhsService }],
    });

    runInInjectionContext(injector, () => {
      service = new RoundService();
    });

    await db.transaction('rw', db.courses, db.tees, db.rounds, async () => {
      await db.courses.clear();
      await db.tees.clear();
      await db.rounds.clear();
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addRound', () => {
    it('should add a round and calculate the differential correctly', async () => {
      const courseId = crypto.randomUUID();
      await db.courses.add({ id: courseId, name: 'Pebble Beach' });

      const teeId = crypto.randomUUID();
      await db.tees.add({
        id: teeId,
        courseId,
        name: 'Blue',
        rating: 74,
        slope: 140,
        par: 72,
      });

      const id = await service.addRound({
        teeId,
        date: new Date().toISOString(),
        grossScore: 85,
      });

      expect(id).toBeDefined();

      const round = await db.rounds.get(id);
      expect(round).toBeDefined();
      expect(round?.grossScore).toBe(85);

      // Differential calculation: (85 - 74) * (113 / 140) = 11 * 0.807142857 = 8.87857142857 -> rounded to 8.9
      expect(round?.differential).toBe(8.9);
    });

    it('should properly round differential to one decimal place at boundaries', async () => {
      const courseId = crypto.randomUUID();
      await db.courses.add({ id: courseId, name: 'Precision Course' });

      // Case 1: .x5 rounding up
      // Gross = 80, Rating = 70.45, Slope = 113
      // (80 - 70.45) * (113 / 113) = 9.55 * 1 = 9.55
      // 9.55 * 10 = 95.5 -> Math.round(95.5) = 96 -> 9.6
      const teeId1 = crypto.randomUUID();
      await db.tees.add({
        id: teeId1,
        courseId,
        name: 'Tee 1',
        rating: 70.45,
        slope: 113,
        par: 72,
      });

      const id1 = await service.addRound({
        teeId: teeId1,
        date: new Date().toISOString(),
        grossScore: 80,
      });
      const round1 = await db.rounds.get(id1);
      expect(round1?.differential).toBe(9.6);

      // Case 2: .x4 rounding down
      // Gross = 80, Rating = 70.46, Slope = 113
      // (80 - 70.46) * (113 / 113) = 9.54 * 1 = 9.54
      // 9.54 * 10 = 95.4 -> Math.round(95.4) = 95 -> 9.5
      const teeId2 = crypto.randomUUID();
      await db.tees.add({
        id: teeId2,
        courseId,
        name: 'Tee 2',
        rating: 70.46,
        slope: 113,
        par: 72,
      });

      const id2 = await service.addRound({
        teeId: teeId2,
        date: new Date().toISOString(),
        grossScore: 80,
      });
      const round2 = await db.rounds.get(id2);
      expect(round2?.differential).toBe(9.5);
    });

    it('should throw an error if the gross score is less than the allowed minimum', async () => {
      await expect(
        service.addRound({
          teeId: 'any-tee',
          date: new Date().toISOString(),
          grossScore: ROUND_LIMITS.MIN_GROSS_SCORE - 1,
        }),
      ).rejects.toThrow(
        new RegExp(`Gross score must be between ${ROUND_LIMITS.MIN_GROSS_SCORE} and ${ROUND_LIMITS.MAX_GROSS_SCORE}`),
      );
    });

    it('should throw an error if the gross score is greater than the allowed maximum', async () => {
      await expect(
        service.addRound({
          teeId: 'any-tee',
          date: new Date().toISOString(),
          grossScore: ROUND_LIMITS.MAX_GROSS_SCORE + 1,
        }),
      ).rejects.toThrow(
        new RegExp(`Gross score must be between ${ROUND_LIMITS.MIN_GROSS_SCORE} and ${ROUND_LIMITS.MAX_GROSS_SCORE}`),
      );
    });

    it('should throw an error if the referenced tee does not exist', async () => {
      await expect(
        service.addRound({
          teeId: 'non-existent-tee',
          date: new Date().toISOString(),
          grossScore: 85,
        }),
      ).rejects.toThrow(/does not exist/);
    });

    it('should throw an error if the tee slope is invalid', async () => {
      const courseId = crypto.randomUUID();
      await db.courses.add({ id: courseId, name: 'Invalid Slope Course' });

      const teeId = crypto.randomUUID();
      await db.tees.add({
        id: teeId,
        courseId,
        name: 'Bad Slope',
        rating: 72,
        slope: 0,
        par: 72,
      });

      await expect(
        service.addRound({
          teeId,
          date: new Date().toISOString(),
          grossScore: 85,
        }),
      ).rejects.toThrow(/Invalid tee slope/);
    });

    it('finds a duplicate round by tee and date', async () => {
      await db.rounds.bulkAdd([
        {
          id: 'round-1',
          teeId: 'tee-1',
          date: '2026-03-10',
          grossScore: 84,
          differential: 9.4,
        },
        {
          id: 'round-2',
          teeId: 'tee-1',
          date: '2026-03-11',
          grossScore: 86,
          differential: 11.2,
        },
      ]);

      await expect(service.findDuplicateRound('tee-1', '2026-03-10')).resolves.toMatchObject({
        id: 'round-1',
        teeId: 'tee-1',
        date: '2026-03-10',
      });
      await expect(service.findDuplicateRound('tee-1', '2026-03-12')).resolves.toBeUndefined();
    });
  });
});
