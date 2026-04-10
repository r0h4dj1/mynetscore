import { Injector, runInInjectionContext } from '@angular/core';
import { db } from '../database/db';
import { HandicapStateService } from './handicap-state.service';
import { WhsService } from './whs.service';

describe('HandicapStateService', () => {
  let service: HandicapStateService;

  beforeEach(async () => {
    const injector = Injector.create({
      providers: [{ provide: WhsService, useClass: WhsService }],
    });

    runInInjectionContext(injector, () => {
      service = new HandicapStateService();
    });

    await db.transaction('rw', db.courses, db.tees, db.rounds, async () => {
      await db.courses.clear();
      await db.tees.clear();
      await db.rounds.clear();
    });
  });

  it('returns an empty snapshot when there are fewer than 3 rounds', async () => {
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
    ]);

    await service.refresh();

    expect(service.snapshot()).toEqual({
      handicapIndex: null,
      totalRoundsCounted: 2,
      usedDifferentials: [],
    });
  });

  it('computes handicap index and used differentials from the most recent rounds', async () => {
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
      { id: 'r3', teeId: 't1', date: '2026-03-03', grossScore: 86, differential: 13.5 },
      { id: 'r4', teeId: 't1', date: '2026-03-04', grossScore: 84, differential: 11.1 },
      { id: 'r5', teeId: 't1', date: '2026-03-05', grossScore: 83, differential: 10.9 },
    ]);

    await service.refresh();

    expect(service.handicapIndex()).toBe(10.9);
    expect(service.totalRoundsCounted()).toBe(5);
    expect(service.usedDifferentials()).toEqual([10.9]);
  });

  it('refresh recomputes after new rounds are persisted', async () => {
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
      { id: 'r3', teeId: 't1', date: '2026-03-03', grossScore: 86, differential: 13.5 },
    ]);

    await service.refresh();
    expect(service.handicapIndex()).toBe(11.5);

    await db.rounds.add({ id: 'r4', teeId: 't1', date: '2026-03-04', grossScore: 80, differential: 9.4 });

    await service.refresh();

    expect(service.handicapIndex()).toBe(8.4);
    expect(service.usedDifferentials()).toEqual([9.4]);
  });

  it('exposes the current WHS counting slice when more than 20 rounds exist', async () => {
    const rounds = Array.from({ length: 21 }, (_, index) => {
      const day = (index + 1).toString().padStart(2, '0');
      return {
        id: `r${index + 1}`,
        teeId: 't1',
        date: `2026-03-${day}`,
        grossScore: 90 - index,
        differential: 21 - index,
      };
    });

    await db.rounds.bulkAdd(rounds);
    await service.refresh();

    expect(service.totalRoundsCounted()).toBe(20);
    expect(service.usedDifferentials()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(service.handicapIndex()).toBe(4.5);
  });
});
