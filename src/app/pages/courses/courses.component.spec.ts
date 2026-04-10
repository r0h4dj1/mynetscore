import { TestBed } from '@angular/core/testing';
import { CoursesPage } from './courses.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { ActivatedRoute } from '@angular/router';
import { AddCourseModalComponent } from '../../components/add-course-modal/add-course-modal.component';
import { MockInstance } from 'vitest';

describe('CoursesPage', () => {
  let component: CoursesPage;
  let courseServiceMock: {
    getCoursesWithTeeCounts: MockInstance;
  };
  let toastServiceMock: {
    presentErrorToast: MockInstance;
  };
  let bottomSheetServiceMock: {
    open: MockInstance;
  };

  beforeEach(async () => {
    courseServiceMock = {
      getCoursesWithTeeCounts: vi.fn().mockResolvedValue([]),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    bottomSheetServiceMock = {
      open: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [CoursesPage],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: BottomSheetService, useValue: bottomSheetServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CoursesPage);
    component = fixture.componentInstance;
  });

  it('loads and sorts courses alphabetically when the view enters', async () => {
    courseServiceMock.getCoursesWithTeeCounts.mockResolvedValue([
      { id: '2', name: 'Zebra Course', teeCount: 1 },
      { id: '1', name: 'Apple Course', teeCount: 2 },
      { id: '3', name: 'Banana Course', teeCount: 3 },
    ]);

    await component.loadCourses();

    expect(component.courses).toEqual([
      { id: '1', name: 'Apple Course', teeCount: 2 },
      { id: '3', name: 'Banana Course', teeCount: 3 },
      { id: '2', name: 'Zebra Course', teeCount: 1 },
    ]);
  });

  it('shows an error toast if loading courses fails', async () => {
    courseServiceMock.getCoursesWithTeeCounts.mockRejectedValue(new Error('Database error'));

    await component.loadCourses();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Failed to load courses.');
    expect(component.courses).toEqual([]);
  });

  it('opens the add course modal and refreshes the course list when closed', async () => {
    courseServiceMock.getCoursesWithTeeCounts.mockResolvedValue([{ id: '1', name: 'New Course', teeCount: 0 }]);

    await component.openAddCourseModal();

    expect(bottomSheetServiceMock.open).toHaveBeenCalledWith(AddCourseModalComponent);
    expect(courseServiceMock.getCoursesWithTeeCounts).toHaveBeenCalled();
    expect(component.courses).toEqual([{ id: '1', name: 'New Course', teeCount: 0 }]);
  });
});
