import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonModal } from '@ionic/angular/standalone';
import { NgIcon } from '@ng-icons/core';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { Course, Tee } from '../../database/db';
import { ValidationStatusDirective } from '../../directives/validation-status.directive';
import { WHS_LIMITS } from '../../constants/whs.constants';

/**
 * Component representing the course detail page.
 */
@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, IonModal, NgIcon, ValidationStatusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);

  @ViewChild('editCourseModal') editCourseModal!: IonModal;
  @ViewChild('editTeeModal') editTeeModal!: IonModal;

  courseId: string | null = null;
  course: Course | undefined;
  tees: Tee[] = [];
  editingTeeId: string | null = null;

  teeForm: FormGroup;
  editCourseForm: FormGroup;
  editTeeForm: FormGroup;

  teeSubmitCount = 0;

  constructor() {
    this.teeForm = this.fb.group({
      teeName: ['', Validators.required],
      rating: ['', [Validators.required, Validators.min(0.1)]],
      slope: ['', [Validators.required, Validators.min(WHS_LIMITS.MIN_SLOPE), Validators.max(WHS_LIMITS.MAX_SLOPE)]],
      par: ['', [Validators.required, Validators.min(1)]],
    });

    this.editCourseForm = this.fb.group({
      courseName: ['', Validators.required],
    });

    this.editTeeForm = this.fb.group({
      teeName: ['', Validators.required],
      rating: ['', [Validators.required, Validators.min(0.1)]],
      slope: ['', [Validators.required, Validators.min(WHS_LIMITS.MIN_SLOPE), Validators.max(WHS_LIMITS.MAX_SLOPE)]],
      par: ['', [Validators.required, Validators.min(1)]],
    });
  }

  /**
   * Initializes the component.
   */
  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.courseId = params.get('id');
      if (this.courseId) {
        this.loadCourseData();
      }
    });
  }

  /**
   * Loads course and tee data.
   */
  async loadCourseData() {
    if (!this.courseId) return;

    try {
      this.course = await this.courseService.getCourse(this.courseId);
      if (!this.course) {
        this.router.navigate(['/courses']);
        return;
      }

      const fetchedTees = await this.courseService.getTees(this.courseId);
      fetchedTees.sort((a, b) => a.name.localeCompare(b.name));
      this.tees = fetchedTees;
    } catch {
      this.toastService.presentErrorToast('Failed to load course data.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles submitting the add tee form.
   */
  async onAddTeeSubmit() {
    if (!this.courseId) return;

    this.teeSubmitCount++;

    if (this.teeForm.invalid) {
      this.toastService.presentErrorToast('Please ensure all fields are correctly filled out.');
      return;
    }

    const { teeName, rating, slope, par } = this.teeForm.value;

    try {
      await this.courseService.addTee({
        courseId: this.courseId,
        name: teeName,
        rating: Number(rating),
        slope: Number(slope),
        par: Number(par),
      });

      this.teeSubmitCount = 0;
      this.teeForm.reset();
      await this.loadCourseData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.toastService.presentErrorToast(message || 'Failed to add tee.');
    }
  }

  /**
   * Opens the edit course modal and pre-populates current values.
   */
  async openEditCourseModal() {
    if (!this.course) return;

    this.editCourseForm.setValue({
      courseName: this.course.name,
    });
    await this.editCourseModal.present();
  }

  /**
   * Opens the edit tee modal and pre-populates current tee values.
   *
   * @param tee - The tee selected for editing.
   */
  async openEditTeeModal(tee: Tee) {
    this.editingTeeId = tee.id;
    this.editTeeForm.setValue({
      teeName: tee.name,
      rating: tee.rating,
      slope: tee.slope,
      par: tee.par,
    });
    await this.editTeeModal.present();
  }

  /**
   * Handles submitting the edit course form.
   */
  async onEditCourseSubmit() {
    if (!this.courseId) return;

    if (this.editCourseForm.invalid) {
      this.toastService.presentErrorToast('Please ensure all fields are correctly filled out.');
      return;
    }

    const { courseName } = this.editCourseForm.value;
    try {
      await this.courseService.updateCourse(this.courseId, courseName);
      await this.editCourseModal.dismiss();
      await this.loadCourseData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.toastService.presentErrorToast(message || 'Failed to update course.');
    }
  }

  /**
   * Handles submitting the edit tee form.
   */
  async onEditTeeSubmit() {
    if (!this.editingTeeId) return;

    if (this.editTeeForm.invalid) {
      this.toastService.presentErrorToast('Please ensure all fields are correctly filled out.');
      return;
    }

    const { teeName, rating, slope, par } = this.editTeeForm.value;
    try {
      await this.courseService.updateTee(this.editingTeeId, teeName, Number(rating), Number(slope), Number(par));
      await this.editTeeModal.dismiss();
      this.editingTeeId = null;
      await this.loadCourseData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.toastService.presentErrorToast(message || 'Failed to update tee.');
    }
  }

  /**
   * Deletes a tee.
   *
   * @param teeId - The ID of the tee to delete.
   */
  async onDeleteTee(teeId: string) {
    try {
      await this.courseService.deleteTee(teeId);
      if (this.editTeeModal) {
        await this.editTeeModal.dismiss();
      }
      this.editingTeeId = null;
      await this.loadCourseData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('associated rounds')) {
        this.toastService.presentErrorToast('This tee has logged rounds and cannot be deleted.');
      } else {
        this.toastService.presentErrorToast(message || 'Failed to delete tee.');
      }
    }
  }

  /**
   * Deletes the current course.
   */
  async onDeleteCourse() {
    if (!this.courseId) return;

    try {
      await this.courseService.deleteCourse(this.courseId);
      if (this.editCourseModal) {
        await this.editCourseModal.dismiss();
      }
      this.router.navigate(['/courses']);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('associated rounds')) {
        this.toastService.presentErrorToast('This course has logged rounds and cannot be deleted.');
      } else {
        this.toastService.presentErrorToast(message || 'Failed to delete course.');
      }
    }
  }
}
