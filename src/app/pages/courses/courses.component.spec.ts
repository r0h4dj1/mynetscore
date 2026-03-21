import { TestBed } from '@angular/core/testing';
import { CoursesPage } from './courses.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { MockInstance } from 'vitest';

describe('CoursesPage', () => {
  let component: CoursesPage;
  let courseServiceMock: {
    getCoursesWithTeeCounts: MockInstance;
  };
  let toastServiceMock: {
    presentErrorToast: MockInstance;
  };

  beforeEach(async () => {
    courseServiceMock = {
      getCoursesWithTeeCounts: vi.fn().mockResolvedValue([]),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CoursesPage],
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

  it('reloads the list when the modal reports a saved course', async () => {
    const loadSpy = vi.spyOn(component, 'loadCourses').mockResolvedValue();

    await component.onCourseAdded();

    expect(loadSpy).toHaveBeenCalled();
  });
});
