import { TestBed } from '@angular/core/testing';
import { CourseDetailPage } from './course-detail.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi, MockInstance } from 'vitest';

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
  let bottomSheetServiceMock: {
    open: MockInstance;
  };
  let routerMock: {
    navigate: MockInstance;
  };
  let paramMapSubject: Subject<Map<string, string>>;

  const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(async () => {
    courseServiceMock = {
      getCourse: vi.fn().mockResolvedValue({ id: '1', name: 'Test Course' }),
      getTees: vi.fn().mockResolvedValue([{ id: 't1', name: 'White', rating: 70, slope: 115, par: 72 }]),
      addTee: vi.fn(),
      updateCourse: vi.fn(),
      updateTee: vi.fn(),
      deleteTee: vi.fn(),
      deleteCourse: vi.fn(),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    bottomSheetServiceMock = {
      open: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    paramMapSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [CourseDetailPage, ReactiveFormsModule],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: BottomSheetService, useValue: bottomSheetServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CourseDetailPage);
    component = fixture.componentInstance;

    Object.defineProperty(component, 'cdr', {
      value: { markForCheck: vi.fn() },
      writable: true,
    });
  });

  describe('ngOnInit', () => {
    it('should load course and tees on init based on route param', async () => {
      component.ngOnInit();
      paramMapSubject.next(new Map([['id', '1']]));
      await flushPromises();

      expect(courseServiceMock.getCourse).toHaveBeenCalledWith('1');
      expect(courseServiceMock.getTees).toHaveBeenCalledWith('1');
      expect(component.course).toEqual({ id: '1', name: 'Test Course' });
      expect(component.tees).toEqual([{ id: 't1', name: 'White', rating: 70, slope: 115, par: 72 }]);
    });

    it('should navigate back to courses if course is not found', async () => {
      courseServiceMock.getCourse.mockResolvedValue(null);

      component.ngOnInit();
      paramMapSubject.next(new Map([['id', '1']]));
      await flushPromises();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/courses']);
    });

    it('should show an error toast if loading fails', async () => {
      courseServiceMock.getCourse.mockRejectedValue(new Error('DB Error'));

      component.ngOnInit();
      paramMapSubject.next(new Map([['id', '1']]));
      await flushPromises();

      expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Failed to load course data.');
    });
  });

  describe('onAddTeeSubmit', () => {
    beforeEach(() => {
      component.courseId = '1';
    });

    it('should add a tee and reload data when the form is valid', async () => {
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
      expect(courseServiceMock.getCourse).toHaveBeenCalledWith('1');
    });

    it('should show an error toast when submitting an invalid form', async () => {
      await component.onAddTeeSubmit();

      expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
        'Please ensure all fields are correctly filled out.',
      );
      expect(courseServiceMock.addTee).not.toHaveBeenCalled();
    });
  });

  describe('openEditCourseModal', () => {
    beforeEach(() => {
      component.courseId = '1';
      component.course = { id: '1', name: 'Test Course' };
    });

    it('should update the course and reload data when the edit modal returns a save action', async () => {
      bottomSheetServiceMock.open.mockResolvedValue({ action: 'save', payload: { name: 'Updated Course' } });
      courseServiceMock.updateCourse.mockResolvedValue(undefined);

      await component.openEditCourseModal();

      expect(bottomSheetServiceMock.open).toHaveBeenCalled();
      expect(courseServiceMock.updateCourse).toHaveBeenCalledWith('1', 'Updated Course');
      expect(courseServiceMock.getCourse).toHaveBeenCalledWith('1');
    });

    it('should delete the course and navigate away when the modal returns a delete action', async () => {
      bottomSheetServiceMock.open.mockResolvedValue({ action: 'delete' });
      courseServiceMock.deleteCourse.mockResolvedValue(undefined);

      await component.openEditCourseModal();

      expect(courseServiceMock.deleteCourse).toHaveBeenCalledWith('1');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/courses']);
    });

    it('should show an error toast when deleting a course with associated rounds fails', async () => {
      bottomSheetServiceMock.open.mockResolvedValue({ action: 'delete' });
      courseServiceMock.deleteCourse.mockRejectedValue(new Error('associated rounds'));

      await component.openEditCourseModal();

      expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
        'This course has logged rounds and cannot be deleted.',
      );
    });
  });

  describe('openEditTeeModal', () => {
    const mockTee = { id: 'tee-1', courseId: '1', name: 'Blue', rating: 73, slope: 130, par: 72 };

    beforeEach(() => {
      component.courseId = '1';
    });

    it('should update the tee and reload data when the edit modal returns a save action', async () => {
      bottomSheetServiceMock.open.mockResolvedValue({
        action: 'save',
        payload: { name: 'Updated Tee', rating: 72, slope: 125, par: 71 },
      });
      courseServiceMock.updateTee.mockResolvedValue(undefined);

      await component.openEditTeeModal(mockTee);

      expect(bottomSheetServiceMock.open).toHaveBeenCalled();
      expect(courseServiceMock.updateTee).toHaveBeenCalledWith('tee-1', 'Updated Tee', 72, 125, 71);
      expect(courseServiceMock.getCourse).toHaveBeenCalledWith('1');
    });

    it('should delete the tee and reload data when the modal returns a delete action', async () => {
      bottomSheetServiceMock.open.mockResolvedValue({ action: 'delete' });
      courseServiceMock.deleteTee.mockResolvedValue(undefined);

      await component.openEditTeeModal(mockTee);

      expect(courseServiceMock.deleteTee).toHaveBeenCalledWith('tee-1');
      expect(courseServiceMock.getCourse).toHaveBeenCalledWith('1');
    });

    it('should show an error toast when deleting a tee with associated rounds fails', async () => {
      bottomSheetServiceMock.open.mockResolvedValue({ action: 'delete' });
      courseServiceMock.deleteTee.mockRejectedValue(new Error('associated rounds'));

      await component.openEditTeeModal(mockTee);

      expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
        'This tee has logged rounds and cannot be deleted.',
      );
    });
  });
});
