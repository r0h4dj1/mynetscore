import { booleanAttribute, ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { BackNavigationService } from '../../services/back-navigation.service';

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
  private readonly backNavigation = inject(BackNavigationService);

  /** The title of the page header. */
  @Input() title = '';

  /** Whether to show a back button in the header. */
  @Input({ transform: booleanAttribute }) backButton = false;

  /**
   * Navigates back to the previous page, falling back to a sensible default
   * when there is no in-app history (e.g. deep link entry).
   */
  goBack(): void {
    this.backNavigation.back();
  }
}
