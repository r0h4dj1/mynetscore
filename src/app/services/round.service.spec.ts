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
});
