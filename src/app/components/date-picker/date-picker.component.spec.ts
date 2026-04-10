import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePickerComponent } from './date-picker.component';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { vi } from 'vitest';

describe('DatePickerComponent', () => {
  let component: DatePickerComponent;
  let fixture: ComponentFixture<DatePickerComponent>;
  let bottomSheetServiceMock: { dismiss: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    bottomSheetServiceMock = { dismiss: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DatePickerComponent],
      providers: [{ provide: BottomSheetService, useValue: bottomSheetServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
  });

  it('should output the current date by default when confirmed', () => {
    fixture.detectChanges();
    component.confirm();

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({ date: `${y}-${m}-${d}` });
  });

  it('should initialize with the provided initialDate and output it when confirmed', () => {
    fixture.componentRef.setInput('initialDate', '2023-05-15');
    fixture.detectChanges();

    component.confirm();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({ date: '2023-05-15' });
  });

  it('should correctly output the selected date when wheels are changed', () => {
    fixture.detectChanges();

    component.onYearChange(2020);
    component.onMonthChange(10); // Nov (0-indexed)
    component.onDayChange(5);

    component.confirm();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({ date: '2020-11-05' });
  });

  it('should clamp selected day correctly on leap year change', () => {
    fixture.detectChanges();

    component.onYearChange(2024);
    component.onMonthChange(0); // Jan
    component.onDayChange(31);

    component.onMonthChange(1); // Feb
    component.confirm();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({ date: '2024-02-29' });
  });

  it('should clamp selected day correctly on non-leap year change', () => {
    fixture.detectChanges();

    component.onYearChange(2025);
    component.onMonthChange(0); // Jan
    component.onDayChange(31);

    component.onMonthChange(1); // Feb
    component.confirm();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({ date: '2025-02-28' });
  });

  it('should not allow future years beyond the current year', () => {
    fixture.detectChanges();
    const today = new Date();
    const years = component.years();
    expect(years.at(-1)?.value).toBe(today.getFullYear());
  });
});
