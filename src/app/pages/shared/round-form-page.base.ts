import { ChangeDetectorRef, inject } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Course, Tee } from '../../database/db';
import { ROUND_LIMITS } from '../../constants/whs.constants';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import {
  ListSelectorModalComponent,
  SelectorItem,
} from '../../components/list-selector-modal/list-selector-modal.component';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';

export interface RoundFormValue {
  courseId: string;
  teeId: string;
  date: string;
  grossScore: string;
}

interface DatePickerResult {
  date: string;
}

interface RoundFormControls {
  courseId: FormControl<string>;
  teeId: FormControl<string>;
  date: FormControl<string>;
  grossScore: FormControl<string>;
}

/**
 * Shared round-form state and selector behavior used by round entry pages.
 */
export abstract class RoundFormPageBase {
  protected readonly courseService = inject(CourseService);
  protected readonly toastService = inject(ToastService);
  protected readonly bottomSheetService = inject(BottomSheetService);
  protected readonly cdr = inject(ChangeDetectorRef);

  readonly todayIsoDate = this.getTodayIsoDate();
  readonly minGrossScore = ROUND_LIMITS.MIN_GROSS_SCORE;
  readonly maxGrossScore = ROUND_LIMITS.MAX_GROSS_SCORE;
  readonly roundForm: FormGroup<RoundFormControls>;

  courses: Course[] = [];
  tees: Tee[] = [];
  submitCount = 0;

  protected readonly dismissedValidationFields = new Set<keyof RoundFormValue>();

  protected constructor(initialDate?: string) {
    this.roundForm = new FormGroup<RoundFormControls>({
      courseId: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      teeId: new FormControl(
        { value: '', disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      date: new FormControl(initialDate ?? this.todayIsoDate, {
        nonNullable: true,
        validators: [Validators.required, this.futureDateValidator()],
      }),
      grossScore: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(ROUND_LIMITS.MIN_GROSS_SCORE),
          Validators.max(ROUND_LIMITS.MAX_GROSS_SCORE),
          Validators.pattern(/^\d+$/),
        ],
      }),
    });
  }

  /**
   * Returns whether a field should currently show its invalid state.
   *
   * @param controlName - The form control name to inspect.
   * @returns Whether the control should display its invalid styling.
   */
  shouldShowError(controlName: keyof RoundFormValue): boolean {
    const control = this.roundForm.controls[controlName];
    return (
      !!control &&
      control.invalid &&
      (control.touched || this.submitCount > 0) &&
      !this.dismissedValidationFields.has(controlName)
    );
  }

  /**
   * Dismisses validation styling for a field after the user taps it.
   *
   * @param controlName - The form control to clear from the dismissed set.
   */
  dismissValidationError(controlName: keyof RoundFormValue): void {
    this.dismissedValidationFields.add(controlName);
  }

  /**
   * Handles a user changing the selected course.
   *
   * @param courseId - The newly selected course identifier.
   */
  async onCourseChanged(courseId: string): Promise<void> {
    this.roundForm.controls.courseId.setValue(courseId);
    await this.applySelectedCourse(courseId);
  }

  /**
   * Handles tapping the course selector and dismisses any current validation state.
   */
  async onCourseSelectorTap(): Promise<void> {
    this.dismissValidationError('courseId');
    await this.openCourseSelector();
  }

  /**
   * Opens the course list selector modal.
   */
  async openCourseSelector(): Promise<void> {
    const items: SelectorItem[] = this.courses.map((course) => ({
      id: course.id,
      label: course.name,
    }));

    const result = await this.bottomSheetService.open(ListSelectorModalComponent, {
      title: 'Select a course',
      items,
      selectedId: this.selectedCourseId,
    });

    if (typeof result === 'string') {
      await this.onCourseChanged(result);
      this.cdr.markForCheck();
    }
  }

  /**
   * Opens the tee list selector modal.
   */
  async openTeeSelector(): Promise<void> {
    if (this.roundForm.controls.teeId.disabled) {
      return;
    }

    const items: SelectorItem[] = this.tees.map((tee) => ({
      id: tee.id,
      label: tee.name,
      subLabel: `${tee.rating} · ${tee.slope} · ${tee.par}`,
    }));

    const result = await this.bottomSheetService.open(ListSelectorModalComponent, {
      title: 'Select a tee',
      items,
      selectedId: this.roundForm.controls.teeId.value,
    });

    if (typeof result === 'string') {
      this.roundForm.controls.teeId.setValue(result);
      this.roundForm.controls.teeId.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles tapping the tee selector and dismisses any current validation state.
   */
  async onTeeSelectorTap(): Promise<void> {
    this.dismissValidationError('teeId');
    await this.openTeeSelector();
  }

  /**
   * Handles tapping the date selector and dismisses any current validation state.
   */
  async onDateSelectorTap(): Promise<void> {
    this.dismissValidationError('date');
    await this.openDatePicker();
  }

  /**
   * Returns the helper text shown beneath the save button when the form is incomplete.
   *
   * @returns The helper copy for the current save-button state.
   */
  get saveHelperText(): string {
    return this.roundForm.valid ? '' : 'Complete all required fields';
  }

  /**
   * Returns the currently selected course identifier.
   *
   * @returns The selected course ID, if one exists.
   */
  get selectedCourseId(): string {
    return this.roundForm.controls.courseId.getRawValue();
  }

  /**
   * Returns the label of the currently selected course.
   *
   * @returns The name of the selected course, or an empty string.
   */
  get selectedCourseLabel(): string {
    const course = this.findSelectedCourse();
    return course ? course.name : '';
  }

  /**
   * Returns the name of the currently selected tee.
   *
   * @returns The formatted name of the selected tee, or an empty string.
   */
  get selectedTeeName(): string {
    const tee = this.findSelectedTee();
    return tee ? tee.name : '';
  }

  /**
   * Returns formatted tee details (rating, slope, par).
   *
   * @returns The tee details string or empty string if no tee is selected.
   */
  get selectedTeeDetails(): string {
    const tee = this.findSelectedTee();
    return tee ? `${tee.rating} · ${tee.slope} · ${tee.par}` : '';
  }

  /**
   * Returns the formatted date label used in the date field.
   *
   * @returns The human-readable date label shown in the trigger row.
   */
  get formattedDateLabel(): string {
    const value = this.roundForm.controls.date.getRawValue();
    if (!value) {
      return '';
    }

    const formattedDate = this.formatDate(value);
    return this.isToday(value) ? `${formattedDate} (Today)` : formattedDate;
  }

  /**
   * Opens the date picker overlay.
   */
  async openDatePicker(): Promise<void> {
    const result = await this.bottomSheetService.open(DatePickerComponent, {
      initialDate: this.roundForm.controls.date.getRawValue(),
    });

    if (this.isDatePickerResult(result)) {
      this.roundForm.controls.date.setValue(result.date);
      this.roundForm.controls.date.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  protected async applySelectedCourse(courseId: string, resetTeeSelection = true): Promise<void> {
    if (!courseId) {
      this.resetTeeOptions();
      this.cdr.markForCheck();
      return;
    }

    try {
      const tees = await this.courseService.getTees(courseId);
      this.tees = this.sortByName(tees);
      this.roundForm.controls.teeId.enable();

      const selectedTeeId = this.roundForm.controls.teeId.getRawValue();
      if (resetTeeSelection || !this.tees.some((tee) => tee.id === selectedTeeId)) {
        this.roundForm.controls.teeId.reset('');
      }
    } catch {
      this.resetTeeOptions();
      this.toastService.presentErrorToast('Failed to load tees.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  protected formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  protected sortByName<T extends { name: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }

  private resetTeeOptions(): void {
    this.tees = [];
    this.roundForm.controls.teeId.reset('');
    this.roundForm.controls.teeId.disable();
  }

  private findSelectedCourse(): Course | undefined {
    const courseId = this.selectedCourseId;
    return courseId ? this.courses.find((course) => course.id === courseId) : undefined;
  }

  private findSelectedTee(): Tee | undefined {
    const teeId = this.roundForm.controls.teeId.getRawValue();
    return teeId ? this.tees.find((tee) => tee.id === teeId) : undefined;
  }

  private isDatePickerResult(result: unknown): result is DatePickerResult {
    return !!result && typeof result === 'object' && 'date' in result && typeof result.date === 'string';
  }

  private futureDateValidator(): ValidatorFn {
    return (control): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }

      return value > this.getTodayIsoDate() ? { futureDate: true } : null;
    };
  }

  private getTodayIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = `${today.getMonth() + 1}`.padStart(2, '0');
    const day = `${today.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isToday(value: string): boolean {
    return value === this.todayIsoDate;
  }
}
