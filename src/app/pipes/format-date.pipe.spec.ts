import { FormatDatePipe } from './format-date.pipe';

// These tests verify format correctness only. The UTC off-by-one regression (dates
// displaying one day earlier for UTC+ users) is structural: the fix avoids new Date(string)
// in favour of new Date(year, month - 1, day) so the date is always local midnight.
// That invariant can only be demonstrated end-to-end in a UTC+ environment (e.g. TZ=Europe/London).
describe('FormatDatePipe', () => {
  const pipe = new FormatDatePipe();

  it('formats a YYYY-MM-DD string in short mode without UTC conversion', () => {
    expect(pipe.transform('2026-05-03', 'short')).toBe('3 May');
  });

  it('formats a YYYY-MM-DD string in long mode without UTC conversion', () => {
    expect(pipe.transform('2026-05-03', 'long')).toBe('3 May 2026');
  });

  it('uses long mode by default', () => {
    expect(pipe.transform('2026-05-03')).toBe('3 May 2026');
  });

  it('returns an empty string when no date is provided', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(null)).toBe('');
  });

  it.each(['2026/05/03', '2026-05', '2026-May-03', '2026-02-31'])(
    'returns the original value when %s cannot be parsed as a valid YYYY-MM-DD date',
    (value) => {
      expect(pipe.transform(value)).toBe(value);
    },
  );
});
