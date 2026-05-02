import { TestBed } from '@angular/core/testing';
import { db } from '../database/db';
import { HandicapStateService } from './handicap-state.service';
import { SettingsService } from './settings.service';
import { WhsService } from './whs.service';

function buildTwentyEvenRounds() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `r${i + 1}`,
    teeId: 't1',
    date: `2026-03-${(i + 1).toString().padStart(2, '0')}`,
    grossScore: 82,
    differential: 10,
  }));
}

describe('HandicapStateService', () => {
  let service: HandicapStateService;
  let settingsService: SettingsService;

  beforeEach(async () => {
    await db.transaction('rw', db.courses, db.tees, db.rounds, db.settings, async () => {
      await db.courses.clear();
      await db.tees.clear();
      await db.rounds.clear();
      await db.settings.clear();
    });

    TestBed.configureTestingModule({
      providers: [WhsService, SettingsService, HandicapStateService],
    });

    settingsService = TestBed.inject(SettingsService);
    await settingsService.load();
    service = TestBed.inject(HandicapStateService);
  });

  it('returns an empty snapshot when there are fewer than 3 rounds', async () => {
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
    ]);

    await service.refresh();

    expect(service.handicapIndex()).toBeNull();
    expect(service.totalRoundsInWindow()).toBe(2);
    expect(service.usedRoundIds()).toEqual([]);
    expect(service.usedDifferentials()).toEqual([]);
    expect(service.totalRounds()).toBe(2);
    expect(service.totalCoursesPlayed()).toBe(0);
    expect(service.trend()).toBe('none');
    expect(service.recentRounds()).toEqual([
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2, courseName: 'Unknown Course' },
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4, courseName: 'Unknown Course' },
    ]);
  });

  it('resolves recent round course names when tee and course records exist', async () => {
    await db.courses.add({ id: 'c1', name: 'Pebble Beach' });
    await db.tees.add({ id: 't1', courseId: 'c1', name: 'Blue', rating: 70, slope: 113, par: 72 });
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
      { id: 'r3', teeId: 't1', date: '2026-03-03', grossScore: 86, differential: 13.5 },
    ]);

    await service.refresh();

    expect(service.recentRounds()).toEqual([
      { id: 'r3', teeId: 't1', date: '2026-03-03', grossScore: 86, differential: 13.5, courseName: 'Pebble Beach' },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2, courseName: 'Pebble Beach' },
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4, courseName: 'Pebble Beach' },
    ]);
  });

  it('computes handicap index and used differentials from the most recent rounds', async () => {
    await db.tees.add({ id: 't1', courseId: 'c1', name: 'White', rating: 70, slope: 113, par: 72 });
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
      { id: 'r3', teeId: 't1', date: '2026-03-03', grossScore: 86, differential: 13.5 },
      { id: 'r4', teeId: 't1', date: '2026-03-04', grossScore: 84, differential: 11.1 },
      { id: 'r5', teeId: 't1', date: '2026-03-05', grossScore: 83, differential: 10.9 },
    ]);

    await service.refresh();

    expect(service.handicapIndex()).toBe(10.9);
    expect(service.totalRoundsInWindow()).toBe(5);
    expect(service.usedRoundIds()).toEqual(['r5']);
    expect(service.usedDifferentials()).toEqual([10.9]);
    expect(service.totalRounds()).toBe(5);
    expect(service.totalCoursesPlayed()).toBe(1);
    expect(service.trend()).toBe('worsening');
  });

  it('refresh recomputes after new rounds are persisted', async () => {
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
      { id: 'r3', teeId: 't1', date: '2026-03-03', grossScore: 86, differential: 13.5 },
    ]);

    await service.refresh();
    expect(service.handicapIndex()).toBe(11.5);
    expect(service.trend()).toBe('none');

    await db.rounds.add({ id: 'r4', teeId: 't1', date: '2026-03-04', grossScore: 80, differential: 9.4 });

    await service.refresh();

    expect(service.handicapIndex()).toBe(8.4);
    expect(service.usedRoundIds()).toEqual(['r4']);
    expect(service.usedDifferentials()).toEqual([9.4]);
    expect(service.trend()).toBe('improving');
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

    expect(service.totalRoundsInWindow()).toBe(20);
    expect(service.usedRoundIds()).toEqual(['r21', 'r20', 'r19', 'r18', 'r17', 'r16', 'r15', 'r14']);
    expect(service.usedDifferentials()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(service.handicapIndex()).toBe(4.5);
    expect(service.trend()).toBe('improving');
  });

  it('correctly calculates worsening and none trends', async () => {
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 80, differential: 10 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 80, differential: 10 },
      { id: 'r3', teeId: 't1', date: '2026-03-03', grossScore: 80, differential: 10 },
    ]);
    await service.refresh();
    expect(service.trend()).toBe('none');

    await db.rounds.add({ id: 'r4', teeId: 't1', date: '2026-03-04', grossScore: 90, differential: 20 });
    await service.refresh();
    expect(service.trend()).toBe('worsening');
  });

  it('correctly identifies stable trend for small deltas', async () => {
    await db.rounds.bulkAdd(buildTwentyEvenRounds());
    await service.refresh();
    expect(service.handicapIndex()).toBe(10);

    await db.rounds.add({ id: 'r21', teeId: 't1', date: '2026-04-01', grossScore: 81, differential: 9.2 });
    await service.refresh();
    expect(service.handicapIndex()).toBe(9.9);
    expect(service.trend()).toBe('stable');
  });

  it('applies the Golf Australia multiplier after the region is switched', async () => {
    await db.rounds.bulkAdd(buildTwentyEvenRounds());

    await service.refresh();
    expect(service.handicapIndex()).toBe(10);

    await settingsService.setRegion('golfAustralia');
    await service.refresh();

    expect(service.handicapIndex()).toBe(9.3);
  });

  it('resolves without throwing and retains the existing snapshot when IndexedDB fails', async () => {
    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
      { id: 'r3', teeId: 't1', date: '2026-03-03', grossScore: 86, differential: 13.5 },
    ]);
    await service.refresh();
    const indexBefore = service.handicapIndex();

    vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('IndexedDB unavailable'));

    await expect(service.refresh()).resolves.toBeUndefined();
    expect(service.handicapIndex()).toBe(indexBefore);
  });

  it('recomputes correctly on a subsequent refresh after a failed one', async () => {
    vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('IndexedDB unavailable'));
    await service.refresh();

    await db.rounds.bulkAdd([
      { id: 'r1', teeId: 't1', date: '2026-03-01', grossScore: 90, differential: 18.4 },
      { id: 'r2', teeId: 't1', date: '2026-03-02', grossScore: 88, differential: 16.2 },
      { id: 'r3', teeId: 't1', date: '2026-03-03', grossScore: 86, differential: 13.5 },
    ]);
    await service.refresh();

    expect(service.handicapIndex()).toBe(11.5);
  });

  it('keeps the index null and does not throw when the region changes with no rounds', async () => {
    await service.refresh();
    expect(service.handicapIndex()).toBeNull();

    await settingsService.setRegion('golfAustralia');
    await service.refresh();

    expect(service.handicapIndex()).toBeNull();
    expect(service.totalRoundsInWindow()).toBe(0);
    expect(service.trend()).toBe('none');
  });

  it('triggers a recalculation through the constructor effect when the region changes', async () => {
    await db.rounds.bulkAdd(buildTwentyEvenRounds());
    await service.refresh();
    expect(service.handicapIndex()).toBe(10);

    const refreshSpy = vi.spyOn(service, 'refresh');

    await settingsService.setRegion('golfAustralia');
    TestBed.tick();

    expect(refreshSpy).toHaveBeenCalled();
    await Promise.all(refreshSpy.mock.results.map((result) => result.value));

    expect(service.handicapIndex()).toBe(9.3);
  });
});
