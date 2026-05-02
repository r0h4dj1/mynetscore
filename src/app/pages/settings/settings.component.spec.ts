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

  function getRadioInputs(): HTMLInputElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('input[type="radio"][name="region"]'));
  }

  it('renders both region options with their labels', () => {
    const radioInputs = getRadioInputs();
    expect(radioInputs.length).toBe(2);
    expect(radioInputs[0].parentElement?.textContent).toContain('Standard WHS');
    expect(radioInputs[1].parentElement?.textContent).toContain('Golf Australia');
  });

  it('preselects the currently persisted region', () => {
    regionSignal.set('golfAustralia');
    fixture.detectChanges();

    const radioInputs = getRadioInputs();
    expect(radioInputs[0].checked).toBe(false);
    expect(radioInputs[1].checked).toBe(true);
  });

  it('persists the region when the user picks a different option', async () => {
    const radioInputs = getRadioInputs();
    radioInputs[1].click();
    await fixture.whenStable();

    expect(setRegionMock).toHaveBeenCalledWith('golfAustralia');
  });

  it('does not persist when the user taps the already-selected option', async () => {
    const radioInputs = getRadioInputs();
    radioInputs[0].click();
    await fixture.whenStable();

    expect(setRegionMock).not.toHaveBeenCalled();
  });

  it('shows an error toast when persistence fails', async () => {
    setRegionMock.mockRejectedValueOnce(new Error('db error'));

    await fixture.componentInstance.onRegionChange('golfAustralia');

    expect(presentErrorToastMock).toHaveBeenCalledWith('Failed to save settings.');
  });
});
