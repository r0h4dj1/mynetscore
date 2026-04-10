import { TestBed } from '@angular/core/testing';
import { EditCourseModalComponent } from './edit-course-modal.component';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { Course } from '../../database/db';

describe('EditCourseModalComponent', () => {
  let component: EditCourseModalComponent;
  let bottomSheetServiceMock: {
    dismiss: ReturnType<typeof vi.fn>;
  };

  const mockCourse: Course = {
    id: 'course-1',
    name: 'Royal County Down',
  };

  beforeEach(async () => {
    bottomSheetServiceMock = {
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EditCourseModalComponent],
      providers: [{ provide: BottomSheetService, useValue: bottomSheetServiceMock }],
    }).compileComponents();

    const fixture = TestBed.createComponent(EditCourseModalComponent);
    component = fixture.componentInstance;
    component.course = mockCourse;
    component.ngOnInit();
  });

  it('submits a save action with the updated course name', async () => {
    component.editCourseForm.patchValue({ courseName: 'Updated Course Name' });

    await component.onSubmit();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({
      action: 'save',
      payload: { name: 'Updated Course Name' },
    });
  });

  it('does not submit a save action if the form is invalid', async () => {
    component.editCourseForm.patchValue({ courseName: '' });

    await component.onSubmit();

    expect(bottomSheetServiceMock.dismiss).not.toHaveBeenCalled();
  });

  it('submits a delete action', () => {
    component.onDelete();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({ action: 'delete' });
  });
});
