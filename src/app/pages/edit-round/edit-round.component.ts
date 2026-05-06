import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Round } from '../../database/db';
import { HandicapStateService } from '../../services/handicap-state.service';
import { RoundService } from '../../services/round.service';

import { PopUpComponent } from '../../components/pop-up/pop-up.component';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { RoundFormFieldsComponent } from '../../components/round-form-fields/round-form-fields.component';
import { RoundFormPageBase } from '../shared/round-form-page.base';

/**
 * Component representing the page for editing or deleting an existing round.
 */
@Component({
  selector: 'app-edit-round',
  host: { class: 'block h-full' },
  templateUrl: './edit-round.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PopUpComponent, PageHeaderComponent, RoundFormFieldsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditRoundPage extends RoundFormPageBase implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roundService = inject(RoundService);
  private readonly handicapStateService = inject(HandicapStateService);

  roundId: string | null = null;
  round: Round | undefined;
  isSaving = false;
  isDeleting = false;
  showDeleteConfirmation = false;

  constructor() {
    super('');
  }

  /**
   * Initializes the component by loading the round referenced by the URL id.
   */
  async ngOnInit(): Promise<void> {
    this.roundId = this.route.snapshot.paramMap.get('id');
    if (!this.roundId) {
      await this.router.navigateByUrl('/rounds');
      return;
    }
    await this.loadRound();
  }

  /**
   * Persists the form to the round and navigates back to the rounds list.
   */
  async onSubmit(): Promise<void> {
    this.submitCount++;
    this.dismissedValidationFields.clear();
    this.roundForm.markAllAsTouched();

    if (this.roundForm.invalid || this.isSaving || this.isDeleting || !this.roundId) {
      this.cdr.markForCheck();
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    const { teeId, date, grossScore } = this.roundForm.getRawValue();

    try {
      await this.roundService.updateRound(this.roundId, {
        teeId,
        date,
        grossScore: Number(grossScore),
      });
      await this.handicapStateService.refresh();
      await this.router.navigateByUrl('/rounds');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update round.';
      this.toastService.presentErrorToast(message);
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Opens the delete confirmation pop-up.
   */
  askDelete(): void {
    this.showDeleteConfirmation = true;
    this.cdr.markForCheck();
  }

  /**
   * Dismisses the delete confirmation pop-up.
   */
  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.cdr.markForCheck();
  }

  /**
   * Deletes the current round and navigates back to the rounds list.
   */
  async confirmDelete(): Promise<void> {
    if (!this.roundId || this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    this.showDeleteConfirmation = false;
    this.cdr.markForCheck();

    try {
      await this.roundService.deleteRound(this.roundId);
      await this.handicapStateService.refresh();
      await this.router.navigateByUrl('/rounds');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete round.';
      this.toastService.presentErrorToast(message);
    } finally {
      this.isDeleting = false;
      this.cdr.markForCheck();
    }
  }

  private async loadRound(): Promise<void> {
    try {
      const round = await this.roundService.getRound(this.roundId!);
      if (!round) {
        this.toastService.presentErrorToast('Round not found.');
        await this.router.navigateByUrl('/rounds');
        return;
      }
      this.round = round;

      const tee = await this.courseService.getTeeById(round.teeId);
      if (!tee) {
        this.toastService.presentErrorToast('Round is linked to a missing tee.');
        await this.router.navigateByUrl('/rounds');
        return;
      }

      this.courses = this.sortByName(await this.courseService.getCourses());

      this.roundForm.patchValue({
        courseId: tee.courseId,
        date: round.date,
        grossScore: String(round.grossScore),
      });

      await this.applySelectedCourse(tee.courseId, false);
      this.roundForm.controls.teeId.setValue(round.teeId);
    } catch {
      this.toastService.presentErrorToast('Failed to load round.');
    } finally {
      this.cdr.markForCheck();
    }
  }
}
