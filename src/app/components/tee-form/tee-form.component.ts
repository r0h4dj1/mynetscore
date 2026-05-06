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

  /** Prefix for input IDs; set when multiple instances may share the DOM (e.g. edit modal over course-detail). */
  @Input() idPrefix = '';

  /**
   * Returns a prefixed DOM ID for the given field name.
   *
   * @param name - The camelCase field name (e.g. 'teeName').
   * @returns The prefixed ID (e.g. 'editTeeName') or the bare name when no prefix is set.
   */
  fieldId(name: string): string {
    return this.idPrefix ? `${this.idPrefix}${name.charAt(0).toUpperCase()}${name.slice(1)}` : name;
  }
}
