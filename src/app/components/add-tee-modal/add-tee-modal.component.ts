import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonModal } from '@ionic/angular/standalone';
import { Tee } from '../../database/db';
import { ValidationStatusDirective } from '../../directives/validation-status.directive';
import { WHS_LIMITS } from '../../constants/whs.constants';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';

/**
 * Reusable bottom-sheet for adding a tee to an existing course.
 */
@Component({
  selector: 'app-add-tee-modal',
  templateUrl: './add-tee-modal.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, IonModal, ValidationStatusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTeeModalComponent {
  private readonly courseService = inject(CourseService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  @ViewChild(IonModal) modal!: IonModal;

  /**
   * The course that newly created tees should belong to.
   */
  @Input() courseId: string | null = null;

  /**
   * Emits the created tee after a successful save.
   */
  @Output() saved = new EventEmitter<Tee>();

  readonly teeForm: FormGroup = this.fb.group({
    teeName: ['', Validators.required],
    rating: ['', [Validators.required, Validators.min(0.1)]],
    slope: ['', [Validators.required, Validators.min(WHS_LIMITS.MIN_SLOPE), Validators.max(WHS_LIMITS.MAX_SLOPE)]],
    par: ['', [Validators.required, Validators.min(1)]],
  });

  teeSubmitCount = 0;

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
   * Persists a new tee for the currently selected course.
   */
  async onSubmit(): Promise<void> {
    this.teeSubmitCount++;

    if (!this.courseId) {
      await this.toastService.presentErrorToast('Select a course before adding a tee.');
      return;
    }

    if (this.teeForm.invalid) {
      await this.toastService.presentErrorToast('Please ensure all fields are correctly filled out.');
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

      this.saved.emit({
        id: teeId,
        courseId: this.courseId,
        name: teeName,
        rating: Number(rating),
        slope: Number(slope),
        par: Number(par),
      });

      this.resetState();
      await this.dismiss(undefined, 'save');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add tee.';
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
    this.teeSubmitCount = 0;
    this.teeForm.reset();
  }
}
