import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward, add } from 'ionicons/icons';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
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
  imports: [RouterModule, IonIcon, AddCourseModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesPage {
  private readonly courseService = inject(CourseService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);

  courses: CourseWithTeeCount[] = [];

  constructor() {
    addIcons({
      chevronForward,
      add,
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
   * Refreshes the course list after a course is added via the reusable modal.
   */
  async onCourseAdded(): Promise<void> {
    await this.loadCourses();
  }
}
