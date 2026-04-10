import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WheelColumnComponent, WheelItem } from './wheel-column.component';

describe('WheelColumnComponent', () => {
  let component: WheelColumnComponent;
  let fixture: ComponentFixture<WheelColumnComponent>;

  const mockItems: WheelItem[] = [
    { label: 'Item 1', value: 1 },
    { label: 'Item 2', value: 2 },
    { label: 'Item 3', value: 3 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WheelColumnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WheelColumnComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('items', mockItems);
    fixture.componentRef.setInput('selectedValue', 2);
  });

  it('should render items based on input', () => {
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const itemDivs = element.querySelectorAll('div.snap-center');
    expect(itemDivs.length).toBe(3);
    expect(itemDivs[0].textContent?.trim()).toBe('Item 1');
    expect(itemDivs[1].textContent?.trim()).toBe('Item 2');
    expect(itemDivs[2].textContent?.trim()).toBe('Item 3');
  });

  it('should not emit valueChange if scrolled to the currently selected value', () => {
    fixture.detectChanges();
    const spy = vi.spyOn(component.valueChange, 'emit');
    if (component.scrollContainer?.nativeElement) {
      component.scrollContainer.nativeElement.scrollTop = 48;
    }

    component['isProgrammaticScroll'] = false;

    component.onScrollEnd();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit valueChange when scrolled to a new value', () => {
    fixture.detectChanges();
    const spy = vi.spyOn(component.valueChange, 'emit');
    if (component.scrollContainer?.nativeElement) {
      component.scrollContainer.nativeElement.scrollTop = 96;
    }

    component['isProgrammaticScroll'] = false;

    component.onScrollEnd();

    expect(spy).toHaveBeenCalledWith(3);
  });

  it('should ignore scroll events marked as programmatic', () => {
    fixture.detectChanges();
    const spy = vi.spyOn(component.valueChange, 'emit');

    if (component.scrollContainer?.nativeElement) {
      component.scrollContainer.nativeElement.scrollTop = 96;
    }
    component['isProgrammaticScroll'] = true;

    component.onScrollEnd();

    expect(component['isProgrammaticScroll']).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should scroll to the selected value when selectedValue changes programmatically', async () => {
    fixture.detectChanges();

    const scrollToMock = vi.fn();
    if (component.scrollContainer?.nativeElement) {
      component.scrollContainer.nativeElement.scrollTo = scrollToMock;
      // Set current scrollTop so the difference is > 1
      component.scrollContainer.nativeElement.scrollTop = 0;
    }

    // Change the selected value to 3 (index 2)
    fixture.componentRef.setInput('selectedValue', 3);
    fixture.detectChanges();

    // Wait for effect's setTimeout (allow time for setTimeout to run)
    await new Promise((resolve) => setTimeout(resolve, 20));

    // targetScrollTop should be index 2 * 48 = 96
    expect(scrollToMock).toHaveBeenCalledWith({ top: 96, behavior: 'instant' });

    // The programmatic scroll flag should be cleared after 50ms from the scrollTo execution
    expect(component['isProgrammaticScroll']).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(component['isProgrammaticScroll']).toBe(false);
  });

  it('should handle missing scroll container gracefully on scroll end', () => {
    fixture.detectChanges();
    const spy = vi.spyOn(component.valueChange, 'emit');

    const originalContainer = component.scrollContainer;
    // @ts-expect-error simulating missing viewchild
    component.scrollContainer = undefined;

    component.onScrollEnd();

    expect(spy).not.toHaveBeenCalled();

    component.scrollContainer = originalContainer;
  });
});
