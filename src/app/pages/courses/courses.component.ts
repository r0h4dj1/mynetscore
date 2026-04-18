import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
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
  host: { class: 'block h-full' },
  templateUrl: './courses.component.html',
  standalone: true,
  imports: [RouterModule, NgIcon, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesPage implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);
  private readonly bottomSheetService = inject(BottomSheetService);

  courses: CourseWithTeeCount[] = [];

  /**
   * Initializes the component.
   */
  ngOnInit() {
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
