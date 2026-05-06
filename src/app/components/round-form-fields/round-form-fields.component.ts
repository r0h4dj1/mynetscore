import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { ValidationStatusDirective } from '../../directives/validation-status.directive';
import { RoundFormPageBase } from '../../pages/shared/round-form-page.base';

/**
 * Shared course, tee, date, and gross-score fields for round entry pages.
 *
 * Uses default change detection so getters on the `host` reference (e.g. selectedCourseLabel,
 * formattedDateLabel) refresh when the OnPush parent calls markForCheck after a selection.
 */
@Component({
  selector: 'app-round-form-fields',
  templateUrl: './round-form-fields.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon, ValidationStatusDirective],
})
export class RoundFormFieldsComponent {
  /** Page that owns the form group, validation state, and selector handlers. */
  @Input({ required: true }) host!: RoundFormPageBase;
}
