import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonModal } from '@ionic/angular/standalone';
import { Course, Tee } from '../../database/db';
import { ValidationStatusDirective } from '../../directives/validation-status.directive';
import { WHS_LIMITS } from '../../constants/whs.constants';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';

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
  imports: [ReactiveFormsModule, IonModal, ValidationStatusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCourseModalComponent {
  private readonly courseService = inject(CourseService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  @ViewChild(IonModal) modal!: IonModal;

  /**
   * Optional DOM trigger ID for declarative modal opening.
   */
  @Input() trigger?: string;

  /**
   * Emits the created course and tee after a successful save.
   */
  @Output() saved = new EventEmitter<AddCourseModalResult>();

  readonly courseForm: FormGroup = this.fb.group({
    courseName: ['', Validators.required],
    teeName: ['', Validators.required],
    rating: ['', [Validators.required, Validators.min(0.1)]],
    slope: ['', [Validators.required, Validators.min(WHS_LIMITS.MIN_SLOPE), Validators.max(WHS_LIMITS.MAX_SLOPE)]],
    par: ['', [Validators.required, Validators.min(1)]],
  });

  addCourseSubmitCount = 0;

  /**
   * Opens the modal programmatically.
   */
  async present(): Promise<void> {
    await this.modal.present();
  }

  /**
   * Closes the modal programmatically.
   *
   * @param data - Optional dismissal payload.
   * @param role - Optional Ionic dismissal role.
   */
  async dismiss(data?: unknown, role?: string): Promise<void> {
    await this.modal.dismiss(data, role);
  }

  /**
   * Persists a new course and tee from the modal form.
   */
  async onSubmit(): Promise<void> {
    this.addCourseSubmitCount++;

    if (this.courseForm.invalid) {
      await this.toastService.presentErrorToast('Please ensure all fields are correctly filled out.');
      return;
    }

    const { courseName, teeName, rating, slope, par } = this.courseForm.getRawValue();

    try {
      const courseId = await this.courseService.addCourse(courseName);
      const teeId = await this.courseService.addTee({
        courseId,
        name: teeName,
        rating: Number(rating),
        slope: Number(slope),
        par: Number(par),
      });

      this.saved.emit({
        course: { id: courseId, name: courseName },
        tee: {
          id: teeId,
          courseId,
          name: teeName,
          rating: Number(rating),
          slope: Number(slope),
          par: Number(par),
        },
      });

      this.resetState();
      await this.dismiss(undefined, 'save');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add course and tee.';
      await this.toastService.presentErrorToast(message);
    }
  }

  /**
   * Resets form state after the modal closes.
   */
  onDidDismiss(): void {
    this.resetState();
  }

  private resetState(): void {
    this.addCourseSubmitCount = 0;
    this.courseForm.reset();
  }
}
