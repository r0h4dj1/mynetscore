import { Component, signal, inject, type OnInit, type OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { type PluginListenerHandle } from '@capacitor/core';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { BottomSheetModalComponent } from './components/bottom-sheet-modal/bottom-sheet-modal.component';
import { BottomSheetService } from './services/bottom-sheet.service';
import { NavigationHistoryService } from './services/navigation-history.service';

/**
 * The root component of the MyNetScore application.
 */
@Component({
  selector: 'app-root',
  host: { class: 'block h-full' },
  imports: [RouterOutlet, ToastContainerComponent, BottomSheetModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('mynetscore');

  private readonly bottomSheetService = inject(BottomSheetService);
  private readonly navigationHistoryService = inject(NavigationHistoryService);

  private backListenerHandle: PluginListenerHandle | null = null;
  private isDestroyed = false;

  /**
   * Initializes the component and registers the Capacitor back button listener on Android.
   */
  async ngOnInit(): Promise<void> {
    if (Capacitor.getPlatform() === 'android') {
      const handle = await CapApp.addListener('backButton', () => {
        if (this.bottomSheetService.isOpen) {
          this.bottomSheetService.dismiss();
        } else if (this.navigationHistoryService.isAtTabRoot()) {
          CapApp.exitApp();
        } else {
          // Catch potential routing errors from the underlying navigateByUrl to avoid unhandled promise rejections
          this.navigationHistoryService.pop().catch(console.error);
        }
      });

      if (this.isDestroyed) {
        handle.remove();
      } else {
        this.backListenerHandle = handle;
      }
    }
  }

  /**
   * Cleans up the back button listener when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.backListenerHandle) {
      this.backListenerHandle.remove();
    }
  }
}
