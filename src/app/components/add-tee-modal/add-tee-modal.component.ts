import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tee } from '../../database/db';
import { WHS_LIMITS } from '../../constants/whs.constants';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { TeeFormComponent } from '../tee-form/tee-form.component';

/**
 * Reusable bottom-sheet for adding a tee to an existing course.
 */
@Component({
  selector: 'app-add-tee-modal',
  templateUrl: './add-tee-modal.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TeeFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTeeModalComponent {
  private readonly courseService = inject(CourseService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly bottomSheetService = inject(BottomSheetService);

  /** The course ID to add the tee to. */
  @Input() courseId: string | null = null;

  readonly teeForm: FormGroup = this.fb.group({
    teeName: ['', Validators.required],
    rating: ['', [Validators.required, Validators.min(0.1)]],
    slope: ['', [Validators.required, Validators.min(WHS_LIMITS.MIN_SLOPE), Validators.max(WHS_LIMITS.MAX_SLOPE)]],
    par: ['', [Validators.required, Validators.min(1)]],
  });

  teeSubmitCount = 0;

  /**
   * Persists a new tee for the currently selected course.
   */
  async onSubmit(): Promise<void> {
    this.teeSubmitCount++;

    if (!this.courseId) {
      this.toastService.presentErrorToast('Select a course before adding a tee.');
      return;
    }

    if (this.teeForm.invalid) {
      this.toastService.presentErrorToast('Please ensure all fields are correctly filled out.');
      return;
    }

    const { teeName, rating, slope, par } = this.teeForm.getRawValue();

    try {
      const teeId = await this.courseService.addTee({
        courseId: this.courseId,
        name: teeName,
        rating: Number(rating),
        slope: Number(slope),
        par: Number(par),
      });

      const result: Tee = {
        id: teeId,
        courseId: this.courseId,
        name: teeName,
        rating: Number(rating),
        slope: Number(slope),
        par: Number(par),
      };

      this.resetState();
      this.bottomSheetService.dismiss(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add tee.';
      this.toastService.presentErrorToast(message);
    }
  }

  private resetState(): void {
    this.teeSubmitCount = 0;
    this.teeForm.reset({ teeName: '', rating: '', slope: '', par: '' });
  }
}
