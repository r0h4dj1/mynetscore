import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ToastService } from '../../services/toast.service';

const SWIPE_THRESHOLD = 50;
const FADE_OUT_MS = 200;

/**
 * Renders a single toast notification that can be swiped to dismiss.
 * Pulled from the {@link ToastService} signal and animated in / out with
 * a quick blink transition when the message changes while already visible.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fixed inset-x-0 top-0 z-[60] flex justify-center pointer-events-none',
  },
  template: `
    @if (message(); as msg) {
      <div
        #toastEl
        class="toast"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp()"
        (pointercancel)="onPointerUp()"
      >
        {{ msg }}
      </div>
    }
  `,
  styles: `
    .toast {
      pointer-events: auto;
      margin: 2rem 0.5rem 0;
      padding: 0.75rem 1rem;
      border-radius: 0.375rem;
      background-color: var(--color-error);
      color: var(--color-primary-font);
      font-size: 1.125rem;
      font-weight: 400;
      box-shadow:
        0 10px 15px -3px rgb(0 0 0 / 0.1),
        0 4px 6px -4px rgb(0 0 0 / 0.1);
      user-select: none;
      touch-action: none;
      cursor: grab;
      will-change: opacity, transform;
      opacity: 0;
      transform: translateY(-100%);
      transition:
        opacity 200ms ease-out,
        transform 200ms ease-out;
    }
    .toast-show {
      opacity: 1;
      transform: translateY(0);
    }
  `,
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);

  @ViewChild('toastEl') toastEl?: ElementRef<HTMLElement>;

  /** null = nothing in DOM, string = element exists with this message */
  protected readonly message = signal<string | null>(null);

  private startY = 0;
  private dismissTimeout: ReturnType<typeof setTimeout> | null = null;
  private blinkTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const toast = this.toastService.toast();
      if (toast) {
        this.clearDismissTimeout();
        if (this.message() === null) {
          this.show(toast.message);
        } else {
          this.blink(toast.message);
        }
      } else if (this.message() !== null) {
        this.dismiss();
      }
    });
  }

  private show(msg: string) {
    this.clearBlinkTimeout();
    this.message.set(msg);
    requestAnimationFrame(() => {
      this.toastEl?.nativeElement?.classList.add('toast-show');
    });
  }

  private dismiss() {
    this.clearBlinkTimeout();
    this.toastEl?.nativeElement?.classList.remove('toast-show');
    this.dismissTimeout = setTimeout(() => {
      this.message.set(null);
    }, FADE_OUT_MS);
  }

  private blink(newMessage: string) {
    this.clearBlinkTimeout();
    this.toastEl?.nativeElement?.classList.remove('toast-show');

    this.blinkTimeout = setTimeout(() => {
      this.message.set(newMessage);
      requestAnimationFrame(() => {
        this.toastEl?.nativeElement?.classList.add('toast-show');
      });
    }, 120);
  }

  protected onPointerDown(event: PointerEvent) {
    this.startY = event.clientY;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent) {
    if (this.startY === 0) return;
    const delta = event.clientY - this.startY;
    if (delta < 0) {
      const el = this.toastEl?.nativeElement;
      if (el) {
        el.style.transition = 'none';
        el.style.transform = `translateY(${delta}px)`;
        el.style.opacity = `${Math.max(0, 1 + delta / 100)}`;
      }
    }
  }

  protected onPointerUp() {
    if (this.startY === 0) return;
    const el = this.toastEl?.nativeElement;
    const delta = this.getSwipeDelta(el);

    if (delta < -SWIPE_THRESHOLD) {
      this.toastService.dismiss();
    } else if (el) {
      el.style.transform = '';
      el.style.opacity = '';
      el.style.transition = '';
    }
    this.startY = 0;
  }

  private getSwipeDelta(el: HTMLElement | undefined): number {
    if (!el) return 0;
    const match = /translateY\((-?\d+(?:\.\d+)?)px\)/.exec(el.style.transform);
    return match ? Number.parseFloat(match[1]) : 0;
  }

  private clearDismissTimeout() {
    if (this.dismissTimeout !== null) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }
  }

  private clearBlinkTimeout() {
    if (this.blinkTimeout !== null) {
      clearTimeout(this.blinkTimeout);
      this.blinkTimeout = null;
    }
  }
}
