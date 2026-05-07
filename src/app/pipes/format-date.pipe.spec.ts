import { FormatDatePipe } from './format-date.pipe';

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
});
