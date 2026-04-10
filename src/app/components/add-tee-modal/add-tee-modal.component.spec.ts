import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AddTeeModalComponent } from './add-tee-modal.component';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { BottomSheetService } from '../../services/bottom-sheet.service';

describe('AddTeeModalComponent', () => {
  let component: AddTeeModalComponent;
  let fixture: ComponentFixture<AddTeeModalComponent>;
  let courseServiceMock: {
    addTee: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: {
    presentErrorToast: ReturnType<typeof vi.fn>;
  };
  let bottomSheetServiceMock: {
    dismiss: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    courseServiceMock = {
      addTee: vi.fn(),
    };

    toastServiceMock = {
      presentErrorToast: vi.fn(),
    };

    bottomSheetServiceMock = {
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddTeeModalComponent],
      providers: [
        { provide: CourseService, useValue: courseServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: BottomSheetService, useValue: bottomSheetServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTeeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function fillFormAndSubmit() {
    const teeNameInput = fixture.debugElement.query(By.css('#teeName')).nativeElement;
    teeNameInput.value = 'Blue';
    teeNameInput.dispatchEvent(new Event('input'));

    const ratingInput = fixture.debugElement.query(By.css('#rating')).nativeElement;
    ratingInput.value = '71.2';
    ratingInput.dispatchEvent(new Event('input'));

    const slopeInput = fixture.debugElement.query(By.css('#slope')).nativeElement;
    slopeInput.value = '128';
    slopeInput.dispatchEvent(new Event('input'));

    const parInput = fixture.debugElement.query(By.css('#par')).nativeElement;
    parInput.value = '72';
    parInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));

    // Process promises scheduled in onSubmit
    await fixture.whenStable();
  }

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('requires a course selection before saving', async () => {
    component.courseId = null;

    await fillFormAndSubmit();

    expect(courseServiceMock.addTee).not.toHaveBeenCalled();
    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Select a course before adding a tee.');
  });

  it('creates a tee and calls dismiss on success', async () => {
    component.courseId = 'course-1';
    courseServiceMock.addTee.mockResolvedValue('tee-1');

    await fillFormAndSubmit();

    expect(courseServiceMock.addTee).toHaveBeenCalledWith({
      courseId: 'course-1',
      name: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });
    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({
      id: 'tee-1',
      courseId: 'course-1',
      name: 'Blue',
      rating: 71.2,
      slope: 128,
      par: 72,
    });
  });

  it('shows a validation error when the form is invalid', async () => {
    component.courseId = 'course-1';

    const form = fixture.debugElement.query(By.css('form')).nativeElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(courseServiceMock.addTee).not.toHaveBeenCalled();
    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith(
      'Please ensure all fields are correctly filled out.',
    );
  });

  it('surfaces service errors', async () => {
    component.courseId = 'course-1';
    courseServiceMock.addTee.mockRejectedValue(new Error('Duplicate tee.'));

    await fillFormAndSubmit();

    expect(toastServiceMock.presentErrorToast).toHaveBeenCalledWith('Duplicate tee.');
  });

  it('resets state on successful submission', async () => {
    component.courseId = 'course-1';
    courseServiceMock.addTee.mockResolvedValue('tee-1');

    await fillFormAndSubmit();

    fixture.detectChanges();

    const teeNameInput = fixture.debugElement.query(By.css('#teeName')).nativeElement;
    expect(teeNameInput.value).toBe('');
  });
});
