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

  it('adds a new round and persists the calculated differential', async () => {
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
    expect(round?.differential).toBe(8.9);
  });

  it('rejects a round if the gross score is below the allowed minimum', async () => {
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

  it('rejects a round if the gross score exceeds the allowed maximum', async () => {
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

  it('rejects a round if the referenced tee does not exist in the database', async () => {
    await expect(
      service.addRound({
        teeId: 'non-existent-tee',
        date: new Date().toISOString(),
        grossScore: 85,
      }),
    ).rejects.toThrow(/does not exist/);
  });

  it('rejects a round if the tee slope is invalid', async () => {
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

  describe('updateRound', () => {
    it('persists the new score, date, and tee and recomputes the differential', async () => {
      const courseId = crypto.randomUUID();
      await db.courses.add({ id: courseId, name: 'Pebble Beach' });

      const blueTeeId = crypto.randomUUID();
      const goldTeeId = crypto.randomUUID();
      await db.tees.bulkAdd([
        { id: blueTeeId, courseId, name: 'Blue', rating: 74, slope: 140, par: 72 },
        { id: goldTeeId, courseId, name: 'Gold', rating: 70, slope: 113, par: 72 },
      ]);

      const id = await service.addRound({
        teeId: blueTeeId,
        date: '2026-03-10',
        grossScore: 85,
      });

      await service.updateRound(id, {
        teeId: goldTeeId,
        date: '2026-04-01',
        grossScore: 80,
      });

      const updated = await db.rounds.get(id);
      expect(updated).toBeDefined();
      expect(updated?.teeId).toBe(goldTeeId);
      expect(updated?.date).toBe('2026-04-01');
      expect(updated?.grossScore).toBe(80);
      expect(updated?.differential).toBe(10);
    });

    it('rejects an out-of-range gross score', async () => {
      await expect(
        service.updateRound('any-id', {
          teeId: 'any-tee',
          date: '2026-03-10',
          grossScore: ROUND_LIMITS.MAX_GROSS_SCORE + 1,
        }),
      ).rejects.toThrow(
        new RegExp(`Gross score must be between ${ROUND_LIMITS.MIN_GROSS_SCORE} and ${ROUND_LIMITS.MAX_GROSS_SCORE}`),
      );
    });

    it('rejects when the referenced tee does not exist', async () => {
      const courseId = crypto.randomUUID();
      await db.courses.add({ id: courseId, name: 'Course' });
      const teeId = crypto.randomUUID();
      await db.tees.add({ id: teeId, courseId, name: 'Blue', rating: 70, slope: 113, par: 72 });

      const id = await service.addRound({ teeId, date: '2026-03-10', grossScore: 85 });

      await expect(
        service.updateRound(id, {
          teeId: 'non-existent-tee',
          date: '2026-03-11',
          grossScore: 84,
        }),
      ).rejects.toThrow(/does not exist/);
    });

    it('rejects when the tee slope is invalid', async () => {
      const courseId = crypto.randomUUID();
      await db.courses.add({ id: courseId, name: 'Course' });
      const validTeeId = crypto.randomUUID();
      const invalidTeeId = crypto.randomUUID();
      await db.tees.bulkAdd([
        { id: validTeeId, courseId, name: 'Blue', rating: 70, slope: 113, par: 72 },
        { id: invalidTeeId, courseId, name: 'Bad', rating: 70, slope: 0, par: 72 },
      ]);

      const id = await service.addRound({ teeId: validTeeId, date: '2026-03-10', grossScore: 85 });

      await expect(
        service.updateRound(id, {
          teeId: invalidTeeId,
          date: '2026-03-11',
          grossScore: 84,
        }),
      ).rejects.toThrow(/Invalid tee slope/);
    });
  });

  describe('getRound', () => {
    it('returns the round when one exists with the given id', async () => {
      await db.rounds.add({
        id: 'r1',
        teeId: 't1',
        date: '2026-03-10',
        grossScore: 85,
        differential: 10,
      });

      const round = await service.getRound('r1');
      expect(round).toBeDefined();
      expect(round?.id).toBe('r1');
      expect(round?.grossScore).toBe(85);
    });

    it('returns undefined when no round matches the id', async () => {
      await expect(service.getRound('does-not-exist')).resolves.toBeUndefined();
    });
  });

  describe('deleteRound', () => {
    it('removes the round from the database', async () => {
      await db.rounds.add({
        id: 'r1',
        teeId: 't1',
        date: '2026-03-10',
        grossScore: 85,
        differential: 10,
      });

      await service.deleteRound('r1');

      await expect(db.rounds.get('r1')).resolves.toBeUndefined();
    });

    it('does not throw when deleting a non-existent round', async () => {
      await expect(service.deleteRound('does-not-exist')).resolves.toBeUndefined();
    });
  });
});
