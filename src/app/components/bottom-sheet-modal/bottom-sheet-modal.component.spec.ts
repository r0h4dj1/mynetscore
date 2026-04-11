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

  it('should not render anything initially', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="backdrop"]')).toBeNull();
    expect(el.querySelector('[data-testid="sheet"]')).toBeNull();
  });

  it('should render the provided component when opened via service', () => {
    fixture.detectChanges();

    const promise = bottomSheetService.open(DummyContentComponent);
    fixture.detectChanges();

    // Advance timers to allow rendering cycles to complete
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="backdrop"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="inner"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="inner"]')?.textContent).toContain('Hello from sheet');

    bottomSheetService.dismiss();
    vi.advanceTimersByTime(350);
    void promise;
  });

  it('should dismiss the sheet when backdrop is clicked', () => {
    fixture.detectChanges();

    const promise = bottomSheetService.open(DummyContentComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('[data-testid="backdrop"]') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();

    expect(bottomSheetService.state().isOpen).toBe(false);

    vi.advanceTimersByTime(350);
    void promise;
  });

  it('should apply a 80px dismiss threshold for short sheets (<360px)', () => {
    fixture.detectChanges();

    const promise = bottomSheetService.open(DummyContentComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    fixture.detectChanges();

    const sheetEl = fixture.nativeElement.querySelector('[data-testid="sheet"]') as HTMLElement;
    vi.spyOn(sheetEl, 'getBoundingClientRect').mockReturnValue({ height: 200 } as DOMRect);

    const handle = sheetEl.querySelector('.cursor-grab') as HTMLElement;
    handle.setPointerCapture = vi.fn();

    // Snap back test (79px drag)
    handle.dispatchEvent(new PointerEvent('pointerdown', { clientY: 100, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointermove', { clientY: 179, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
    fixture.detectChanges();

    vi.advanceTimersByTime(250);
    fixture.detectChanges();

    expect(bottomSheetService.state().isOpen).toBe(true);

    // Dismiss test (81px drag)
    handle.dispatchEvent(new PointerEvent('pointerdown', { clientY: 100, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointermove', { clientY: 181, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
    fixture.detectChanges();

    vi.advanceTimersByTime(250);
    fixture.detectChanges();

    expect(bottomSheetService.state().isOpen).toBe(false);

    vi.advanceTimersByTime(350);
    void promise;
  });

  it('should apply a 120px dismiss threshold for tall sheets (>=360px)', () => {
    fixture.detectChanges();

    const promise = bottomSheetService.open(DummyContentComponent);
    fixture.detectChanges();
    vi.advanceTimersByTime(16);
    vi.advanceTimersByTime(16);
    fixture.detectChanges();

    const sheetEl = fixture.nativeElement.querySelector('[data-testid="sheet"]') as HTMLElement;
    vi.spyOn(sheetEl, 'getBoundingClientRect').mockReturnValue({ height: 400 } as DOMRect);

    const handle = sheetEl.querySelector('.cursor-grab') as HTMLElement;
    handle.setPointerCapture = vi.fn();

    // Snap back test (119px drag)
    handle.dispatchEvent(new PointerEvent('pointerdown', { clientY: 100, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointermove', { clientY: 219, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
    fixture.detectChanges();

    vi.advanceTimersByTime(250);
    fixture.detectChanges();

    expect(bottomSheetService.state().isOpen).toBe(true);

    // Dismiss test (121px drag)
    handle.dispatchEvent(new PointerEvent('pointerdown', { clientY: 100, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointermove', { clientY: 221, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
    fixture.detectChanges();

    vi.advanceTimersByTime(250);
    fixture.detectChanges();

    expect(bottomSheetService.state().isOpen).toBe(false);

    vi.advanceTimersByTime(350);
    void promise;
  });
});
