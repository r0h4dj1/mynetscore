import { TestBed } from '@angular/core/testing';
import { EditTeeModalComponent } from './edit-tee-modal.component';
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { Tee } from '../../database/db';

describe('EditTeeModalComponent', () => {
  let component: EditTeeModalComponent;
  let bottomSheetServiceMock: {
    dismiss: ReturnType<typeof vi.fn>;
  };

  const mockTee: Tee = {
    id: 'tee-1',
    courseId: 'course-1',
    name: 'Blue',
    rating: 73.4,
    slope: 134,
    par: 72,
  };

  beforeEach(async () => {
    bottomSheetServiceMock = {
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EditTeeModalComponent],
      providers: [{ provide: BottomSheetService, useValue: bottomSheetServiceMock }],
    }).compileComponents();

    const fixture = TestBed.createComponent(EditTeeModalComponent);
    component = fixture.componentInstance;
    component.tee = mockTee;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('patches form with tee values on ngOnInit', () => {
    component.ngOnInit();

    expect(component.editTeeForm.get('teeName')?.value).toBe('Blue');
    expect(component.editTeeForm.get('rating')?.value).toBe(73.4);
    expect(component.editTeeForm.get('slope')?.value).toBe(134);
    expect(component.editTeeForm.get('par')?.value).toBe(72);
  });

  it('calls dismiss with save action and payload on submit', async () => {
    component.tee = mockTee;
    component.editTeeForm.setValue({
      teeName: 'White',
      rating: 70.5,
      slope: 125,
      par: 71,
    });

    await component.onSubmit();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({
      action: 'save',
      payload: {
        name: 'White',
        rating: 70.5,
        slope: 125,
        par: 71,
      },
    });
  });

  it('calls dismiss with delete action on delete click', () => {
    component.onDelete();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({ action: 'delete' });
  });
});
