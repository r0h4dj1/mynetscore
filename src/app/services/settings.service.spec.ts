import { TestBed } from '@angular/core/testing';
import { db } from '../database/db';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    vi.restoreAllMocks();
    await db.settings.clear();

    TestBed.configureTestingModule({
      providers: [SettingsService],
    });
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults region to standard when no persisted setting exists', async () => {
    const getSpy = vi.spyOn(db.settings, 'get');

    await service.load();

    expect(service.region()).toBe('standard');
    expect(getSpy).toHaveBeenCalledWith('region');
  });

  it('loads a previously persisted golf australia region', async () => {
    await db.settings.put({ key: 'region', value: 'golfAustralia' });

    await service.load();

    expect(service.region()).toBe('golfAustralia');
  });

  it('persists and updates the region signal when setRegion is called', async () => {
    await service.load();
    await service.setRegion('golfAustralia');

    expect(service.region()).toBe('golfAustralia');
    await expect(db.settings.get('region')).resolves.toEqual({ key: 'region', value: 'golfAustralia' });
  });

  it('reflects the most recent region when setRegion is called concurrently', async () => {
    await service.load();

    await Promise.all([
      service.setRegion('standard'),
      service.setRegion('golfAustralia'),
      service.setRegion('standard'),
    ]);

    expect(service.region()).toBe('standard');
    await expect(db.settings.get('region')).resolves.toEqual({ key: 'region', value: 'standard' });
  });

  it('falls back to standard when an invalid region is stored', async () => {
    await db.settings.put({ key: 'region', value: 'invalid-region' });

    await service.load();

    expect(service.region()).toBe('standard');
  });

  it('restores the persisted region when the service is reinstantiated', async () => {
    await service.load();
    await service.setRegion('golfAustralia');

    // Create a new instance to simulate restart
    const restartedService = TestBed.runInInjectionContext(() => new SettingsService());

    await restartedService.load();
    expect(restartedService.region()).toBe('golfAustralia');
  });
});
