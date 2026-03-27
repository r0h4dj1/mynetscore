import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { BottomSheetModalComponent } from './bottom-sheet-modal.component';
import { BottomSheetService } from '../../services/bottom-sheet.service';

@Component({ standalone: true, template: '<p data-testid="inner">Hello from sheet</p>' })
class DummyContentComponent {}

describe('BottomSheetModalComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<BottomSheetModalComponent>>;
  let bottomSheetService: BottomSheetService;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [BottomSheetModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomSheetModalComponent);
    bottomSheetService = TestBed.inject(BottomSheetService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render nothing when closed', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="backdrop"]')).toBeNull();
    expect(el.querySelector('[data-testid="sheet"]')).toBeNull();
  });

  it('should render backdrop and sheet when service opens', () => {
    fixture.detectChanges();

    const promise = bottomSheetService.open(DummyContentComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="backdrop"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="sheet"]')).toBeTruthy();

    bottomSheetService.dismiss();
    vi.advanceTimersByTime(350);
    fixture.detectChanges();

    void promise;
  });

  it('should render the provided component inside the sheet', () => {
    fixture.detectChanges();

    const promise = bottomSheetService.open(DummyContentComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="inner"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="inner"]')?.textContent).toContain('Hello from sheet');

    bottomSheetService.dismiss();
    vi.advanceTimersByTime(350);
    fixture.detectChanges();

    void promise;
  });

  it('should add translate-y-0 class after open animation frame', () => {
    fixture.detectChanges();

    const promise = bottomSheetService.open(DummyContentComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    fixture.detectChanges();

    const sheet = fixture.nativeElement.querySelector('[data-testid="sheet"]') as HTMLElement;
    expect(sheet.classList.contains('translate-y-0')).toBe(true);

    bottomSheetService.dismiss();
    vi.advanceTimersByTime(350);
    fixture.detectChanges();

    void promise;
  });

  it('should dismiss when drag exceeds 150px threshold', () => {
    fixture.detectChanges();

    const promise = bottomSheetService.open(DummyContentComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    fixture.detectChanges();

    const sheet = fixture.nativeElement.querySelector('[data-testid="sheet"]') as HTMLElement;
    sheet.setPointerCapture = vi.fn();

    const pointerId = 1;
    sheet.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientY: 100,
        pointerId,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    sheet.dispatchEvent(
      new PointerEvent('pointermove', {
        clientY: 300,
        pointerId,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    sheet.dispatchEvent(
      new PointerEvent('pointerup', {
        pointerId,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    vi.advanceTimersByTime(250);
    fixture.detectChanges();

    expect(bottomSheetService.state().isOpen).toBe(false);

    vi.advanceTimersByTime(350);
    fixture.detectChanges();

    void promise;
  });

  it('should snap back when drag is below threshold', () => {
    fixture.detectChanges();

    const promise = bottomSheetService.open(DummyContentComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    fixture.detectChanges();

    const sheet = fixture.nativeElement.querySelector('[data-testid="sheet"]') as HTMLElement;
    sheet.setPointerCapture = vi.fn();

    const pointerId = 1;
    sheet.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientY: 100,
        pointerId,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    sheet.dispatchEvent(
      new PointerEvent('pointermove', {
        clientY: 180,
        pointerId,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    sheet.dispatchEvent(
      new PointerEvent('pointerup', {
        pointerId,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    vi.advanceTimersByTime(250);
    fixture.detectChanges();

    expect(bottomSheetService.state().isOpen).toBe(true);

    bottomSheetService.dismiss();
    vi.advanceTimersByTime(350);
    fixture.detectChanges();

    void promise;
  });
});
