import { TestBed } from '@angular/core/testing';
import { CourseDetailPage } from './course-detail.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonModal } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { MockInstance } from 'vitest';

describe('CourseDetailPage', () => {
  let component: CourseDetailPage;
  let courseServiceMock: {
    getCourse: MockInstance;
    getTees: MockInstance;
    addTee: MockInstance;
    updateCourse: MockInstance;
    updateTee: MockInstance;
    deleteTee: MockInstance;
    deleteCourse: MockInstance;
  };
  let toastServiceMock: {
    presentErrorToast: MockInstance;
  };
  let routerMock: {
    navigate: MockInstance;
  };

  beforeEach(async () => {
    courseServiceMock = {
      getCourse: vi.fn().mockResolvedValue({ id: '1', name: 'Test Course' }),
      getTees: vi.fn().mockResolvedValue([]),
      addTee: vi.fn(),
      updateCourse: vi.fn(),
      updateTee: vi.fn(),
      deleteTee: vi.fn(),
      deleteCourse: vi.fn(),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CourseDetailPage, ReactiveFormsModule],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(new Map([['id', '1']])) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CourseDetailPage);
    component = fixture.componentInstance;
    component.courseId = '1';

    // Mock the ChangeDetectorRef to avoid issues when calling markForCheck
    Object.defineProperty(component, 'cdr', {
      value: { markForCheck: vi.fn() },
      writable: true,
    });

    component.editCourseModal = { dismiss: vi.fn(), present: vi.fn() } as unknown as IonModal;
    component.editTeeModal = { dismiss: vi.fn(), present: vi.fn() } as unknown as IonModal;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should verify the inline tee form validates inputs correctly - invalid form', async () => {
    await component.onAddTeeSubmit();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'Please ensure all fields are correctly filled out.',
    );
    expect(courseServiceMock.addTee).not.toHaveBeenCalled();
  });

  it('should verify the inline tee form validates inputs correctly - valid form', async () => {
    component.teeForm.setValue({
      teeName: 'Valid Tee',
      rating: 72,
      slope: 120,
      par: 72,
    });

    courseServiceMock.addTee.mockResolvedValue(undefined);

    await component.onAddTeeSubmit();

    expect(courseServiceMock.addTee).toHaveBeenCalledWith({
      courseId: '1',
      name: 'Valid Tee',
      rating: 72,
      slope: 120,
      par: 72,
    });
    expect(component.teeForm.value).toEqual({
      teeName: null,
      rating: null,
      slope: null,
      par: null,
    });
  });

  it('should verify that deleteCourse errors surface a toast message', async () => {
    courseServiceMock.deleteCourse.mockRejectedValue(new Error('This course has associated rounds.'));

    await component.onDeleteCourse();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'This course has logged rounds and cannot be deleted.',
    );
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to courses page on successful course deletion', async () => {
    courseServiceMock.deleteCourse.mockResolvedValue(undefined);

    await component.onDeleteCourse();

    expect(component.editCourseModal.dismiss).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/courses']);
  });

  it('should submit edit course form when valid', async () => {
    component.editCourseForm.setValue({ courseName: 'Updated Course Name' });
    courseServiceMock.updateCourse.mockResolvedValue(undefined);

    await component.onEditCourseSubmit();

    expect(courseServiceMock.updateCourse).toHaveBeenCalledWith('1', 'Updated Course Name');
    expect(component.editCourseModal.dismiss).toHaveBeenCalled();
  });

  it('should show validation toast when edit course form is invalid', async () => {
    component.editCourseForm.setValue({ courseName: '' });

    await component.onEditCourseSubmit();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'Please ensure all fields are correctly filled out.',
    );
    expect(courseServiceMock.updateCourse).not.toHaveBeenCalled();
  });

  it('should submit edit tee form when valid', async () => {
    component.editingTeeId = 'tee-1';
    component.editTeeForm.setValue({
      teeName: 'Updated Tee',
      rating: 71.2,
      slope: 128,
      par: 72,
    });
    courseServiceMock.updateTee.mockResolvedValue(undefined);

    await component.onEditTeeSubmit();

    expect(courseServiceMock.updateTee).toHaveBeenCalledWith('tee-1', 'Updated Tee', 71.2, 128, 72);
    expect(component.editTeeModal.dismiss).toHaveBeenCalled();
    expect(component.editingTeeId).toBeNull();
  });

  it('should show validation toast when edit tee form is invalid', async () => {
    component.editingTeeId = 'tee-1';
    component.editTeeForm.setValue({
      teeName: '',
      rating: '',
      slope: '',
      par: '',
    });

    await component.onEditTeeSubmit();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'Please ensure all fields are correctly filled out.',
    );
    expect(courseServiceMock.updateTee).not.toHaveBeenCalled();
  });

  it('should dismiss edit tee modal after successful tee deletion', async () => {
    courseServiceMock.deleteTee.mockResolvedValue(undefined);

    await component.onDeleteTee('tee-1');

    expect(component.editTeeModal.dismiss).toHaveBeenCalled();
  });
});
