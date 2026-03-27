import { TestBed } from '@angular/core/testing';
import { CourseDetailPage } from './course-detail.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
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

    bottomSheetServiceMock = {
      open: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CourseDetailPage, ReactiveFormsModule],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: BottomSheetService, useValue: bottomSheetServiceMock },
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
    component.course = { id: '1', name: 'Test Course' };

    Object.defineProperty(component, 'cdr', {
      value: { markForCheck: vi.fn() },
      writable: true,
    });
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

  it('should open edit course modal via BottomSheetService', async () => {
    bottomSheetServiceMock.open.mockResolvedValue({ action: 'save', payload: { name: 'Updated Course' } });
    courseServiceMock.updateCourse.mockResolvedValue(undefined);
    courseServiceMock.getCourse.mockResolvedValue({ id: '1', name: 'Updated Course' });
    courseServiceMock.getTees.mockResolvedValue([]);

    await component.openEditCourseModal();

    expect(bottomSheetServiceMock.open).toHaveBeenCalled();
    expect(courseServiceMock.updateCourse).toHaveBeenCalledWith('1', 'Updated Course');
  });

  it('should delete course when edit modal returns delete action', async () => {
    bottomSheetServiceMock.open.mockResolvedValue({ action: 'delete' });
    courseServiceMock.deleteCourse.mockResolvedValue(undefined);

    await component.openEditCourseModal();

    expect(courseServiceMock.deleteCourse).toHaveBeenCalledWith('1');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/courses']);
  });

  it('should show toast when deleting course with associated rounds', async () => {
    bottomSheetServiceMock.open.mockResolvedValue({ action: 'delete' });
    courseServiceMock.deleteCourse.mockRejectedValue(new Error('associated rounds'));

    await component.openEditCourseModal();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'This course has logged rounds and cannot be deleted.',
    );
  });

  it('should open edit tee modal via BottomSheetService', async () => {
    const mockTee = { id: 'tee-1', courseId: '1', name: 'Blue', rating: 73, slope: 130, par: 72 };
    bottomSheetServiceMock.open.mockResolvedValue({
      action: 'save',
      payload: { name: 'Updated Tee', rating: 72, slope: 125, par: 71 },
    });
    courseServiceMock.updateTee.mockResolvedValue(undefined);
    courseServiceMock.getTees.mockResolvedValue([]);

    await component.openEditTeeModal(mockTee);

    expect(bottomSheetServiceMock.open).toHaveBeenCalled();
    expect(courseServiceMock.updateTee).toHaveBeenCalledWith('tee-1', 'Updated Tee', 72, 125, 71);
  });

  it('should delete tee when edit modal returns delete action', async () => {
    const mockTee = { id: 'tee-1', courseId: '1', name: 'Blue', rating: 73, slope: 130, par: 72 };
    bottomSheetServiceMock.open.mockResolvedValue({ action: 'delete' });
    courseServiceMock.deleteTee.mockResolvedValue(undefined);
    courseServiceMock.getTees.mockResolvedValue([]);

    await component.openEditTeeModal(mockTee);

    expect(courseServiceMock.deleteTee).toHaveBeenCalledWith('tee-1');
  });

  it('should show toast when deleting tee with associated rounds', async () => {
    const mockTee = { id: 'tee-1', courseId: '1', name: 'Blue', rating: 73, slope: 130, par: 72 };
    bottomSheetServiceMock.open.mockResolvedValue({ action: 'delete' });
    courseServiceMock.deleteTee.mockRejectedValue(new Error('associated rounds'));

    await component.openEditTeeModal(mockTee);

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'This tee has logged rounds and cannot be deleted.',
    );
  });
});
