import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { ionChevronBack } from '@ng-icons/ionicons';
import { signal } from '@angular/core';
import { SettingsPage } from './settings.component';
import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../services/toast.service';
import type { Region } from '../../constants/settings.constants';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;

  const regionSignal = signal<Region>('standard');
  const setRegionMock = vi.fn<(region: Region) => Promise<void>>();
  const presentErrorToastMock = vi.fn();

  beforeEach(async () => {
    regionSignal.set('standard');
    setRegionMock.mockReset();
    setRegionMock.mockResolvedValue(undefined);
    presentErrorToastMock.mockClear();

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideIcons({ ionChevronBack }),
        {
          provide: SettingsService,
          useValue: {
            region: regionSignal,
            setRegion: setRegionMock,
          },
        },
        {
          provide: ToastService,
          useValue: { presentErrorToast: presentErrorToastMock },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
  });

  function getRadios(): HTMLButtonElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button[role="radio"]'));
  }

  it('renders both region options with their labels', () => {
    const radios = getRadios();
    expect(radios.length).toBe(2);
    expect(radios[0].textContent).toContain('Standard WHS');
    expect(radios[1].textContent).toContain('Golf Australia');
  });

  it('preselects the currently persisted region', () => {
    regionSignal.set('golfAustralia');
    fixture.detectChanges();

    const radios = getRadios();
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
  });

  it('persists the region when the user picks a different option', async () => {
    const radios = getRadios();
    radios[1].click();
    await fixture.whenStable();

    expect(setRegionMock).toHaveBeenCalledWith('golfAustralia');
  });

  it('does not persist when the user taps the already-selected option', async () => {
    const radios = getRadios();
    radios[0].click();
    await fixture.whenStable();

    expect(setRegionMock).not.toHaveBeenCalled();
  });

  it('shows an error toast when persistence fails', async () => {
    setRegionMock.mockRejectedValueOnce(new Error('db error'));

    await fixture.componentInstance.onRegionChange('golfAustralia');

    expect(presentErrorToastMock).toHaveBeenCalledWith('Failed to save settings.');
  });
});
