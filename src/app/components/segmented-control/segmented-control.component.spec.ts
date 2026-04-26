import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SegmentedControlComponent, SegmentedControlOption } from './segmented-control.component';

describe('SegmentedControlComponent', () => {
  let component: SegmentedControlComponent;
  let fixture: ComponentFixture<SegmentedControlComponent>;

  const options: SegmentedControlOption[] = [
    { value: 'all', label: 'All rounds' },
    { value: 'counting', label: 'Counting' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentedControlComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentedControlComponent);
    component = fixture.componentInstance;
    component.options = options;
    component.selected = 'all';
  });

  it('renders one button per option with the correct label', () => {
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button[role="tab"]');

    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('All rounds');
    expect(buttons[1].textContent?.trim()).toBe('Counting');
  });

  it('marks the selected option with aria-selected="true" and renders the underline only on it', () => {
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button[role="tab"]');

    expect(buttons[0].getAttribute('aria-selected')).toBe('true');
    expect(buttons[1].getAttribute('aria-selected')).toBe('false');

    expect(buttons[0].querySelector('span[aria-hidden="true"]')).not.toBeNull();
    expect(buttons[1].querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('emits selectedChange with the option value when a tab is clicked', () => {
    fixture.detectChanges();
    const spy = vi.spyOn(component.selectedChange, 'emit');

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button[role="tab"]');
    (buttons[1] as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalledWith('counting');
  });

  it('applies the aria-label to the tablist when provided', () => {
    component.ariaLabel = 'Filter rounds';
    fixture.detectChanges();

    const tablist = (fixture.nativeElement as HTMLElement).querySelector('[role="tablist"]');
    expect(tablist?.getAttribute('aria-label')).toBe('Filter rounds');
  });

  it('omits the aria-label attribute when ariaLabel is empty', () => {
    fixture.detectChanges();

    const tablist = (fixture.nativeElement as HTMLElement).querySelector('[role="tablist"]');
    expect(tablist?.hasAttribute('aria-label')).toBe(false);
  });
});
