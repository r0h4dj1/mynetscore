import { Component, ChangeDetectionStrategy, input, output, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WheelItem {
  label: string | number;
  value: number;
}

/**
 * Component for a single wheel-style scrollable column.
 */
@Component({
  selector: 'app-wheel-column',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wheel-column.component.html',
})
export class WheelColumnComponent {
  items = input.required<WheelItem[]>();
  selectedValue = input.required<number>();
  valueChange = output<number>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  private isProgrammaticScroll = false;
  private readonly itemHeight = 48; // 3rem = 48px

  constructor() {
    effect(() => {
      const val = this.selectedValue();
      const list = this.items();

      // Delay so DOM elements (the rendered loop) are updated before scrolling
      setTimeout(() => {
        this.scrollToValue(val, list);
      });
    });
  }

  /**
   * Handles scroll end event to determine the selected item.
   */
  onScrollEnd() {
    if (this.isProgrammaticScroll) {
      this.isProgrammaticScroll = false;
      return;
    }
    if (!this.scrollContainer?.nativeElement) return;

    const el = this.scrollContainer.nativeElement;
    const index = Math.round(el.scrollTop / this.itemHeight);
    const list = this.items();

    if (list[index] && list[index].value !== this.selectedValue()) {
      this.valueChange.emit(list[index].value);
    }
  }

  private scrollToValue(value: number, list: WheelItem[]) {
    if (!this.scrollContainer?.nativeElement) return;

    const index = list.findIndex((item) => item.value === value);
    if (index > -1) {
      const targetScrollTop = index * this.itemHeight;
      const el = this.scrollContainer.nativeElement;

      if (Math.abs(el.scrollTop - targetScrollTop) > 1) {
        this.isProgrammaticScroll = true;
        el.scrollTo?.({ top: targetScrollTop, behavior: 'instant' });

        // Ensure programmatic scroll doesn't accidentally emit events via an unexpected scrollend
        setTimeout(() => {
          this.isProgrammaticScroll = false;
        }, 50);
      }
    }
  }
}
