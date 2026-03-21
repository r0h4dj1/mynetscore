import { TestBed } from '@angular/core/testing';
import { IonModal } from '@ionic/angular/standalone';
import { AddCourseModalComponent } from './add-course-modal.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';

describe('AddCourseModalComponent', () => {
  let component: AddCourseModalComponent;
  let courseServiceMock: {
    addCourse: ReturnType<typeof vi.fn>;
    addTee: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: {
    presentErrorToast: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    courseServiceMock = {
      addCourse: vi.fn(),
      addTee: vi.fn(),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddCourseModalComponent],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddCourseModalComponent);
    component = fixture.componentInstance;
    component.modal = { dismiss: vi.fn(), present: vi.fn() } as unknown as IonModal;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('creates a course and tee and emits the saved payload', async () => {
    component.courseForm.setValue({
      courseName: 'Royal County Down',
      teeName: 'Blue',
      rating: 73.4,
      slope: 134,
      par: 72,
    });

    courseServiceMock.addCourse.mockResolvedValue('course-1');
    courseServiceMock.addTee.mockResolvedValue('tee-1');

    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    await component.onSubmit();

    expect(courseServiceMock.addCourse).toHaveBeenCalledWith('Royal County Down');
    expect(courseServiceMock.addTee).toHaveBeenCalledWith({
      courseId: 'course-1',
      name: 'Blue',
      rating: 73.4,
      slope: 134,
      par: 72,
    });
    expect(savedSpy).toHaveBeenCalledWith({
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
  });

  it('shows a validation error when the form is invalid', async () => {
    await component.onSubmit();

    expect(component.addCourseSubmitCount).toBe(1);
    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'Please ensure all fields are correctly filled out.',
    );
  });

  it('resets state on dismiss', () => {
    component.addCourseSubmitCount = 2;
    component.courseForm.patchValue({ courseName: 'Test Course' });

    component.onDidDismiss();

    expect(component.addCourseSubmitCount).toBe(0);
    expect(component.courseForm.get('courseName')?.value).toBeNull();
  });

  it('surfaces service errors', async () => {
    component.courseForm.setValue({
      courseName: 'Royal County Down',
      teeName: 'Blue',
      rating: 73.4,
      slope: 134,
      par: 72,
    });
    courseServiceMock.addCourse.mockRejectedValue(new Error('Duplicate course.'));

    await component.onSubmit();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Duplicate course.');
  });
});
