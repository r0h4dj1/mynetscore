import { TestBed } from '@angular/core/testing';
import { IonModal } from '@ionic/angular/standalone';
import { AddTeeModalComponent } from './add-tee-modal.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';

describe('AddTeeModalComponent', () => {
  let component: AddTeeModalComponent;
  let courseServiceMock: {
    addTee: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: {
    presentErrorToast: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    courseServiceMock = {
      addTee: vi.fn(),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddTeeModalComponent],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddTeeModalComponent);
    component = fixture.componentInstance;
    component.modal = { dismiss: vi.fn(), present: vi.fn() } as unknown as IonModal;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('requires a course selection before saving', async () => {
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

  it('creates a tee and emits it on success', async () => {
    component.courseId = 'course-1';
    component.teeForm.setValue({
      teeName: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });
    courseServiceMock.addTee.mockResolvedValue('tee-1');

    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    await component.onSubmit();

    expect(courseServiceMock.addTee).toHaveBeenCalledWith({
      courseId: 'course-1',
      name: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });
    expect(savedSpy).toHaveBeenCalledWith({
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

  it('resets state on dismiss', () => {
    component.teeSubmitCount = 2;
    component.teeForm.patchValue({ teeName: 'Blue' });

    component.onDidDismiss();

    expect(component.teeSubmitCount).toBe(0);
    expect(component.teeForm.get('teeName')?.value).toBeNull();
  });
});
