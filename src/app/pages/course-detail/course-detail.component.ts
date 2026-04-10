import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { Course, Tee } from '../../database/db';
import { ValidationStatusDirective } from '../../directives/validation-status.directive';
import { WHS_LIMITS } from '../../constants/whs.constants';
import {
  EditCourseModalComponent,
  EditCourseModalResult,
} from '../../components/edit-course-modal/edit-course-modal.component';
import { EditTeeModalComponent, EditTeeModalResult } from '../../components/edit-tee-modal/edit-tee-modal.component';

/**
 * Component representing the course detail page.
 */
@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, NgIcon, ValidationStatusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);
  private readonly bottomSheetService = inject(BottomSheetService);

  courseId: string | null = null;
  course: Course | undefined;
  tees: Tee[] = [];

  teeForm: FormGroup;
  teeSubmitCount = 0;

  constructor() {
    this.teeForm = this.fb.group({
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
   * Opens the edit course modal.
   */
  async openEditCourseModal() {
    if (!this.course) return;

    const result = (await this.bottomSheetService.open(EditCourseModalComponent, {
      course: this.course,
    })) as EditCourseModalResult | undefined;

    if (!result) return;

    if (result.action === 'save' && result.payload) {
      await this.handleCourseSave(result.payload.name);
    } else if (result.action === 'delete') {
      await this.handleCourseDelete();
    }
  }

  private async handleCourseSave(name: string) {
    try {
      await this.courseService.updateCourse(this.courseId!, name);
      await this.loadCourseData();
    } catch (error: unknown) {
      this.toastService.presentErrorToast(this.getErrorMessage(error, 'Failed to update course.'));
    }
  }

  private async handleCourseDelete() {
    try {
      await this.courseService.deleteCourse(this.courseId!);
      this.router.navigate(['/courses']);
    } catch (error: unknown) {
      this.toastService.presentErrorToast(
        this.getDeleteErrorMessage(
          error,
          'Failed to delete course.',
          'This course has logged rounds and cannot be deleted.',
        ),
      );
    }
  }

  /**
   * Opens the edit tee modal for the given tee.
   *
   * @param tee - The tee to edit.
   */
  async openEditTeeModal(tee: Tee) {
    const result = (await this.bottomSheetService.open(EditTeeModalComponent, {
      tee: tee,
    })) as EditTeeModalResult | undefined;

    if (!result) return;

    if (result.action === 'save' && result.payload) {
      await this.handleTeeSave(tee.id, result.payload);
    } else if (result.action === 'delete') {
      await this.handleTeeDelete(tee.id);
    }
  }

  private async handleTeeSave(teeId: string, payload: { name: string; rating: number; slope: number; par: number }) {
    try {
      await this.courseService.updateTee(teeId, payload.name, payload.rating, payload.slope, payload.par);
      await this.loadCourseData();
    } catch (error: unknown) {
      this.toastService.presentErrorToast(this.getErrorMessage(error, 'Failed to update tee.'));
    }
  }

  private async handleTeeDelete(teeId: string) {
    try {
      await this.courseService.deleteTee(teeId);
      await this.loadCourseData();
    } catch (error: unknown) {
      this.toastService.presentErrorToast(
        this.getDeleteErrorMessage(error, 'Failed to delete tee.', 'This tee has logged rounds and cannot be deleted.'),
      );
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const message = error instanceof Error ? error.message : String(error);
    return message || fallback;
  }

  private getDeleteErrorMessage(error: unknown, fallback: string, roundsMessage: string): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('associated rounds') ? roundsMessage : message || fallback;
  }
}
