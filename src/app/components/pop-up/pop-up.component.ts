import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * A reusable popup component for confirmations and alerts.
 */
@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopUpComponent {
  /**
   * The main title displayed at the top of the popup.
   */
  @Input({ required: true }) title!: string;

  /**
   * Text for the primary action button.
   */
  @Input({ required: true }) primaryButtonText!: string;

  /**
   * Optional text for the secondary action button. If provided, the button is displayed.
   */
  @Input() secondaryButtonText?: string;

  /**
   * Event emitted when the primary action button is clicked.
   */
  @Output() primaryAction = new EventEmitter<void>();

  /**
   * Event emitted when the secondary action button is clicked.
   */
  @Output() secondaryAction = new EventEmitter<void>();
}
