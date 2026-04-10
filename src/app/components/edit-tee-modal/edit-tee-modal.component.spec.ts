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
    component.ngOnInit();
  });

  it('submits a save action with the updated tee values', async () => {
    component.editTeeForm.patchValue({
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

  it('does not submit a save action if the form is invalid', async () => {
    component.editTeeForm.patchValue({
      teeName: '', // Invalid: missing name
      rating: 70.5,
      slope: 125,
      par: 71,
    });

    await component.onSubmit();

    expect(bottomSheetServiceMock.dismiss).not.toHaveBeenCalled();
  });

  it('does not submit a save action if the slope is out of WHS limits', async () => {
    component.editTeeForm.patchValue({
      teeName: 'White',
      rating: 70.5,
      slope: 10, // Invalid: below minimum slope
      par: 71,
    });

    await component.onSubmit();

    expect(bottomSheetServiceMock.dismiss).not.toHaveBeenCalled();
  });

  it('submits a delete action', () => {
    component.onDelete();

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalledWith({ action: 'delete' });
  });
});
