import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Tee } from '../../database/db';
import { WHS_LIMITS } from '../../constants/whs.constants';
import { BottomSheetService } from '../../services/bottom-sheet.service';

export interface EditTeeModalResult {
  action: 'save' | 'delete';
  payload?: {
    name: string;
    rating: number;
    slope: number;
    par: number;
  };
}

/** Modal component for editing or deleting a tee. */
@Component({
  selector: 'app-edit-tee-modal',
  templateUrl: './edit-tee-modal.component.html',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditTeeModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bottomSheetService = inject(BottomSheetService);

  /** The tee to edit. */
  @Input() tee!: Tee;

  readonly editTeeForm: FormGroup = this.fb.group({
    teeName: ['', Validators.required],
    rating: ['', [Validators.required, Validators.min(0.1)]],
    slope: ['', [Validators.required, Validators.min(WHS_LIMITS.MIN_SLOPE), Validators.max(WHS_LIMITS.MAX_SLOPE)]],
    par: ['', [Validators.required, Validators.min(1)]],
  });

  editTeeSubmitCount = 0;

  /** Initializes the form with tee data. */
  ngOnInit() {
    if (this.tee) {
      this.editTeeForm.patchValue({
        teeName: this.tee.name,
        rating: this.tee.rating,
        slope: this.tee.slope,
        par: this.tee.par,
      });
    }
  }

  /** Submits the edited tee data. */
  async onSubmit() {
    this.editTeeSubmitCount++;

    if (this.editTeeForm.invalid) {
      return;
    }

    const { teeName, rating, slope, par } = this.editTeeForm.getRawValue();
    this.bottomSheetService.dismiss({
      action: 'save',
      payload: {
        name: teeName,
        rating: Number(rating),
        slope: Number(slope),
        par: Number(par),
      },
    } as EditTeeModalResult);
  }

  /** Deletes the tee. */
  onDelete() {
    this.bottomSheetService.dismiss({ action: 'delete' } as EditTeeModalResult);
  }
}
