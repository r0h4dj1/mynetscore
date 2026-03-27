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
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('patches form with course name on ngOnInit', () => {
    component.ngOnInit();

    expect(component.editCourseForm.get('courseName')?.value).toBe('Royal County Down');
  });

  it('calls dismiss with save action and payload on submit', async () => {
    component.course = mockCourse;
    component.editCourseForm.setValue({ courseName: 'Updated Course Name' });

    await component.onSubmit();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({
      action: 'save',
      payload: { name: 'Updated Course Name' },
    });
  });

  it('calls dismiss with delete action on delete click', () => {
    component.onDelete();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({ action: 'delete' });
  });
});
