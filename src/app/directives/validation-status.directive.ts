import { Directive, HostBinding, HostListener, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directive to manage validation status display for form inputs.
 * It shows an error border if the form has been submitted and the field is invalid,
 * and dismisses the error border when the field receives focus.
 */
@Directive({
  selector: '[appValidationStatus]',
  standalone: true,
})
export class ValidationStatusDirective implements OnChanges {
  /**
   * The number of times the form has been submitted.
   * If 0, validation status is not displayed.
   * Incrementing this value resets the dismissal state for the field.
   */
  @Input() appValidationStatus = 0;

  private readonly ngControl = inject(NgControl, { optional: true });
  private dismissed = false;

  /**
   * Resets the dismissed state when the submit count changes.
   *
   * @param changes - The object containing the changed properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appValidationStatus']) {
      this.dismissed = false;
    }
  }

  /**
   * Dismisses the validation error display when the input is focused.
   */
  @HostListener('focus')
  onFocus(): void {
    this.dismissed = true;
  }

  /**
   * Binds the border-color style based on validation and dismissal state.
   *
   * @returns The CSS color variable for the error state, or null if no error should be shown.
   */
  @HostBinding('style.border-color')
  get borderColor(): string | null {
    if (this.appValidationStatus === 0 || this.dismissed || !this.ngControl?.control) {
      return null;
    }
    return this.ngControl.control.invalid ? 'var(--color-error)' : null;
  }
}
