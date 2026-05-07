import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { FormatDatePipe } from '../../pipes/format-date.pipe';
import {
  SegmentedControlComponent,
  SegmentedControlOption,
} from '../../components/segmented-control/segmented-control.component';
import { HandicapStateService } from '../../services/handicap-state.service';
import { RoundHistoryService, RoundRowDisplay } from '../../services/round-history.service';
import { ToastService } from '../../services/toast.service';

type TabValue = 'all' | 'counting';

const LEGACY_INDEX_THRESHOLD = 20;

/**
 * Component representing the rounds page.
 */
@Component({
  selector: 'app-rounds',
  host: { class: 'block h-full' },
  templateUrl: './rounds.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, RouterLink, FormatDatePipe, DecimalPipe, PageHeaderComponent, SegmentedControlComponent],
})
export class RoundsPage implements OnInit {
  private readonly handicapState = inject(HandicapStateService);
  private readonly roundHistoryService = inject(RoundHistoryService);
  private readonly toastService = inject(ToastService);

  readonly activeTab = signal<TabValue>('all');
  readonly allRounds = signal<RoundRowDisplay[]>([]);
  readonly tabOptions: SegmentedControlOption[] = [
    { value: 'all', label: 'All rounds' },
    { value: 'counting', label: 'Counting' },
  ];

  readonly usedRoundIds = this.handicapState.usedRoundIds;
  readonly countingIdSet = computed(() => new Set(this.usedRoundIds()));

  readonly filteredRounds = computed(() => {
    const rows = this.allRounds();
    if (this.activeTab() === 'counting') {
      const set = this.countingIdSet();
      return rows.filter((r) => set.has(r.id));
    }
    return rows;
  });

  /**
   * Loads round history and refreshes the current counting snapshot.
   */
  async ngOnInit(): Promise<void> {
    try {
      const [rounds] = await Promise.all([this.roundHistoryService.listAll(), this.handicapState.refresh()]);
      this.allRounds.set(rounds);
    } catch {
      this.toastService.presentErrorToast('Failed to load rounds.');
    }
  }

  /**
   * Returns whether a round currently contributes to the handicap index.
   *
   * @param id - The round id to check.
   * @returns True when the round id is part of the counting set.
   */
  isCounting(id: string): boolean {
    return this.countingIdSet().has(id);
  }

  /**
   * Returns whether a row is in the legacy (older than the most-recent-20) window.
   *
   * @param index - The row index in newest-first order.
   * @returns True when the index is at or beyond the legacy threshold.
   */
  isLegacy(index: number): boolean {
    return index >= LEGACY_INDEX_THRESHOLD;
  }

  /**
   * Handles a change of the active tab from the segmented control.
   *
   * @param value - The new tab value.
   */
  onTabChange(value: string): void {
    this.activeTab.set(value as TabValue);
  }
}
