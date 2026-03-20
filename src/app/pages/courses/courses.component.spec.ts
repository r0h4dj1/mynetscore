import { TestBed } from '@angular/core/testing';
import { CoursesPage } from './courses.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MockInstance } from 'vitest';
import { IonModal } from '@ionic/angular/standalone';

describe('CoursesPage', () => {
  let component: CoursesPage;
  let courseServiceMock: {
    getCoursesWithTeeCounts: MockInstance;
    addCourse: MockInstance;
    addTee: MockInstance;
  };
  let toastServiceMock: {
    presentErrorToast: MockInstance;
  };

  beforeEach(async () => {
    courseServiceMock = {
      getCoursesWithTeeCounts: vi.fn().mockResolvedValue([]),
      addCourse: vi.fn(),
      addTee: vi.fn(),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CoursesPage, ReactiveFormsModule],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CoursesPage);
    component = fixture.componentInstance;

    // Mock the ChangeDetectorRef to avoid issues when calling markForCheck
    Object.defineProperty(component, 'cdr', {
      value: { markForCheck: vi.fn() },
      writable: true,
    });
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should verify the list is sorted alphabetically', async () => {
    courseServiceMock.getCoursesWithTeeCounts.mockResolvedValue([
      { id: '2', name: 'Zebra Course', teeCount: 1 },
      { id: '1', name: 'Apple Course', teeCount: 2 },
      { id: '3', name: 'Banana Course', teeCount: 3 },
    ]);

    await component.loadCourses();

    expect(component.courses.length).toBe(3);
    expect(component.courses[0].name).toBe('Apple Course');
    expect(component.courses[1].name).toBe('Banana Course');
    expect(component.courses[2].name).toBe('Zebra Course');
  });

  it('should verify the bottom sheet toggles correctly on successful add', async () => {
    component.courseForm.setValue({
      courseName: 'Test Course',
      teeName: 'Test Tee',
      rating: 72,
      slope: 113,
      par: 72,
    });

    courseServiceMock.addCourse.mockResolvedValue('test-course-id');
    courseServiceMock.addTee.mockResolvedValue('test-tee-id');

    const dismissMock = vi.fn();
    component.modal = { dismiss: dismissMock } as unknown as IonModal;

    await component.onAddCourseSubmit();

    expect(courseServiceMock.addCourse).toHaveBeenCalledWith('Test Course');
    expect(courseServiceMock.addTee).toHaveBeenCalledWith({
      courseId: 'test-course-id',
      name: 'Test Tee',
      rating: 72,
      slope: 113,
      par: 72,
    });
    expect(dismissMock).toHaveBeenCalled();
    expect(component.courseForm.value).toEqual({
      courseName: null,
      teeName: null,
      rating: null,
      slope: null,
      par: null,
    });
  });

  it('should increment addCourseSubmitCount when form is submitted', async () => {
    expect(component.addCourseSubmitCount).toBe(0);

    await component.onAddCourseSubmit();

    expect(component.addCourseSubmitCount).toBe(1);
    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'Please ensure all fields are correctly filled out.',
    );
  });

  it('should reset addCourseSubmitCount when modal is dismissed', () => {
    component.addCourseSubmitCount = 5;
    component.onAddCourseModalDismiss();
    expect(component.addCourseSubmitCount).toBe(0);
  });

  it('should reset addCourseSubmitCount and form on successful submission', async () => {
    component.courseForm.setValue({
      courseName: 'Test Course',
      teeName: 'Test Tee',
      rating: 72,
      slope: 113,
      par: 72,
    });
    component.addCourseSubmitCount = 1;

    courseServiceMock.addCourse.mockResolvedValue('test-course-id');
    courseServiceMock.addTee.mockResolvedValue('test-tee-id');
    const dismissMock = vi.fn();
    component.modal = { dismiss: dismissMock } as unknown as IonModal;

    await component.onAddCourseSubmit();

    expect(component.addCourseSubmitCount).toBe(0);
    expect(courseServiceMock.addCourse).toHaveBeenCalledWith('Test Course');
    expect(dismissMock).toHaveBeenCalled();
  });
});
