import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { NavigationHistoryService } from '../../services/navigation-history.service';

/**
 * Component representing the main tabs container.
 */
@Component({
  selector: 'app-tabs',
  host: { class: 'block h-full' },
  templateUrl: './tabs.component.html',
  standalone: true,
  imports: [NgIcon, RouterOutlet],
})
export class TabsComponent {
  private readonly navigationHistoryService = inject(NavigationHistoryService);
  private readonly router = inject(Router);

  /**
   * Handles tab clicks.
   *
   * @param tab - The tab root path.
   */
  handleTabClick(tab: string): void {
    const currentUrl = this.router.url;
    const isCurrentTab = currentUrl.startsWith('/' + tab);

    if (isCurrentTab) {
      this.navigationHistoryService.clear(tab);
      this.router.navigateByUrl('/' + tab);
    } else {
      const lastUrl = this.navigationHistoryService.getLastUrl(tab);
      this.router.navigateByUrl(lastUrl);
    }
  }

  /**
   * Checks if a specific tab is currently active.
   *
   * @param tab - The tab root path.
   * @returns True if the tab is active.
   */
  isTabActive(tab: string): boolean {
    return this.router.url.startsWith('/' + tab);
  }
}
