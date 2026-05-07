import { Component, computed, inject, Signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HandicapStateService, RecentRoundDisplay, RECENT_DISPLAY_COUNT } from '../../services/handicap-state.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { FormatDatePipe } from '../../pipes/format-date.pipe';

/**
 * Component representing the home page dashboard.
 */
@Component({
  selector: 'app-home',
  host: { class: 'flex flex-col h-full' },
  templateUrl: './home.component.html',
  standalone: true,
  imports: [PageHeaderComponent, NgIcon, FormatDatePipe, DecimalPipe, RouterLink],
})
export class HomePage implements OnInit {
  private readonly handicapStateService = inject(HandicapStateService);

  readonly handicapIndex = this.handicapStateService.handicapIndex;
  readonly totalRoundsInWindow = this.handicapStateService.totalRoundsInWindow;
  readonly totalRounds = this.handicapStateService.totalRounds;
  readonly totalCoursesPlayed = this.handicapStateService.totalCoursesPlayed;
  readonly trend = this.handicapStateService.trend;
  readonly recentRounds: Signal<RecentRoundDisplay[]> = this.handicapStateService.recentRounds;
  readonly usedRoundIds = this.handicapStateService.usedRoundIds;

  readonly isProvisional = computed(() => this.totalRoundsInWindow() > 0 && this.totalRoundsInWindow() < 20);

  readonly placeholders = computed(() => {
    const count = RECENT_DISPLAY_COUNT - this.recentRounds().length;
    return count > 0 ? new Array(count).fill(0) : [];
  });

  readonly trendDisplay = computed(() => {
    const t = this.trend();
    switch (t) {
      case 'improving':
        return { icon: 'ionCaretUp', text: 'Improving', class: 'text-success-light' };
      case 'worsening':
        return { icon: 'ionCaretDown', text: 'Worsening', class: 'text-error-light' };
      case 'stable':
        return { icon: 'ionCaretForward', text: 'Stable', class: 'text-frosted-blue' };
      default:
        return { icon: null, text: '', class: 'text-primary-font' };
    }
  });

  /**
   * Initializes the component and refreshes the handicap state.
   */
  async ngOnInit(): Promise<void> {
    await this.handicapStateService.refresh();
  }

  /**
   * Determines if a round is currently used in the handicap calculation.
   *
   * @param roundId - The ID of the round to check.
   * @returns True if the round is used, false otherwise.
   */
  isRoundCounting(roundId: string): boolean {
    return this.usedRoundIds().includes(roundId);
  }
}
