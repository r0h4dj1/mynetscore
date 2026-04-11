import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** Service for tracking navigation history to enable predictable back navigation. */
@Injectable({
  providedIn: 'root',
})
export class NavigationHistoryService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private histories: Record<string, string[]> = {
    home: [],
    rounds: [],
    courses: [],
  };

  private isPopping = false;

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd | NavigationCancel | NavigationError =>
            event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (this.isPopping) {
          this.isPopping = false;
          if (!(event instanceof NavigationEnd)) {
            return;
          }
          // If it IS NavigationEnd and isPopping was true, we still want to return
          // to suppress this navigation end.
          return;
        }

        if (event instanceof NavigationEnd) {
          const url = event.urlAfterRedirects;
          const tab = this.getTabFromUrl(url);

          if (tab) {
            const stack = this.histories[tab];
            if (stack.at(-1) !== url) {
              stack.push(url);
            }
          }
        }
      });
  }

  /**
   * Derives the root tab identifier from a given URL.
   *
   * @param url - The URL to analyze.
   * @returns The tab name or an empty string.
   */
  private getTabFromUrl(url: string): string {
    const cleanUrl = url.split(/[?#]/)[0];
    const segments = cleanUrl.split('/').filter((s) => s !== '');
    if (segments.length > 0 && this.histories[segments[0]]) {
      return segments[0];
    }
    return '';
  }

  /**
   * Pops the current URL from the current tab's stack and navigates to the previous URL.
   * Falls back to tab root or app root ('/') if the stack is empty.
   *
   * @returns Promise resolving to navigation success.
   */
  pop(): Promise<boolean> {
    const currentUrl = this.router.url;
    const currentPath = currentUrl.split(/[?#]/)[0];
    const tab = this.getTabFromUrl(currentUrl);
    const stack = this.histories[tab];

    if (stack && stack.length > 1) {
      this.isPopping = true;
      stack.pop();
      const previousUrl = stack.at(-1)!;
      return this.router.navigateByUrl(previousUrl);
    }

    if (tab && currentPath !== `/${tab}`) {
      this.isPopping = true;
      if (stack && stack.length > 0) {
        stack.pop();
      }
      return this.router.navigateByUrl(`/${tab}`);
    }

    if (currentUrl === '/home' || currentUrl === '/') {
      return Promise.resolve(true);
    }

    return this.router.navigateByUrl('/');
  }

  /**
   * Clears the navigation history.
   * If a tab is specified, only that tab's history is cleared.
   * Otherwise, all history is cleared.
   *
   * @param tab - Optional tab name to clear.
   */
  clear(tab?: string): void {
    if (tab && this.histories[tab]) {
      this.histories[tab] = [];
    } else {
      Object.keys(this.histories).forEach((k) => {
        this.histories[k] = [];
      });
    }
  }

  /**
   * Returns a copy of the navigation history stack for the current or specified tab.
   *
   * @param tab - Optional tab name.
   * @returns Array of visited URLs.
   */
  getHistory(tab?: string): string[] {
    const targetTab = tab || this.getTabFromUrl(this.router.url);
    const stack = this.histories[targetTab];
    return stack ? [...stack] : [];
  }

  /**
   * Gets the last visited URL for a specific tab.
   *
   * @param tab - The tab name.
   * @returns The last URL in the stack, or the tab root if empty.
   */
  getLastUrl(tab: string): string {
    return this.histories[tab]?.at(-1) ?? `/${tab}`;
  }
}
