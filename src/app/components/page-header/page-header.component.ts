import { booleanAttribute, ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { NavigationHistoryService } from '../../services/navigation-history.service';

/**
 * Component representing a reusable page header.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  private readonly navigationHistoryService = inject(NavigationHistoryService);

  /** The title of the page header. */
  @Input() title = '';

  /** Whether to show a back button in the header. */
  @Input({ transform: booleanAttribute }) backButton = false;

  /**
   * Navigates back to the previous page in history.
   */
  async goBack(): Promise<void> {
    await this.navigationHistoryService.pop();
  }
}
