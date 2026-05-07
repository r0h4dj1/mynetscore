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

/**
 * Formats persisted round date strings without shifting calendar days across timezones.
 */
@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
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
   * @returns The formatted date, or an empty string when no value is provided.
   */
  static format(value: string | null | undefined, mode: FormatDateMode = 'long'): string {
    if (!value) {
      return '';
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-GB', FORMAT_OPTIONS[mode]).format(date);
  }
}
