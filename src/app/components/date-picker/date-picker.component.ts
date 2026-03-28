import { Component, ChangeDetectionStrategy, signal, computed, effect, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { WheelColumnComponent, WheelItem } from '../wheel-column/wheel-column.component';

/**
 * Component for selecting a date via wheel-style columns.
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, WheelColumnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-picker.component.html',
})
export class DatePickerComponent {
  private readonly bottomSheetService = inject(BottomSheetService);

  initialDate = input<string | undefined>();

  private readonly today = new Date();
  private readonly currentYear = this.today.getFullYear();
  private readonly currentMonth = this.today.getMonth();
  private readonly currentDay = this.today.getDate();

  readonly selectedYear = signal(this.currentYear);
  readonly selectedMonth = signal(this.currentMonth);
  readonly selectedDay = signal(this.currentDay);

  readonly years = computed<WheelItem[]>(() => {
    const arr: WheelItem[] = [];
    for (let y = this.currentYear - 100; y <= this.currentYear; y++) {
      arr.push({ label: y, value: y });
    }
    return arr;
  });

  private readonly allMonths: WheelItem[] = [
    { label: 'Jan', value: 0 },
    { label: 'Feb', value: 1 },
    { label: 'Mar', value: 2 },
    { label: 'Apr', value: 3 },
    { label: 'May', value: 4 },
    { label: 'Jun', value: 5 },
    { label: 'Jul', value: 6 },
    { label: 'Aug', value: 7 },
    { label: 'Sep', value: 8 },
    { label: 'Oct', value: 9 },
    { label: 'Nov', value: 10 },
    { label: 'Dec', value: 11 },
  ];

  readonly months = computed<WheelItem[]>(() => {
    const y = this.selectedYear();
    if (y === this.currentYear) {
      return this.allMonths.slice(0, this.currentMonth + 1);
    }
    return this.allMonths;
  });

  readonly days = computed<WheelItem[]>(() => {
    const y = this.selectedYear();
    const m = this.selectedMonth();

    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let maxDay = daysInMonth;

    if (y === this.currentYear && m === this.currentMonth) {
      maxDay = Math.min(daysInMonth, this.currentDay);
    }

    const arr: WheelItem[] = [];
    for (let d = 1; d <= maxDay; d++) {
      arr.push({ label: d, value: d });
    }
    return arr;
  });

  constructor() {
    effect(() => {
      const initDate = this.initialDate();
      if (initDate && typeof initDate === 'string') {
        const [y, m, d] = initDate.split('-').map(Number);
        if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
          this.selectedYear.set(y);
          this.selectedMonth.set(m - 1);
          this.selectedDay.set(d);
        }
      }
    });

    effect(() => {
      const validMonths = this.months();
      const currM = this.selectedMonth();
      if (!validMonths.some((m) => m.value === currM)) {
        const lastMonth = validMonths.at(-1);
        if (lastMonth) {
          this.selectedMonth.set(lastMonth.value);
        }
      }
    });

    effect(() => {
      const validDays = this.days();
      const currD = this.selectedDay();
      if (!validDays.some((d) => d.value === currD)) {
        const lastDay = validDays.at(-1);
        if (lastDay) {
          this.selectedDay.set(lastDay.value);
        }
      }
    });
  }

  /**
   * Handles year change from the wheel column.
   *
   * @param y - The selected year.
   */
  onYearChange(y: number) {
    this.selectedYear.set(y);
  }

  /**
   * Handles month change from the wheel column.
   *
   * @param m - The selected month (0-11).
   */
  onMonthChange(m: number) {
    this.selectedMonth.set(m);
  }

  /**
   * Handles day change from the wheel column.
   *
   * @param d - The selected day.
   */
  onDayChange(d: number) {
    this.selectedDay.set(d);
  }

  /**
   * Confirms the selection and dismisses the bottom sheet with the selected date.
   */
  confirm() {
    const y = this.selectedYear();
    const m = String(this.selectedMonth() + 1).padStart(2, '0');
    const d = String(this.selectedDay()).padStart(2, '0');
    this.bottomSheetService.dismiss({ date: `${y}-${m}-${d}` });
  }
}
