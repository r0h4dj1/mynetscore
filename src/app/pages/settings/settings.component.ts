import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import type { Region } from '../../constants/settings.constants';
import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../services/toast.service';

interface RegionOption {
  value: Region;
  label: string;
}

/**
 * Component representing the settings page.
 */
@Component({
  selector: 'app-settings',
  host: { class: 'flex flex-col h-full' },
  templateUrl: './settings.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
})
export class SettingsPage {
  private readonly settingsService = inject(SettingsService);
  private readonly toastService = inject(ToastService);

  readonly region = this.settingsService.region;
  readonly options: readonly RegionOption[] = [
    { value: 'standard', label: 'Standard WHS' },
    { value: 'golfAustralia', label: 'Golf Australia' },
  ];

  /**
   * Persists the selected region when the user picks a different option.
   *
   * @param value - The newly selected region value.
   */
  async onRegionChange(value: Region): Promise<void> {
    if (value === this.region()) {
      return;
    }
    try {
      await this.settingsService.setRegion(value);
    } catch {
      this.toastService.presentErrorToast('Failed to save settings.');
    }
  }
}
