import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { BottomSheetService } from '../../services/bottom-sheet.service';

/**
 * Represents an item that can be selected in the list selector modal.
 */
export interface SelectorItem {
  id: string;
  label: string;
  subLabel?: string;
}

/**
 * Component for displaying a list of selectable items in a bottom sheet.
 */
@Component({
  selector: 'app-list-selector-modal',
  standalone: true,
  imports: [CommonModule, NgIcon],
  templateUrl: './list-selector-modal.component.html',
  host: {
    style: 'max-height: 85vh',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListSelectorModalComponent {
  private readonly bottomSheetService = inject(BottomSheetService);

  /** Title displayed at the top of the modal. */
  @Input() title = 'Select Option';

  /** List of items to display in the selector. */
  @Input() items: SelectorItem[] = [];

  /** The ID of the currently selected item. */
  @Input() selectedId: string | null = null;

  /**
   * Selects an item and dismisses the modal with the selected ID.
   *
   * @param id - The ID of the selected item.
   */
  selectItem(id: string): void {
    this.bottomSheetService.dismiss(id);
  }
}
