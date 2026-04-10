import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Course } from '../../database/db';
import { BottomSheetService } from '../../services/bottom-sheet.service';

export interface EditCourseModalResult {
  action: 'save' | 'delete';
  payload?: {
    name: string;
  };
}

/** Modal component for editing or deleting a course. */
@Component({
  selector: 'app-edit-course-modal',
  templateUrl: './edit-course-modal.component.html',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditCourseModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bottomSheetService = inject(BottomSheetService);

  /** The course to edit. */
  @Input() course!: Course;

  readonly editCourseForm: FormGroup = this.fb.group({
    courseName: ['', Validators.required],
  });

  editCourseSubmitCount = 0;

  /** Initializes the form with course data. */
  ngOnInit() {
    if (this.course) {
      this.editCourseForm.patchValue({
        courseName: this.course.name,
      });
    }
  }

  /** Submits the edited course name. */
  async onSubmit() {
    this.editCourseSubmitCount++;

    if (this.editCourseForm.invalid) {
      return;
    }

    const { courseName } = this.editCourseForm.getRawValue();
    this.bottomSheetService.dismiss({
      action: 'save',
      payload: { name: courseName },
    } as EditCourseModalResult);
  }

  /** Deletes the course. */
  onDelete() {
    this.bottomSheetService.dismiss({ action: 'delete' } as EditCourseModalResult);
  }
}
