import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home.component';
import { HandicapStateService, RecentRoundDisplay } from '../../services/handicap-state.service';
import { provideIcons } from '@ng-icons/core';
import { ionArrowForward, ionCaretDown, ionCaretUp, ionCaretForward, ionAdd } from '@ng-icons/ionicons';
import { signal } from '@angular/core';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;

  const mockHandicapIndex = signal<number | null>(null);
  const mockTotalRoundsInWindow = signal<number>(0);
  const mockTotalRounds = signal<number>(0);
  const mockTotalCoursesPlayed = signal<number>(0);
  const mockTrend = signal<'improving' | 'worsening' | 'stable' | 'none'>('none');
  const mockRecentRounds = signal<RecentRoundDisplay[]>([]);
  const mockUsedRoundIds = signal<string[]>([]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        provideIcons({ ionArrowForward, ionCaretDown, ionCaretUp, ionCaretForward, ionAdd }),
        {
          provide: HandicapStateService,
          useValue: {
            handicapIndex: mockHandicapIndex,
            totalRoundsInWindow: mockTotalRoundsInWindow,
            totalRounds: mockTotalRounds,
            totalCoursesPlayed: mockTotalCoursesPlayed,
            trend: mockTrend,
            recentRounds: mockRecentRounds,
            usedRoundIds: mockUsedRoundIds,
            refresh: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
  });

  it('should render empty state when no rounds exist', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('—');
    expect(textContent).toContain('No rounds recorded');
  });

  it('should display provisional status and values when rounds < 20', () => {
    mockHandicapIndex.set(12.4);
    mockTotalRoundsInWindow.set(5);
    mockTotalRounds.set(5);
    mockTotalCoursesPlayed.set(2);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('12.4');
    expect(textContent).toContain('(provisional)');
    expect(fixture.nativeElement.querySelector('.grid').textContent).toContain('5');
    expect(fixture.nativeElement.querySelector('.grid').textContent).toContain('2');
  });

  it('should display index without provisional and appropriate trend color when >= 20 rounds', () => {
    mockHandicapIndex.set(10.1);
    mockTotalRoundsInWindow.set(20);
    mockTotalRounds.set(24);
    mockTrend.set('improving');
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('10.1');
    expect(textContent).not.toContain('(provisional)');

    const trendEl = fixture.nativeElement.querySelector('.text-success-light');
    expect(trendEl).toBeTruthy();
    expect(trendEl.textContent).toContain('Improving');
  });

  it('should correctly render worsening and stable trends', () => {
    mockTrend.set('worsening');
    fixture.detectChanges();
    let trendEl = fixture.nativeElement.querySelector('.text-error-light');
    expect(trendEl).toBeTruthy();
    expect(trendEl.textContent).toContain('Worsening');

    mockTrend.set('stable');
    fixture.detectChanges();
    trendEl = fixture.nativeElement.querySelector('.text-frosted-blue');
    expect(trendEl).toBeTruthy();
    expect(trendEl.textContent).toContain('Stable');
  });

  it('should render the correct number of placeholder rows as rounds are added', () => {
    const mockRound: RecentRoundDisplay = {
      id: 'r1',
      teeId: 't1',
      date: '2026-04-18',
      grossScore: 80,
      differential: 10,
      courseName: 'Test Course',
    };

    mockRecentRounds.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('div[aria-hidden="true"]').length).toBe(3);

    mockRecentRounds.set([mockRound]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('div[aria-hidden="true"]').length).toBe(2);

    mockRecentRounds.set([mockRound, { ...mockRound, id: 'r2' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('div[aria-hidden="true"]').length).toBe(1);

    mockRecentRounds.set([mockRound, { ...mockRound, id: 'r2' }, { ...mockRound, id: 'r3' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('div[aria-hidden="true"]').length).toBe(0);
  });

  it('should mark counting rounds with a green dot by ID, correctly handling duplicate differentials', () => {
    mockRecentRounds.set([
      { id: 'r1', teeId: 't1', date: '2026-04-01', grossScore: 80, differential: 10.5, courseName: 'Course A' },
      { id: 'r2', teeId: 't1', date: '2026-03-30', grossScore: 80, differential: 10.5, courseName: 'Course B' },
    ]);
    mockUsedRoundIds.set(['r1']);
    fixture.detectChanges();

    const dots = fixture.nativeElement.querySelectorAll('.rounded-full');
    expect(dots[0].classList.contains('bg-success')).toBe(true);
    expect(dots[1].classList.contains('bg-success')).toBe(false);
    expect(dots[1].classList.contains('bg-transparent')).toBe(true);
  });
});
