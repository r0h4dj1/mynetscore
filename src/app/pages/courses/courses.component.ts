import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { Course } from '../../database/db';
import { AddCourseModalComponent } from '../../components/add-course-modal/add-course-modal.component';

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
  imports: [RouterModule, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesPage {
  private readonly courseService = inject(CourseService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);
  private readonly bottomSheetService = inject(BottomSheetService);

  courses: CourseWithTeeCount[] = [];

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

  /** Opens the add course modal and reloads courses. */
  async openAddCourseModal() {
    await this.bottomSheetService.open(AddCourseModalComponent);
    await this.loadCourses();
  }
}
