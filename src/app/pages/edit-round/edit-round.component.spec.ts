import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { EditRoundPage } from './edit-round.component';
import { CourseService } from '../../services/course.service';
import { HandicapStateService } from '../../services/handicap-state.service';
import { RoundService } from '../../services/round.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { NavigationHistoryService } from '../../services/navigation-history.service';
import { iconsProvider } from '../../icons.provider';

describe('EditRoundPage', () => {
  let courseServiceMock: {
    getCourses: ReturnType<typeof vi.fn>;
    getTees: ReturnType<typeof vi.fn>;
    getTeeById: ReturnType<typeof vi.fn>;
  };
  let roundServiceMock: {
    getRound: ReturnType<typeof vi.fn>;
    updateRound: ReturnType<typeof vi.fn>;
    deleteRound: ReturnType<typeof vi.fn>;
  };
  let handicapStateServiceMock: { refresh: ReturnType<typeof vi.fn> };
  let toastServiceMock: { presentErrorToast: ReturnType<typeof vi.fn> };
  let bottomSheetServiceMock: { open: ReturnType<typeof vi.fn> };
  let navigationHistoryServiceMock: { pop: ReturnType<typeof vi.fn> };
  let routeId: string | null;

  const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

  async function configure(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [EditRoundPage],
      providers: [
        provideRouter([]),
        ...iconsProvider,
        { provide: CourseService, useValue: courseServiceMock },
        { provide: RoundService, useValue: roundServiceMock },
        { provide: HandicapStateService, useValue: handicapStateServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: BottomSheetService, useValue: bottomSheetServiceMock },
        { provide: NavigationHistoryService, useValue: navigationHistoryServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(routeId === null ? {} : { id: routeId }) } },
        },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    routeId = 'r1';
    courseServiceMock = {
      getCourses: vi.fn().mockResolvedValue([
        { id: 'course-1', name: 'Augusta National Golf Club' },
        { id: 'course-2', name: 'Pebble Beach' },
      ]),
      getTees: vi.fn().mockResolvedValue([
        { id: 'tee-1', courseId: 'course-1', name: 'Yellow', rating: 71.8, slope: 125, par: 72 },
        { id: 'tee-2', courseId: 'course-1', name: 'White', rating: 70.2, slope: 121, par: 72 },
      ]),
      getTeeById: vi.fn().mockResolvedValue({
        id: 'tee-1',
        courseId: 'course-1',
        name: 'Yellow',
        rating: 71.8,
        slope: 125,
        par: 72,
      }),
    };

    roundServiceMock = {
      getRound: vi.fn().mockResolvedValue({
        id: 'r1',
        teeId: 'tee-1',
        date: '2026-03-21',
        grossScore: 84,
        differential: 9.8,
      }),
      updateRound: vi.fn().mockResolvedValue(undefined),
      deleteRound: vi.fn().mockResolvedValue(undefined),
    };

    handicapStateServiceMock = { refresh: vi.fn().mockResolvedValue(undefined) };
    toastServiceMock = { presentErrorToast: vi.fn() };
    bottomSheetServiceMock = { open: vi.fn() };
    navigationHistoryServiceMock = { pop: vi.fn().mockResolvedValue(true) };
  });

  it('loads the round from the URL id and prefills the form', async () => {
    await configure();
    const fixture = TestBed.createComponent(EditRoundPage);
    fixture.detectChanges();
    await flushPromises();

    expect(roundServiceMock.getRound).toHaveBeenCalledWith('r1');
    expect(courseServiceMock.getTeeById).toHaveBeenCalledWith('tee-1');
    expect(fixture.componentInstance.roundForm.getRawValue()).toMatchObject({
      courseId: 'course-1',
      teeId: 'tee-1',
      date: '2026-03-21',
      grossScore: '84',
    });
  });

  it('redirects to /rounds when the id param is missing', async () => {
    routeId = null;
    await configure();
    const fixture = TestBed.createComponent(EditRoundPage);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();
    await flushPromises();

    expect(roundServiceMock.getRound).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/rounds');
  });

  it('shows an error toast and redirects when the round does not exist', async () => {
    roundServiceMock.getRound.mockResolvedValue(undefined);
    await configure();
    const fixture = TestBed.createComponent(EditRoundPage);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();
    await flushPromises();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Round not found.');
    expect(navigateSpy).toHaveBeenCalledWith('/rounds');
  });

  it('saves the round and navigates back to /rounds on submit', async () => {
    await configure();
    const fixture = TestBed.createComponent(EditRoundPage);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();
    await flushPromises();

    fixture.componentInstance.roundForm.patchValue({ grossScore: '82' });
    await fixture.componentInstance.onSubmit();

    expect(roundServiceMock.updateRound).toHaveBeenCalledWith('r1', {
      teeId: 'tee-1',
      date: '2026-03-21',
      grossScore: 82,
    });
    expect(handicapStateServiceMock.refresh).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/rounds');
  });

  it('does not call updateRound when the form is invalid', async () => {
    await configure();
    const fixture = TestBed.createComponent(EditRoundPage);
    fixture.detectChanges();
    await flushPromises();

    fixture.componentInstance.roundForm.patchValue({ grossScore: '' });
    await fixture.componentInstance.onSubmit();

    expect(roundServiceMock.updateRound).not.toHaveBeenCalled();
  });

  it('toggles the delete confirmation flag via askDelete and cancelDelete', async () => {
    await configure();
    const fixture = TestBed.createComponent(EditRoundPage);
    fixture.detectChanges();
    await flushPromises();

    expect(fixture.componentInstance.showDeleteConfirmation).toBe(false);
    fixture.componentInstance.askDelete();
    expect(fixture.componentInstance.showDeleteConfirmation).toBe(true);
    fixture.componentInstance.cancelDelete();
    expect(fixture.componentInstance.showDeleteConfirmation).toBe(false);
  });

  it('deletes the round, refreshes state, and navigates back on confirmDelete', async () => {
    await configure();
    const fixture = TestBed.createComponent(EditRoundPage);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture.detectChanges();
    await flushPromises();

    await fixture.componentInstance.confirmDelete();

    expect(roundServiceMock.deleteRound).toHaveBeenCalledWith('r1');
    expect(handicapStateServiceMock.refresh).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/rounds');
    expect(fixture.componentInstance.showDeleteConfirmation).toBe(false);
  });

  it('surfaces an error toast if updateRound fails', async () => {
    roundServiceMock.updateRound.mockRejectedValue(new Error('Failed to update round.'));
    await configure();
    const fixture = TestBed.createComponent(EditRoundPage);
    fixture.detectChanges();
    await flushPromises();

    await fixture.componentInstance.onSubmit();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Failed to update round.');
    expect(handicapStateServiceMock.refresh).not.toHaveBeenCalled();
  });
});
