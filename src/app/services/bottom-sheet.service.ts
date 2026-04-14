import { Injectable, Type, signal, type Signal } from '@angular/core';

export interface BottomSheetState {
  isOpen: boolean;
  component: Type<unknown> | null;
  inputs: Record<string, unknown> | null;
}

/**
 * Singleton service that owns bottom sheet overlay state and lifecycle.
 *
 * `open()` pushes a history entry so the browser back button closes the sheet.
 * `dismiss()` resolves the promise returned by `open()` with the supplied value.
 */
@Injectable({
  providedIn: 'root',
})
export class BottomSheetService {
  private readonly _state = signal<BottomSheetState>({
    isOpen: false,
    component: null,
    inputs: null,
  });

  private resolver: ((result?: unknown) => void) | null = null;
  private popstateListener: (() => void) | null = null;

  /** Signal consumed by the bottom sheet modal component. */
  readonly state: Signal<BottomSheetState> = this._state.asReadonly();

  /**
   * Whether the bottom sheet is currently open.
   *
   * @returns True if open, false otherwise.
   */
  get isOpen(): boolean {
    return this._state().isOpen;
  }

  /**
   * Opens the bottom sheet with the given component and optional inputs.
   *
   * @param component - The component to render inside the bottom sheet.
   * @param inputs - Optional key/value pairs passed as inputs to the component.
   */
  open<T>(component: Type<T>, inputs?: Record<string, unknown>): Promise<unknown> {
    if (this._state().isOpen) {
      this.dismiss();
    }

    return new Promise<unknown>((resolve) => {
      this.resolver = resolve;

      this._state.set({
        isOpen: true,
        component: component,
        inputs: inputs ?? null,
      });

      globalThis.history.pushState({ isBottomSheet: true }, '');

      this.popstateListener = () => {
        this.dismiss(undefined, true);
      };
      globalThis.addEventListener('popstate', this.popstateListener);
    });
  }

  /**
   * Dismisses the bottom sheet and resolves the `open()` promise with `result`.
   * Safe to call multiple times – subsequent calls are no-ops.
   *
   * @param result - Value to resolve the promise with (defaults to `undefined`).
   * @param fromHistory - Internal flag to prevent redundant history.back() when triggered by back button.
   */
  dismiss(result?: unknown, fromHistory = false): void {
    const currentState = this._state();
    if (!currentState.isOpen) return;

    this._state.set({
      isOpen: false,
      component: null,
      inputs: null,
    });

    this.removePopstateListener();

    if (!fromHistory) {
      globalThis.history.back();
    }

    const resolve = this.resolver;
    this.resolver = null;

    if (resolve) {
      resolve(result);
    }
  }

  private removePopstateListener(): void {
    if (this.popstateListener) {
      globalThis.removeEventListener('popstate', this.popstateListener);
      this.popstateListener = null;
    }
  }
}
