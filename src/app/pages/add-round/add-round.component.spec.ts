import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AddRoundPage } from './add-round.component';
import { CourseService } from '../../services/course.service';
import { HandicapStateService } from '../../services/handicap-state.service';
import { RoundService } from '../../services/round.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { iconsProvider } from '../../icons.provider';

describe('AddRoundPage', () => {
  let component: AddRoundPage;
  let router: Router;
  let courseServiceMock: {
    getCourses: ReturnType<typeof vi.fn>;
    getTees: ReturnType<typeof vi.fn>;
  };
  let roundServiceMock: {
    findDuplicateRound: ReturnType<typeof vi.fn>;
    addRound: ReturnType<typeof vi.fn>;
  };
  let handicapStateServiceMock: {
    refresh: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: {
    presentErrorToast: ReturnType<typeof vi.fn>;
  };
  let bottomSheetServiceMock: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    courseServiceMock = {
      getCourses: vi.fn().mockResolvedValue([]),
      getTees: vi.fn().mockResolvedValue([]),
    };

    roundServiceMock = {
      findDuplicateRound: vi.fn().mockResolvedValue(undefined),
      addRound: vi.fn().mockResolvedValue('round-1'),
    };

    handicapStateServiceMock = {
      refresh: vi.fn().mockResolvedValue(undefined),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    bottomSheetServiceMock = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddRoundPage],
      providers: [
        provideRouter([]),
        ...iconsProvider,
        { provide: CourseService, useValue: courseServiceMock },
        { provide: RoundService, useValue: roundServiceMock },
        { provide: HandicapStateService, useValue: handicapStateServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: BottomSheetService, useValue: bottomSheetServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddRoundPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  const arrangePendingDuplicate = (): void => {
    component.courses = [{ id: 'course-1', name: 'Augusta National Golf Club' }];
    component.tees = [{ id: 'tee-1', courseId: 'course-1', name: 'Yellow', rating: 71.8, slope: 125, par: 72 }];
    component.roundForm.controls.teeId.enable();
    component.roundForm.setValue({
      courseId: 'course-1',
      teeId: 'tee-1',
      date: '2026-03-21',
      grossScore: '84',
    });
    roundServiceMock.findDuplicateRound.mockResolvedValue({
      id: 'round-existing',
      teeId: 'tee-1',
      date: '2026-03-21',
      grossScore: 84,
      differential: 9.8,
    });
  };

  it('loads and sorts courses alphabetically', async () => {
    courseServiceMock.getCourses.mockResolvedValue([
      { id: '2', name: 'Zebra Course' },
      { id: '1', name: 'Apple Course' },
      { id: '3', name: 'Banana Course' },
    ]);

    await component.loadCourses();

    expect(component.courses.map((course) => course.name)).toEqual(['Apple Course', 'Banana Course', 'Zebra Course']);
  });

  it('resets tee selection and loads tees when the course changes', async () => {
    component.roundForm.controls.teeId.enable();
    component.roundForm.patchValue({ teeId: 'old-tee' });
    courseServiceMock.getTees.mockResolvedValue([
      { id: 'tee-2', courseId: 'course-1', name: 'White', rating: 70.2, slope: 121, par: 72 },
      { id: 'tee-1', courseId: 'course-1', name: 'Blue', rating: 71.8, slope: 125, par: 72 },
    ]);

    await component.onCourseChanged('course-1');

    expect(courseServiceMock.getTees).toHaveBeenCalledWith('course-1');
    expect(component.roundForm.controls.teeId.enabled).toBe(true);
    expect(component.roundForm.controls.teeId.value).toBe('');
    expect(component.tees.map((tee) => tee.name)).toEqual(['Blue', 'White']);
  });

  it('auto-selects a newly created course and tee without clearing other fields', async () => {
    component.roundForm.patchValue({
      date: '2026-03-21',
      grossScore: '84',
    });

    component.onCourseCreated({
      course: { id: 'course-1', name: 'Augusta National Golf Club' },
      tee: { id: 'tee-1', courseId: 'course-1', name: 'Yellow', rating: 71.8, slope: 125, par: 72 },
    });

    expect(component.roundForm.getRawValue()).toMatchObject({
      courseId: 'course-1',
      teeId: 'tee-1',
      date: '2026-03-21',
      grossScore: '84',
    });
  });

  it('auto-selects a newly created tee without clearing other fields', () => {
    component.roundForm.controls.courseId.setValue('course-1');
    component.roundForm.controls.teeId.enable();
    component.roundForm.patchValue({
      date: '2026-03-21',
      grossScore: '84',
    });

    component.onTeeCreated({
      id: 'tee-2',
      courseId: 'course-1',
      name: 'White',
      rating: 70.1,
      slope: 121,
      par: 72,
    });

    expect(component.roundForm.getRawValue()).toMatchObject({
      courseId: 'course-1',
      teeId: 'tee-2',
      date: '2026-03-21',
      grossScore: '84',
    });
  });

  it('shows a duplicate confirmation instead of saving immediately', async () => {
    arrangePendingDuplicate();

    await component.onSubmit();

    expect(roundServiceMock.addRound).not.toHaveBeenCalled();
    expect(component.showDuplicateConfirmation).toBe(true);
    expect(component.duplicateSummary).toContain('Yellow tee');
  });

  it('cancels the duplicate confirmation without saving', async () => {
    arrangePendingDuplicate();

    await component.onSubmit();
    component.cancelDuplicateConfirmation();

    expect(component.showDuplicateConfirmation).toBe(false);
    expect(roundServiceMock.addRound).not.toHaveBeenCalled();
  });

  it('saves, refreshes handicap state, and navigates after confirmation', async () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.onCourseCreated({
      course: { id: 'course-1', name: 'Augusta National Golf Club' },
      tee: { id: 'tee-1', courseId: 'course-1', name: 'Yellow', rating: 71.8, slope: 125, par: 72 },
    });
    component.roundForm.patchValue({
      date: '2026-03-21',
      grossScore: '84',
    });
    roundServiceMock.findDuplicateRound.mockResolvedValue({
      id: 'round-existing',
      teeId: 'tee-1',
      date: '2026-03-21',
      grossScore: 84,
      differential: 9.8,
    });

    await component.onSubmit();
    await component.confirmDuplicateSave();

    expect(roundServiceMock.addRound).toHaveBeenCalledWith({
      teeId: 'tee-1',
      date: '2026-03-21',
      grossScore: 84,
    });
    expect(handicapStateServiceMock.refresh).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/rounds');
  });

  it('surfaces save errors from the round service', async () => {
    component.onCourseCreated({
      course: { id: 'course-1', name: 'Augusta National Golf Club' },
      tee: { id: 'tee-1', courseId: 'course-1', name: 'Yellow', rating: 71.8, slope: 125, par: 72 },
    });
    component.roundForm.patchValue({
      date: '2026-03-21',
      grossScore: '84',
    });
    roundServiceMock.addRound.mockRejectedValue(new Error('Failed to save round.'));

    await component.onSubmit(true);

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Failed to save round.');
    expect(handicapStateServiceMock.refresh).not.toHaveBeenCalled();
  });
});
