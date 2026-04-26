import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentedControlOption {
  value: string;
  label: string;
}

/**
 * Component representing a tab-style segmented toggle.
 */
@Component({
  selector: 'app-segmented-control',
  standalone: true,
  imports: [],
  templateUrl: './segmented-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControlComponent {
  /** The available options to render. */
  @Input({ required: true }) options: SegmentedControlOption[] = [];

  /** The currently selected option value. */
  @Input({ required: true }) selected!: string;

  /** Optional accessible label applied to the tablist wrapper. */
  @Input() ariaLabel = '';

  /** Emits the option value when the selection changes. */
  @Output() selectedChange = new EventEmitter<string>();
}
