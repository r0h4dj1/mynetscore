import { Injectable, signal } from '@angular/core';
import { isRegion, type Region } from '../constants/settings.constants';
import { db } from '../database/db';

/**
 * Persists and exposes app-level settings backed by IndexedDB.
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly regionSignal = signal<Region>('standard');

  readonly region = this.regionSignal.asReadonly();

  /**
   * Persists the selected region and mirrors it into the reactive signal.
   *
   * @param region - The regional ruleset to apply.
   */
  async setRegion(region: Region): Promise<void> {
    this.regionSignal.set(region);
    await db.settings.put({ key: 'region', value: region });
  }

  /**
   * Loads the persisted region from IndexedDB or falls back to 'standard'.
   * This is called during app initialization to ensure the region is ready before use.
   */
  async load(): Promise<void> {
    const storedRegion = (await db.settings.get('region'))?.value;
    this.regionSignal.set(isRegion(storedRegion) ? storedRegion : 'standard');
  }
}
