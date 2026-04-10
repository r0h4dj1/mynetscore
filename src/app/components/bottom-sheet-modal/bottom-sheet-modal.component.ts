import { ChangeDetectionStrategy, Component, effect, inject, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { BottomSheetService } from '../../services/bottom-sheet.service';

const DRAG_DISMISS_THRESHOLD = 150;

/**
 * Global bottom sheet overlay host rendered once at the root level.
 *
 * Listens to the `BottomSheetService` signal and renders the active component
 * inside a slide-up panel with drag-to-dismiss and backdrop-click-to-dismiss.
 */
@Component({
  selector: 'app-bottom-sheet-modal',
  standalone: true,
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bottom-sheet-modal.component.html',
  styles: `
    @keyframes backdrop-in {
      to {
        opacity: 1;
      }
    }
    .animate-backdrop-in {
      opacity: 0;
      animation: backdrop-in 300ms ease-out forwards;
    }
  `,
})
export class BottomSheetModalComponent {
  private readonly bottomSheetService = inject(BottomSheetService);

  protected readonly isOpen = signal(false);
  protected readonly isVisible = signal(false);
  protected readonly component = signal<Type<unknown> | null>(null);
  protected readonly inputs = signal<Record<string, unknown> | null>(null);

  private startY = 0;
  private currentTranslate = 0;
  private isDragging = false;
  private sheetEl: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const state = this.bottomSheetService.state();
      if (state.isOpen) {
        this.component.set(state.component);
        this.inputs.set(state.inputs);
        this.isOpen.set(true);
        // Allow DOM to create the sheet element, then trigger the open animation
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.isVisible.set(true);
          });
        });
      } else {
        this.isVisible.set(false);
        // Wait for the close animation to finish before removing from DOM
        setTimeout(() => {
          this.isOpen.set(false);
          this.component.set(null);
          this.inputs.set(null);
        }, 300);
      }
    });
  }

  protected onBackdropClick(): void {
    this.bottomSheetService.dismiss();
  }

  protected onHandleDown(event: PointerEvent): void {
    const handleEl = event.currentTarget as HTMLElement;
    this.sheetEl = handleEl.closest('[data-testid="sheet"]') as HTMLElement;
    if (!this.sheetEl) return;
    this.startY = event.clientY;
    this.isDragging = true;
    handleEl.setPointerCapture(event.pointerId);
    this.sheetEl.style.transition = 'none';
  }

  protected onHandleMove(event: PointerEvent): void {
    if (!this.isDragging || !this.sheetEl) return;
    const delta = event.clientY - this.startY;
    if (delta < 0) return;
    this.currentTranslate = delta;
    this.sheetEl.style.transform = `translateY(${delta}px)`;
  }

  protected onHandleUp(): void {
    if (!this.isDragging || !this.sheetEl) return;
    this.isDragging = false;
    const sheetEl = this.sheetEl;
    this.sheetEl = null;

    if (this.currentTranslate > DRAG_DISMISS_THRESHOLD) {
      sheetEl.style.transition = 'transform 200ms ease-in';
      sheetEl.style.transform = 'translateY(100%)';
      setTimeout(() => {
        this.bottomSheetService.dismiss();
      }, 200);
    } else {
      sheetEl.style.transition = 'transform 200ms ease-out';
      sheetEl.style.transform = 'translateY(0)';
    }

    this.currentTranslate = 0;
    this.startY = 0;
  }
}
