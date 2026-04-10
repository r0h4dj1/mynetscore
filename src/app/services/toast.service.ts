import { Injectable, signal, type Signal } from '@angular/core';

export interface ToastState {
  message: string;
  duration: number;
}

/**
 * Service for displaying toast notifications.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _toast = signal<ToastState | null>(null);
  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

  /** Signal read by the toast container component. */
  readonly toast: Signal<ToastState | null> = this._toast.asReadonly();

  /**
   * Presents an error toast notification from the top of the screen.
   *
   * @param message - The message to display.
   * @param duration - Duration in milliseconds (default: 3000).
   */
  presentErrorToast(message: string, duration = 3000) {
    this.clearTimer();
    this._toast.set({ message, duration });
    this.autoDismissTimer = setTimeout(() => this.dismiss(), duration);
  }

  /**
   * Dismisses the current toast.
   */
  dismiss() {
    this.clearTimer();
    this._toast.set(null);
  }

  private clearTimer() {
    if (this.autoDismissTimer !== null) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
  }
}
