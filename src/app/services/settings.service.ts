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
  private writeChain: Promise<void> = Promise.resolve();

  readonly region = this.regionSignal.asReadonly();

  /**
   * Persists the selected region and mirrors it into the reactive signal.
   * Writes are serialized so concurrent calls always reflect call order in the DB.
   *
   * @param region - The regional ruleset to apply.
   */
  async setRegion(region: Region): Promise<void> {
    this.regionSignal.set(region);
    const write = this.writeChain.then(() => db.settings.put({ key: 'region', value: region }));
    this.writeChain = write.then(
      () => undefined,
      () => undefined,
    );
    await write;
  }

  /**
   * Loads the persisted region from IndexedDB or falls back to 'standard'.
   * This is called during app initialization to ensure the region is ready before use.
   */
  async load(): Promise<void> {
    try {
      const storedRegion = (await db.settings.get('region'))?.value;
      this.regionSignal.set(isRegion(storedRegion) ? storedRegion : 'standard');
    } catch {
      this.regionSignal.set('standard');
    }
  }
}
