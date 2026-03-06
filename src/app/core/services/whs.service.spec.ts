import { WhsService } from './whs.service';

describe('WhsService', () => {
  let service: WhsService;

  beforeEach(() => {
    service = new WhsService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('T1: Differential: score 85, CR 72.1, SR 131', () => {
    expect(service.calculateDifferential(85, 72.1, 131)).toBe(11.1);
  });

  it('T2: Differential: score 72, CR 72, SR 113', () => {
    expect(service.calculateDifferential(72, 72, 113)).toBe(0);
  });

  it('T3: Differential: score 100, CR 68.5, SR 120', () => {
    expect(service.calculateDifferential(100, 68.5, 120)).toBe(29.7);
  });

  it('T4: Index: 0, 1, or 2 rounds returns null', () => {
    expect(service.calculateHandicapIndex([])).toBeNull();
    expect(service.calculateHandicapIndex([10])).toBeNull();
    expect(service.calculateHandicapIndex([10, 11])).toBeNull();
  });

  it('T5: Index: 3 rounds (provisional) - lowest 1, -2 adj', () => {
    expect(service.calculateHandicapIndex([15, 12, 20])).toBe(10);
  });

  it('T6: Index: 5 rounds (provisional) - lowest 1, 0 adj', () => {
    expect(service.calculateHandicapIndex([15, 12, 20, 18, 14])).toBe(12);
  });

  it('T7: Index: 12 rounds (provisional) - lowest 4, 0 adj', () => {
    const rounds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    expect(service.calculateHandicapIndex(rounds)).toBe(11.5);
  });

  it('T8: Index: 19 rounds (provisional) - lowest 7, 0 adj', () => {
    const rounds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    expect(service.calculateHandicapIndex(rounds)).toBe(4);
  });

  it('T9: Index: exactly 20 rounds (full) - lowest 8, no adj', () => {
    const rounds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    expect(service.calculateHandicapIndex(rounds)).toBe(4.5);
  });

  it('T10: Index: 25 rounds - Uses rounds 1-20 only (most recent window)', () => {
    // 20 recent rounds of 10, 5 older rounds of 0.1
    // If it uses older rounds, the average will drop
    const recentRounds = new Array(20).fill(10);
    const olderRounds = new Array(5).fill(0.1);
    expect(service.calculateHandicapIndex([...recentRounds, ...olderRounds])).toBe(10);
  });

  it('T11: Index: Golf Australia multiplier - standard_result * 0.93', () => {
    const rounds = new Array(20).fill(10);
    expect(service.calculateHandicapIndex(rounds, true)).toBe(9.3);
  });

  it('T12: Counting indices are the N lowest', () => {
    const rounds = [...new Array(8).fill(5), ...new Array(12).fill(20)];
    expect(service.calculateHandicapIndex(rounds)).toBe(5);
  });

  it('T13: Trend: current < previous by > 0.1 -> improving', () => {
    expect(service.determineTrend(10, 10.2)).toBe('improving');
  });

  it('T14: Trend: current > previous by > 0.1 -> worsening', () => {
    expect(service.determineTrend(10.2, 10)).toBe('worsening');
  });

  it('T15: Trend: delta within ±0.1 -> stable', () => {
    expect(service.determineTrend(10, 10)).toBe('stable');
    expect(service.determineTrend(10, 10.1)).toBe('stable');
    expect(service.determineTrend(10.1, 10)).toBe('stable');
  });

  it('T16: Trend: either index is null -> stable', () => {
    expect(service.determineTrend(null, 10)).toBe('stable');
    expect(service.determineTrend(10, null)).toBe('stable');
    expect(service.determineTrend(null, null)).toBe('stable');
  });
});
