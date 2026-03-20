import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

/**
 * Service for displaying toast notifications.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastController = inject(ToastController);

  /**
   * Presents an error toast notification from the top of the screen.
   *
   * @param message - The message to display.
   * @param duration - Duration in milliseconds (default: 3000).
   */
  async presentErrorToast(message: string, duration = 3000) {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }
}
