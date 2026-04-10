import { TestBed } from '@angular/core/testing';
import { AddCourseModalComponent } from './add-course-modal.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';

describe('AddCourseModalComponent', () => {
  let component: AddCourseModalComponent;
  let courseServiceMock: {
    addCourseWithTee: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: {
    presentErrorToast: ReturnType<typeof vi.fn>;
  };
  let bottomSheetServiceMock: {
    dismiss: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    courseServiceMock = {
      addCourseWithTee: vi.fn(),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    bottomSheetServiceMock = {
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddCourseModalComponent],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: BottomSheetService, useValue: bottomSheetServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddCourseModalComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  describe('onSubmit', () => {
    it('creates a course and tee and calls dismiss with result when form is valid', async () => {
      component.courseForm.setValue({
        courseName: 'Royal County Down',
        teeName: 'Blue',
        rating: 73.4,
        slope: 134,
        par: 72,
      });

      const mockCourse = { id: 'course-1', name: 'Royal County Down' };
      const mockTee = {
        id: 'tee-1',
        courseId: 'course-1',
        name: 'Blue',
        rating: 73.4,
        slope: 134,
        par: 72,
      };

      courseServiceMock.addCourseWithTee.mockResolvedValue({ course: mockCourse, tee: mockTee });

      await component.onSubmit();

      expect(courseServiceMock.addCourseWithTee).toHaveBeenCalledWith('Royal County Down', {
        name: 'Blue',
        rating: 73.4,
        slope: 134,
        par: 72,
      });
      expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({
        course: mockCourse,
        tee: mockTee,
      });
    });

    it('shows a validation error when the form is invalid', async () => {
      // Form starts empty and invalid
      await component.onSubmit();

      expect(component.addCourseSubmitCount).toBe(1);
      expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
        'Please ensure all fields are correctly filled out.',
      );
      expect(courseServiceMock.addCourseWithTee).not.toHaveBeenCalled();
    });

    it('resets state on successful submission', async () => {
      component.courseForm.setValue({
        courseName: 'Royal County Down',
        teeName: 'Blue',
        rating: 73.4,
        slope: 134,
        par: 72,
      });

      courseServiceMock.addCourseWithTee.mockResolvedValue({
        course: { id: 'course-1', name: 'Royal County Down' },
        tee: {
          id: 'tee-1',
          courseId: 'course-1',
          name: 'Blue',
          rating: 73.4,
          slope: 134,
          par: 72,
        },
      });

      await component.onSubmit();

      expect(component.addCourseSubmitCount).toBe(0);
      expect(component.courseForm.get('courseName')?.value).toBe('');
      expect(component.courseForm.get('teeName')?.value).toBe('');
    });

    it('surfaces Error instance messages from the service', async () => {
      component.courseForm.setValue({
        courseName: 'Royal County Down',
        teeName: 'Blue',
        rating: 73.4,
        slope: 134,
        par: 72,
      });

      courseServiceMock.addCourseWithTee.mockRejectedValue(new Error('Duplicate course.'));

      await component.onSubmit();

      expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Duplicate course.');
    });

    it('surfaces a generic error message for non-Error throws', async () => {
      component.courseForm.setValue({
        courseName: 'Royal County Down',
        teeName: 'Blue',
        rating: 73.4,
        slope: 134,
        par: 72,
      });

      courseServiceMock.addCourseWithTee.mockRejectedValue('Some string error');

      await component.onSubmit();

      expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Failed to add course and tee.');
    });
  });

  describe('form validation', () => {
    it('invalidates form if rating is less than 0.1', () => {
      component.courseForm.patchValue({
        courseName: 'Valid',
        teeName: 'Valid',
        rating: 0,
        slope: 113,
        par: 72,
      });
      expect(component.courseForm.invalid).toBe(true);
    });

    it('invalidates form if slope is less than the minimum', () => {
      component.courseForm.patchValue({
        courseName: 'Valid',
        teeName: 'Valid',
        rating: 72,
        slope: 1,
        par: 72,
      });
      expect(component.courseForm.invalid).toBe(true);
    });

    it('invalidates form if par is less than 1', () => {
      component.courseForm.patchValue({
        courseName: 'Valid',
        teeName: 'Valid',
        rating: 72,
        slope: 113,
        par: 0,
      });
      expect(component.courseForm.invalid).toBe(true);
    });
  });
});
