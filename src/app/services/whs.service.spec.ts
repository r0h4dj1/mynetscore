import { WhsService } from './whs.service';

describe('WhsService', () => {
  let service: WhsService;

  beforeEach(() => {
    service = new WhsService();
  });

  describe('calculateDifferential', () => {
    it('should calculate the WHS differential rounded to one decimal place', () => {
      // (85 - 72.1) * (113 / 131) = 11.129 -> 11.1
      expect(service.calculateDifferential(85, 72.1, 131)).toBe(11.1);
      // (72 - 72) * (113 / 113) = 0
      expect(service.calculateDifferential(72, 72, 113)).toBe(0);
      // (100 - 68.5) * (113 / 120) = 29.6625 -> 29.7
      expect(service.calculateDifferential(100, 68.5, 120)).toBe(29.7);
    });
  });

  describe('calculateHandicapIndex', () => {
    it('should return null if there are fewer than 3 rounds', () => {
      expect(service.calculateHandicapIndex([])).toBeNull();
      expect(service.calculateHandicapIndex([10])).toBeNull();
      expect(service.calculateHandicapIndex([10, 11])).toBeNull();
    });

    it('should apply provisional calculation adjustments for 3 to 19 rounds', () => {
      // 3 rounds: lowest 1 (12), adjustment -2 = 10
      expect(service.calculateHandicapIndex([15, 12, 20])).toBe(10);
      // 5 rounds: lowest 1 (12), adjustment 0 = 12
      expect(service.calculateHandicapIndex([15, 12, 20, 18, 14])).toBe(12);
    });

    it('should calculate the index using the lowest 8 of the most recent 20 rounds', () => {
      // 20 rounds: 1 to 20. Lowest 8 are 1..8. Sum = 36, Avg = 4.5
      const rounds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      expect(service.calculateHandicapIndex(rounds)).toBe(4.5);
    });

    it('should ignore rounds beyond the most recent 20', () => {
      // 20 recent rounds of 10, 5 older rounds of 0.1
      // If it used older rounds, the average would drop
      const recentRounds = new Array(20).fill(10);
      const olderRounds = new Array(5).fill(0.1);
      expect(service.calculateHandicapIndex([...recentRounds, ...olderRounds])).toBe(10);
    });

    it('should apply the Golf Australia 0.93 multiplier when the flag is true', () => {
      const rounds = new Array(20).fill(10);
      // Base index 10 * 0.93 = 9.3
      expect(service.calculateHandicapIndex(rounds, true)).toBe(9.3);
    });
  });

  describe('getCountingDifferentials', () => {
    it('should return an empty array if there are fewer than 3 rounds', () => {
      expect(service.getCountingDifferentials([1, 2])).toEqual([]);
    });

    it('should return the correct subset of lowest differentials based on round count', () => {
      // 5 rounds: lowest 1
      expect(service.getCountingDifferentials([15, 12, 20, 18, 14])).toEqual([12]);

      // 20+ rounds: lowest 8 from the most recent 20
      const recentRounds = [...new Array(8).fill(5), ...new Array(12).fill(20)];
      expect(service.getCountingDifferentials(recentRounds)).toEqual(new Array(8).fill(5));
    });
  });

  describe('determineTrend', () => {
    it('should return "improving" when the current index is lower than previous by more than 0.1', () => {
      expect(service.determineTrend(10, 10.2)).toBe('improving');
      expect(service.determineTrend(5.5, 6)).toBe('improving');
    });

    it('should return "worsening" when the current index is higher than previous by more than 0.1', () => {
      expect(service.determineTrend(10.2, 10)).toBe('worsening');
      expect(service.determineTrend(12.5, 12)).toBe('worsening');
    });

    it('should return "stable" when the difference is 0.1 or less', () => {
      expect(service.determineTrend(10, 10)).toBe('stable');
      expect(service.determineTrend(10, 10.1)).toBe('stable');
      expect(service.determineTrend(10.1, 10)).toBe('stable');
    });

    it('should return "stable" if either index is null', () => {
      expect(service.determineTrend(null, 10)).toBe('stable');
      expect(service.determineTrend(10, null)).toBe('stable');
      expect(service.determineTrend(null, null)).toBe('stable');
    });
  });
});
