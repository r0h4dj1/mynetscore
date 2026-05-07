import { Pipe, PipeTransform } from '@angular/core';

export type FormatDateMode = 'short' | 'long';

const FORMAT_OPTIONS: Record<FormatDateMode, Intl.DateTimeFormatOptions> = {
  short: {
    day: 'numeric',
    month: 'short',
  },
  long: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
};

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Formats persisted round date strings without shifting calendar days across timezones.
 */
@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  private static readonly FORMATTERS: Record<FormatDateMode, Intl.DateTimeFormat> = {
    short: new Intl.DateTimeFormat('en-GB', FORMAT_OPTIONS.short),
    long: new Intl.DateTimeFormat('en-GB', FORMAT_OPTIONS.long),
  };

  /**
   * Pipe wrapper for {@link FormatDatePipe.format}.
   *
   * @param value - The date value in YYYY-MM-DD format.
   * @param mode - The display format to apply.
   * @returns The formatted date, or an empty string when no value is provided.
   */
  transform(value: string | null | undefined, mode: FormatDateMode = 'long'): string {
    return FormatDatePipe.format(value, mode);
  }

  /**
   * Formats an ISO calendar date string using local calendar semantics.
   *
   * @param value - The date value in YYYY-MM-DD format.
   * @param mode - The display format to apply.
   * @returns The formatted date, an empty string when no value is provided, or the original value when parsing fails.
   */
  static format(value: string | null | undefined, mode: FormatDateMode = 'long'): string {
    if (!value) {
      return '';
    }

    const match = DATE_PATTERN.exec(value);
    if (!match) {
      return value;
    }

    const [, yearValue, monthValue, dayValue] = match;
    const year = Number(yearValue);
    const month = Number(monthValue);
    const day = Number(dayValue);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return value;
    }

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return value;
    }

    return FormatDatePipe.FORMATTERS[mode].format(date);
  }
}
