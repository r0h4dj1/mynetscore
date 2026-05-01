import { DestroyRef, Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

/**
 * Service for navigating back with a deterministic fallback when there is no
 * in-app history (e.g. the page was opened via deep link or in a fresh tab).
 */
@Injectable({
  providedIn: 'root',
})
export class BackNavigationService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  // The first NavigationEnd is the initial entry. Anything beyond that means
  // the user has navigated within the app, so location.back() is safe.
  private navigationCount = 0;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.navigationCount++;
      });
  }

  /**
   * Navigates back. Uses browser history when in-app history exists,
   * otherwise navigates to a sensible fallback route.
   */
  back(): void {
    if (this.navigationCount > 1) {
      this.location.back();
      return;
    }
    this.router.navigateByUrl(this.fallbackUrl());
  }

  private fallbackUrl(): string {
    const segments = this.router.url.split(/[?#]/)[0].split('/').filter(Boolean);
    return segments.length > 1 ? `/${segments[0]}` : '/';
  }
}
