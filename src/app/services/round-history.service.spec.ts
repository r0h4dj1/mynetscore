import { Injector, runInInjectionContext } from '@angular/core';
import { db } from '../database/db';
import { RoundHistoryService } from './round-history.service';

describe('RoundHistoryService', () => {
  let service: RoundHistoryService;

  beforeEach(async () => {
    const injector = Injector.create({ providers: [] });

    runInInjectionContext(injector, () => {
      service = new RoundHistoryService();
    });

    await db.transaction('rw', db.courses, db.tees, db.rounds, async () => {
      await db.courses.clear();
      await db.tees.clear();
      await db.rounds.clear();
    });
  });

  it('returns rounds newest-first with resolved course and tee names', async () => {
    await db.courses.add({ id: 'c1', name: 'Pebble Beach' });
    await db.tees.add({ id: 't1', courseId: 'c1', name: 'Blue', rating: 70, slope: 113, par: 72 });
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-03', grossScore: 86, differential: 13.5 },
      { id: 'r3', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
    ]);

    const rounds = await service.listAll();

    expect(rounds.map((round) => round.id)).toEqual(['r2', 'r3', 'r1']);
    expect(rounds[0]).toMatchObject({ courseName: 'Pebble Beach', teeName: 'Blue' });
  });

  it('returns an empty list when no rounds exist', async () => {
    await expect(service.listAll()).resolves.toEqual([]);
  });

  it('falls back to "Unknown" labels when tee or course records are missing', async () => {
    await db.rounds.add({ id: 'r1', teeId: 'missing', date: '2026-03-01', grossScore: 90, differential: 18.4 });

    const rounds = await service.listAll();

    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({ courseName: 'Unknown Course', teeName: 'Unknown Tee' });
  });
});
