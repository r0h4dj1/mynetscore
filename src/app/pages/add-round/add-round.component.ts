import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import {
  AddCourseModalComponent,
  AddCourseModalResult,
} from '../../components/add-course-modal/add-course-modal.component';
import { AddTeeModalComponent } from '../../components/add-tee-modal/add-tee-modal.component';
import { Course, Tee } from '../../database/db';
import { ROUND_LIMITS } from '../../constants/whs.constants';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { CourseService } from '../../services/course.service';
import { HandicapStateService } from '../../services/handicap-state.service';
import { RoundService } from '../../services/round.service';
import { ToastService } from '../../services/toast.service';
import { ValidationStatusDirective } from '../../directives/validation-status.directive';
import {
  ListSelectorModalComponent,
  SelectorItem,
} from '../../components/list-selector-modal/list-selector-modal.component';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';

interface RoundFormValue {
  courseId: string;
  teeId: string;
  date: string;
  grossScore: string;
}

interface PendingRoundPayload {
  teeId: string;
  date: string;
  grossScore: number;
}

/**
 * Component representing the page for adding a new round.
 */
@Component({
  selector: 'app-add-round',
  templateUrl: './add-round.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIcon, ValidationStatusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRoundPage {
  private readonly courseService = inject(CourseService);
  private readonly roundService = inject(RoundService);
  private readonly handicapStateService = inject(HandicapStateService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly bottomSheetService = inject(BottomSheetService);

  readonly todayIsoDate = this.getTodayIsoDate();
  readonly minGrossScore = ROUND_LIMITS.MIN_GROSS_SCORE;
  readonly maxGrossScore = ROUND_LIMITS.MAX_GROSS_SCORE;

  readonly roundForm = this.fb.nonNullable.group({
    courseId: ['', Validators.required],
    teeId: [{ value: '', disabled: true }, Validators.required],
    date: [this.todayIsoDate, [Validators.required, this.futureDateValidator()]],
    grossScore: [
      '',
      [
        Validators.required,
        Validators.min(ROUND_LIMITS.MIN_GROSS_SCORE),
        Validators.max(ROUND_LIMITS.MAX_GROSS_SCORE),
        Validators.pattern(/^\d+$/),
      ],
    ],
  });

  courses: Course[] = [];
  tees: Tee[] = [];
  submitCount = 0;
  isSaving = false;
  showDuplicateConfirmation = false;
  duplicateSummary = '';
  private readonly dismissedValidationFields = new Set<keyof RoundFormValue>();
  private pendingRoundPayload: PendingRoundPayload | null = null;

  /**
   * Ionic lifecycle hook — fires every time the view becomes active.
   */
  ionViewWillEnter(): void {
    this.resetForm();
    void this.loadCourses();
  }

  /**
   * Resets the form and component state to initial values.
   */
  private resetForm(): void {
    this.roundForm.reset({
      courseId: '',
      teeId: '',
      date: this.todayIsoDate,
      grossScore: '',
    });
    this.roundForm.controls.teeId.disable();
    this.tees = [];
    this.submitCount = 0;
    this.isSaving = false;
    this.showDuplicateConfirmation = false;
    this.duplicateSummary = '';
    this.pendingRoundPayload = null;
    this.dismissedValidationFields.clear();
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
   * Opens the inline add-course modal.
   */
  async openAddCourseModal(): Promise<void> {
    const result = await this.bottomSheetService.open(AddCourseModalComponent);
    if (result) {
      this.onCourseCreated(result as AddCourseModalResult);
    }
  }

  /**
   * Opens the inline add-tee modal for the selected course.
   */
  async openAddTeeModal(): Promise<void> {
    if (!this.selectedCourseId) {
      return;
    }

    const result = await this.bottomSheetService.open(AddTeeModalComponent, {
      courseId: this.selectedCourseId,
    });
    if (result) {
      this.onTeeCreated(result as Tee);
    }
  }

  /**
   * Updates local state after a course and its initial tee were created inline.
   *
   * @param result - The saved course and tee returned by the add-course modal.
   */
  async onCourseCreated(result: AddCourseModalResult): Promise<void> {
    this.courses = this.sortByName([...this.courses, result.course]);
    this.roundForm.controls.courseId.setValue(result.course.id);
    this.tees = [result.tee];
    this.roundForm.controls.teeId.enable();
    this.roundForm.controls.teeId.setValue(result.tee.id);
    this.cdr.markForCheck();
  }

  /**
   * Updates local tee options after a new tee was created inline.
   *
   * @param tee - The tee returned by the add-tee modal.
   */
  onTeeCreated(tee: Tee): void {
    this.tees = this.sortByName([...this.tees, tee]);
    this.roundForm.controls.teeId.setValue(tee.id);
    this.cdr.markForCheck();
  }

  /**
   * Starts the save flow, optionally bypassing the duplicate prompt.
   *
   * @param skipDuplicateCheck - Whether duplicate detection should be bypassed.
   */
  async onSubmit(skipDuplicateCheck = false): Promise<void> {
    this.submitCount++;
    this.dismissedValidationFields.clear();
    this.roundForm.markAllAsTouched();

    if (this.roundForm.invalid || this.isSaving) {
      this.cdr.markForCheck();
      return;
    }

    const payload = this.buildRoundPayload();

    if (!skipDuplicateCheck) {
      const duplicateRound = await this.roundService.findDuplicateRound(payload.teeId, payload.date);
      if (duplicateRound) {
        this.pendingRoundPayload = payload;
        this.duplicateSummary = this.buildDuplicateSummary();
        this.showDuplicateConfirmation = true;
        this.cdr.markForCheck();
        return;
      }
    }

    await this.saveRound(payload);
  }

  /**
   * Cancels the duplicate confirmation dialog.
   */
  cancelDuplicateConfirmation(): void {
    this.showDuplicateConfirmation = false;
    this.pendingRoundPayload = null;
    this.cdr.markForCheck();
  }

  /**
   * Confirms the duplicate and persists the round anyway.
   */
  async confirmDuplicateSave(): Promise<void> {
    if (!this.pendingRoundPayload) {
      return;
    }

    const pendingPayload = this.pendingRoundPayload;
    this.showDuplicateConfirmation = false;
    this.pendingRoundPayload = null;
    this.cdr.markForCheck();
    await this.saveRound(pendingPayload);
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
    const courseId = this.selectedCourseId;
    if (!courseId) return '';
    const course = this.courses.find((c) => c.id === courseId);
    return course ? course.name : '';
  }

  /**
   * Returns the name of the currently selected tee.
   *
   * @returns The formatted name of the selected tee, or an empty string.
   */
  get selectedTeeName(): string {
    const teeId = this.roundForm.controls.teeId.getRawValue();
    if (!teeId) return '';
    const tee = this.tees.find((t) => t.id === teeId);
    return tee ? tee.name : '';
  }

  /**
   * Returns formatted tee details (rating, slope, par).
   *
   * @returns The tee details string or empty string if no tee is selected.
   */
  get selectedTeeDetails(): string {
    const teeId = this.roundForm.controls.teeId.getRawValue();
    if (!teeId) return '';
    const tee = this.tees.find((t) => t.id === teeId);
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
   * Returns whether the tee action should be disabled.
   *
   * @returns Whether the add-tee action should be unavailable.
   */
  get isAddTeeDisabled(): boolean {
    return !this.selectedCourseId;
  }

  /**
   * Opens the date picker overlay.
   */
  async openDatePicker(): Promise<void> {
    const result = await this.bottomSheetService.open(DatePickerComponent, {
      initialDate: this.roundForm.controls.date.getRawValue(),
    });

    if (result && typeof result === 'object' && 'date' in result) {
      this.roundForm.controls.date.setValue((result as { date: string }).date);
      this.roundForm.controls.date.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  /**
   * Loads persisted courses and refreshes tee options for any active selection.
   */
  async loadCourses(): Promise<void> {
    try {
      const courses = await this.courseService.getCourses();
      this.courses = this.sortByName(courses);
      await this.applySelectedCourse(this.selectedCourseId, false);
    } catch {
      this.toastService.presentErrorToast('Failed to load courses.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  private async applySelectedCourse(courseId: string, resetTeeSelection = true): Promise<void> {
    if (!courseId) {
      this.tees = [];
      this.roundForm.controls.teeId.reset('');
      this.roundForm.controls.teeId.disable();
      this.cdr.markForCheck();
      return;
    }

    try {
      const tees = await this.courseService.getTees(courseId);
      this.tees = this.sortByName(tees);
      this.roundForm.controls.teeId.enable();

      if (resetTeeSelection || !this.tees.some((tee) => tee.id === this.roundForm.controls.teeId.getRawValue())) {
        this.roundForm.controls.teeId.reset('');
      }
    } catch {
      this.tees = [];
      this.roundForm.controls.teeId.reset('');
      this.roundForm.controls.teeId.disable();
      this.toastService.presentErrorToast('Failed to load tees.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  private buildRoundPayload(): PendingRoundPayload {
    const value = this.roundForm.getRawValue();
    return {
      teeId: value.teeId,
      date: value.date,
      grossScore: Number(value.grossScore),
    };
  }

  private async saveRound(payload: PendingRoundPayload): Promise<void> {
    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      await this.roundService.addRound(payload);
      await this.handicapStateService.refresh();
      await this.router.navigateByUrl('/rounds');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save round.';
      this.toastService.presentErrorToast(message);
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  private buildDuplicateSummary(): string {
    const selectedCourse = this.courses.find((course) => course.id === this.selectedCourseId);
    const selectedTee = this.tees.find((tee) => tee.id === this.roundForm.controls.teeId.getRawValue());

    if (!selectedCourse || !selectedTee) {
      return `A round already exists for ${this.formatDate(this.roundForm.controls.date.getRawValue())}.`;
    }

    return `A round on ${selectedTee.name} tee at ${selectedCourse.name} already exists for ${this.formatDate(this.roundForm.controls.date.getRawValue())}.`;
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

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private sortByName<T extends { name: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }
}
