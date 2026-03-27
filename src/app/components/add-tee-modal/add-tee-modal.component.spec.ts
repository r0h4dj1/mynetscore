import { TestBed } from '@angular/core/testing';
import { AddTeeModalComponent } from './add-tee-modal.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';

describe('AddTeeModalComponent', () => {
  let component: AddTeeModalComponent;
  let courseServiceMock: {
    addTee: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: {
    presentErrorToast: ReturnType<typeof vi.fn>;
  };
  let bottomSheetServiceMock: {
    dismiss: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    courseServiceMock = {
      addTee: vi.fn(),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    bottomSheetServiceMock = {
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddTeeModalComponent],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: BottomSheetService, useValue: bottomSheetServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddTeeModalComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('requires a course selection before saving', async () => {
    component.courseId = null;
    component.teeForm.setValue({
      teeName: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });

    await component.onSubmit();

    expect(courseServiceMock.addTee).not.toHaveBeenCalled();
    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Select a course before adding a tee.');
  });

  it('creates a tee and calls dismiss on success', async () => {
    component.courseId = 'course-1';
    component.teeForm.setValue({
      teeName: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });
    courseServiceMock.addTee.mockResolvedValue('tee-1');

    await component.onSubmit();

    expect(courseServiceMock.addTee).toHaveBeenCalledWith({
      courseId: 'course-1',
      name: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });
    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({
      id: 'tee-1',
      courseId: 'course-1',
      name: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });
  });

  it('shows a validation error when the form is invalid', async () => {
    component.courseId = 'course-1';

    await component.onSubmit();

    expect(courseServiceMock.addTee).not.toHaveBeenCalled();
    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'Please ensure all fields are correctly filled out.',
    );
  });

  it('surfaces service errors', async () => {
    component.courseId = 'course-1';
    component.teeForm.setValue({
      teeName: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });
    courseServiceMock.addTee.mockRejectedValue(new Error('Duplicate tee.'));

    await component.onSubmit();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Duplicate tee.');
  });

  it('resets state on successful submission', async () => {
    component.courseId = 'course-1';
    component.teeForm.setValue({
      teeName: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });

    courseServiceMock.addTee.mockResolvedValue('tee-1');

    await component.onSubmit();

    expect(component.teeSubmitCount).toBe(0);
    expect(component.teeForm.get('teeName')?.value).toBe('');
  });
});
