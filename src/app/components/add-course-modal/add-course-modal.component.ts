import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Course, Tee } from '../../database/db';
import { ValidationStatusDirective } from '../../directives/validation-status.directive';
import { WHS_LIMITS } from '../../constants/whs.constants';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';

export interface AddCourseModalResult {
  course: Course;
  tee: Tee;
}

/**
 * Reusable bottom-sheet for creating a course and its initial tee in one flow.
 */
@Component({
  selector: 'app-add-course-modal',
  templateUrl: './add-course-modal.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, ValidationStatusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCourseModalComponent {
  private readonly courseService = inject(CourseService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly bottomSheetService = inject(BottomSheetService);

  readonly courseForm: FormGroup = this.fb.group({
    courseName: ['', Validators.required],
    teeName: ['', Validators.required],
    rating: ['', [Validators.required, Validators.min(0.1)]],
    slope: ['', [Validators.required, Validators.min(WHS_LIMITS.MIN_SLOPE), Validators.max(WHS_LIMITS.MAX_SLOPE)]],
    par: ['', [Validators.required, Validators.min(1)]],
  });

  addCourseSubmitCount = 0;

  /**
   * Persists a new course and tee from the modal form.
   */
  async onSubmit(): Promise<void> {
    this.addCourseSubmitCount++;

    if (this.courseForm.invalid) {
      this.toastService.presentErrorToast('Please ensure all fields are correctly filled out.');
      return;
    }

    const { courseName, teeName, rating, slope, par } = this.courseForm.getRawValue();

    try {
      const { course, tee } = await this.courseService.addCourseWithTee(courseName, {
        name: teeName,
        rating: Number(rating),
        slope: Number(slope),
        par: Number(par),
      });

      const result: AddCourseModalResult = {
        course,
        tee,
      };

      this.resetState();
      this.bottomSheetService.dismiss(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add course and tee.';
      this.toastService.presentErrorToast(message);
    }
  }

  private resetState(): void {
    this.addCourseSubmitCount = 0;
    this.courseForm.reset({ courseName: '', teeName: '', rating: '', slope: '', par: '' });
  }
}
