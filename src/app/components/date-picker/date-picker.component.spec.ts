import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerComponent } from './date-picker.component';
import { BottomSheetService } from '../../services/bottom-sheet.service';

class MockBottomSheetService {
  dismiss(): void {
    // Mocked for testing purposes.
  }
}

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;
  let bottomSheetServiceMock: MockBottomSheetService;

  beforeEach(async () => {
    bottomSheetServiceMock = new MockBottomSheetService();

    await TestBed.configureTestingModule({
      imports: [DatePickerComponent],
      providers: [{ provide: BottomSheetService, useValue: bottomSheetServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not allow future years beyond the current year', () => {
    const today = new Date();
    const years = component.years();
    expect(years.at(-1)?.value).toBe(today.getFullYear());
  });

  it('should clamp selected day correctly on leap year change', () => {
    component.onYearChange(2024);
    component.onMonthChange(0);
    fixture.detectChanges();

    component.onDayChange(31);
    fixture.detectChanges();

    expect(component.selectedDay()).toBe(31);

    component.onMonthChange(1);
    fixture.detectChanges();

    expect(component.selectedDay()).toBe(29);
  });

  it('should clamp selected day correctly on non-leap year change', () => {
    component.onYearChange(2025);
    component.onMonthChange(0);
    fixture.detectChanges();

    component.onDayChange(31);
    fixture.detectChanges();

    expect(component.selectedDay()).toBe(31);

    component.onMonthChange(1);
    fixture.detectChanges();

    expect(component.selectedDay()).toBe(28);
  });
});
