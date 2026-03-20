import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonModal, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward, add } from 'ionicons/icons';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { Course } from '../../database/db';
import { ValidationStatusDirective } from '../../directives/validation-status.directive';
import { WHS_LIMITS } from '../../constants/whs.constants';

/**
 * Interface for a course with its associated tee count.
 */
interface CourseWithTeeCount extends Course {
  teeCount: number;
}

/**
 * Component representing the courses page.
 */
@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, IonModal, IonIcon, ValidationStatusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesPage {
  private readonly courseService = inject(CourseService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);

  @ViewChild(IonModal) modal!: IonModal;

  courses: CourseWithTeeCount[] = [];
  courseForm: FormGroup;
  addCourseSubmitCount = 0;

  constructor() {
    addIcons({
      chevronForward,
      add,
    });

    this.courseForm = this.fb.group({
      courseName: ['', Validators.required],
      teeName: ['', Validators.required],
      rating: ['', [Validators.required, Validators.min(0.1)]],
      slope: ['', [Validators.required, Validators.min(WHS_LIMITS.MIN_SLOPE), Validators.max(WHS_LIMITS.MAX_SLOPE)]],
      par: ['', [Validators.required, Validators.min(1)]],
    });
  }

  /**
   * Ionic lifecycle hook — fires every time the view becomes active.
   */
  ionViewWillEnter() {
    this.loadCourses();
  }

  /**
   * Loads courses and their tee counts.
   */
  async loadCourses() {
    try {
      const coursesWithTeeCount = await this.courseService.getCoursesWithTeeCounts();
      coursesWithTeeCount.sort((a, b) => a.name.localeCompare(b.name));
      this.courses = coursesWithTeeCount;
    } catch {
      this.toastService.presentErrorToast('Failed to load courses.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles submitting the add course form.
   */
  async onAddCourseSubmit() {
    this.addCourseSubmitCount++;

    if (this.courseForm.invalid) {
      this.toastService.presentErrorToast('Please ensure all fields are correctly filled out.');
      return;
    }

    const { courseName, teeName, rating, slope, par } = this.courseForm.value;

    try {
      const courseId = await this.courseService.addCourse(courseName);

      await this.courseService.addTee({
        courseId,
        name: teeName,
        rating: Number(rating),
        slope: Number(slope),
        par: Number(par),
      });

      this.addCourseSubmitCount = 0;
      this.courseForm.reset();
      await this.modal.dismiss();

      await this.loadCourses();
    } catch (error: unknown) {
      const err = error as Error;
      this.toastService.presentErrorToast(err.message || 'Failed to add course and tee.');
    }
  }

  /**
   * Handles dismissing the add course modal.
   */
  onAddCourseModalDismiss() {
    this.addCourseSubmitCount = 0;
  }
}
