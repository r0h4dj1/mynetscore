import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { BottomSheetModalComponent } from './components/bottom-sheet-modal/bottom-sheet-modal.component';

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
export class App {
  protected readonly title = signal('mynetscore');
}
