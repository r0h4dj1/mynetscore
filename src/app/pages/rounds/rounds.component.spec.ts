import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { ionAdd, ionChevronBack } from '@ng-icons/ionicons';
import { signal } from '@angular/core';
import { RoundsPage } from './rounds.component';
import { HandicapStateService } from '../../services/handicap-state.service';
import { RoundHistoryService, RoundRowDisplay } from '../../services/round-history.service';

function buildRow(overrides: Partial<RoundRowDisplay> = {}): RoundRowDisplay {
  return {
    id: overrides.id ?? 'r-default',
    teeId: 't1',
    date: '2026-03-01',
    grossScore: 85,
    differential: 12.3,
    courseName: 'Course',
    teeName: 'Blue',
    ...overrides,
  };
}

describe('RoundsPage', () => {
  let fixture: ComponentFixture<RoundsPage>;

  const mockUsedRoundIds = signal<string[]>([]);
  const refreshMock = vi.fn(() => Promise.resolve());
  const listAllMock = vi.fn<() => Promise<RoundRowDisplay[]>>();

  beforeEach(async () => {
    mockUsedRoundIds.set([]);
    refreshMock.mockClear();
    listAllMock.mockReset();
    listAllMock.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [RoundsPage],
      providers: [
        provideRouter([]),
        provideIcons({ ionAdd, ionChevronBack }),
        {
          provide: HandicapStateService,
          useValue: {
            usedRoundIds: mockUsedRoundIds,
            refresh: refreshMock,
          },
        },
        {
          provide: RoundHistoryService,
          useValue: {
            listAll: listAllMock,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoundsPage);
  });

  async function initPage(): Promise<void> {
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
  }

  it('renders the empty state and hides the segmented control when no rounds exist', async () => {
    await initPage();

    expect(refreshMock).toHaveBeenCalled();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No rounds recorded');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-segmented-control')).toBeNull();
  });

  it('renders one row per round with the correct course, score, and differential', async () => {
    listAllMock.mockResolvedValue([
      buildRow({ id: 'r1', courseName: 'Royal County Down Golf Club', grossScore: 89, differential: 9.2 }),
      buildRow({ id: 'r2', courseName: 'Augusta National Golf Club', grossScore: 76, differential: -0.6 }),
    ]);
    await initPage();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('main a');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Royal County Down Golf Club');
    expect(rows[0].textContent).toContain('89');
    expect(rows[0].textContent).toContain('9.2');
  });

  it('filters to counting rounds when the active tab changes to counting', async () => {
    listAllMock.mockResolvedValue([buildRow({ id: 'r1' }), buildRow({ id: 'r2' }), buildRow({ id: 'r3' })]);
    mockUsedRoundIds.set(['r1', 'r3']);
    await initPage();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('main a').length).toBe(3);

    fixture.componentInstance.onTabChange('counting');
    fixture.detectChanges();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('main a');
    expect(rows.length).toBe(2);
  });

  it('applies the legacy class to rows beyond index 20 in the all-rounds tab', async () => {
    const rows = Array.from({ length: 22 }, (_, i) => buildRow({ id: `r${i}` }));
    listAllMock.mockResolvedValue(rows);
    await initPage();

    const anchors = (fixture.nativeElement as HTMLElement).querySelectorAll('main a');
    expect(anchors.length).toBe(22);
    expect(anchors[19].classList.contains('bg-graphite')).toBe(false);
    expect(anchors[20].classList.contains('bg-graphite')).toBe(true);
    expect(anchors[21].classList.contains('bg-graphite')).toBe(true);
  });

  it('renders each row as a link to the edit page', async () => {
    listAllMock.mockResolvedValue([buildRow({ id: 'r1' }), buildRow({ id: 'r2' })]);
    await initPage();

    const anchors = (fixture.nativeElement as HTMLElement).querySelectorAll('main a');
    const hrefs = Array.from(anchors).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/rounds/r1/edit', '/rounds/r2/edit']);
  });

  it('applies the counting gradient and ring classes to rounds in the counting set', async () => {
    listAllMock.mockResolvedValue([buildRow({ id: 'r1' }), buildRow({ id: 'r2' })]);
    mockUsedRoundIds.set(['r1']);
    await initPage();

    const anchors = (fixture.nativeElement as HTMLElement).querySelectorAll('main a');
    expect(anchors[0].classList.contains('from-dark-spruce/80')).toBe(true);
    expect(anchors[0].classList.contains('ring-1')).toBe(true);
    expect(anchors[0].classList.contains('ring-inset')).toBe(true);

    expect(anchors[1].classList.contains('from-dark-spruce/80')).toBe(false);
    expect(anchors[1].classList.contains('ring-1')).toBe(false);
  });
});
