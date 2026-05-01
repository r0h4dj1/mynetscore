import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

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
  private readonly router = inject(Router);

  /**
   * Handles tab clicks.
   *
   * @param tab - The tab root path.
   */
  handleTabClick(tab: string): void {
    this.router.navigateByUrl('/' + tab);
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
