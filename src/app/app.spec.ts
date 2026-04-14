import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { App as CapApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { BottomSheetService } from './services/bottom-sheet.service';
import { NavigationHistoryService } from './services/navigation-history.service';
import { vi, expect, type Mock } from 'vitest';
import { signal } from '@angular/core';

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    exitApp: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(),
  },
}));

interface MockBottomSheetService {
  isOpen: boolean;
  state: ReturnType<typeof signal>;
  dismiss: Mock<() => void>;
}

interface MockNavigationHistoryService {
  isAtTabRoot: Mock<() => boolean>;
  pop: Mock<() => Promise<boolean>>;
}

describe('App', () => {
  let bottomSheetServiceMock: MockBottomSheetService;
  let navigationHistoryServiceMock: MockNavigationHistoryService;

  beforeEach(async () => {
    bottomSheetServiceMock = {
      isOpen: false,
      state: signal({ isOpen: false, component: null, inputs: null }),
      dismiss: vi.fn(),
    };
    navigationHistoryServiceMock = {
      isAtTabRoot: vi.fn(),
      pop: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: BottomSheetService, useValue: bottomSheetServiceMock },
        { provide: NavigationHistoryService, useValue: navigationHistoryServiceMock },
      ],
    }).compileComponents();

    vi.clearAllMocks();
  });

  it('should register backButton listener on Android', async () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
    vi.mocked(CapApp.addListener).mockResolvedValue({ remove: vi.fn() } as PluginListenerHandle);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(CapApp.addListener).toHaveBeenCalledWith('backButton', expect.any(Function));
  });

  it('should not register backButton listener on non-Android', async () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(CapApp.addListener).not.toHaveBeenCalled();
  });

  it('should dismiss bottom sheet if open when back is pressed', async () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
    vi.mocked(CapApp.addListener).mockResolvedValue({ remove: vi.fn() } as PluginListenerHandle);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    // Get the listener callback
    const listener = vi.mocked(CapApp.addListener).mock.calls[0][1];

    bottomSheetServiceMock.isOpen = true;
    listener({ canGoBack: true });

    expect(bottomSheetServiceMock.dismiss).toHaveBeenCalled();
  });

  it('should pop history if not at tab root and no sheet open when back is pressed', async () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
    vi.mocked(CapApp.addListener).mockResolvedValue({ remove: vi.fn() } as PluginListenerHandle);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const listener = vi.mocked(CapApp.addListener).mock.calls[0][1];

    bottomSheetServiceMock.isOpen = false;
    navigationHistoryServiceMock.isAtTabRoot.mockReturnValue(false);
    listener({ canGoBack: true });

    expect(navigationHistoryServiceMock.pop).toHaveBeenCalled();
  });

  it('should exit app if at tab root and no sheet open when back is pressed', async () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
    vi.mocked(CapApp.addListener).mockResolvedValue({ remove: vi.fn() } as PluginListenerHandle);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const listener = vi.mocked(CapApp.addListener).mock.calls[0][1];

    bottomSheetServiceMock.isOpen = false;
    navigationHistoryServiceMock.isAtTabRoot.mockReturnValue(true);
    listener({ canGoBack: false });

    expect(CapApp.exitApp).toHaveBeenCalled();
  });

  it('should remove listener on destroy', async () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
    const removeMock = vi.fn();
    vi.mocked(CapApp.addListener).mockResolvedValue({ remove: removeMock } as PluginListenerHandle);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.destroy();

    expect(removeMock).toHaveBeenCalled();
  });
});
