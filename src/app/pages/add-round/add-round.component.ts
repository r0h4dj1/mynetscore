import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AddCourseModalComponent,
  AddCourseModalResult,
} from '../../components/add-course-modal/add-course-modal.component';
import { AddTeeModalComponent } from '../../components/add-tee-modal/add-tee-modal.component';
import { Tee } from '../../database/db';
import { HandicapStateService } from '../../services/handicap-state.service';
import { RoundService } from '../../services/round.service';

import { PopUpComponent } from '../../components/pop-up/pop-up.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { RoundFormFieldsComponent } from '../../components/round-form-fields/round-form-fields.component';
import { RoundFormPageBase } from '../shared/round-form-page.base';
import { FormatDatePipe } from '../../pipes/format-date.pipe';

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
  host: { class: 'block h-full' },
  templateUrl: './add-round.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopUpComponent, PageHeaderComponent, RoundFormFieldsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRoundPage extends RoundFormPageBase implements OnInit {
  private readonly roundService = inject(RoundService);
  private readonly handicapStateService = inject(HandicapStateService);
  private readonly router = inject(Router);
  isSaving = false;
  showDuplicateConfirmation = false;
  duplicateSummary = '';
  private pendingRoundPayload: PendingRoundPayload | null = null;

  constructor() {
    super();
  }

  /**
   * Initializes the component.
   */
  ngOnInit(): void {
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
  onCourseCreated(result: AddCourseModalResult): void {
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

    this.isSaving = true;
    this.cdr.markForCheck();

    const payload = this.buildRoundPayload();

    if (!skipDuplicateCheck) {
      try {
        const duplicateRound = await this.roundService.findDuplicateRound(payload.teeId, payload.date);
        if (duplicateRound) {
          this.isSaving = false;
          this.pendingRoundPayload = payload;
          this.duplicateSummary = this.buildDuplicateSummary();
          this.showDuplicateConfirmation = true;
          this.cdr.markForCheck();
          return;
        }
      } catch (error) {
        this.isSaving = false;
        const message = error instanceof Error ? error.message : 'Failed to check for duplicates.';
        this.toastService.presentErrorToast(message);
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
   * Returns whether the tee action should be disabled.
   *
   * @returns Whether the add-tee action should be unavailable.
   */
  get isAddTeeDisabled(): boolean {
    return !this.selectedCourseId;
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
    const formattedDate = FormatDatePipe.format(this.roundForm.controls.date.getRawValue(), 'long');

    if (!selectedCourse || !selectedTee) {
      return `A round already exists for ${formattedDate}.`;
    }

    return `A round on ${selectedTee.name} tee at ${selectedCourse.name} already exists for ${formattedDate}.`;
  }
}
