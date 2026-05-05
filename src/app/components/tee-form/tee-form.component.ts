import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ValidationStatusDirective } from '../../directives/validation-status.directive';

/**
 * Shared tee details fields used by add and edit tee flows.
 */
@Component({
  selector: 'app-tee-form',
  templateUrl: './tee-form.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, ValidationStatusDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeeFormComponent {
  /** Form group containing teeName, rating, slope, and par controls. */
  @Input({ required: true }) parentForm!: FormGroup;

  /** Number of parent form submit attempts, used to display validation state. */
  @Input() submitCount = 0;
}
