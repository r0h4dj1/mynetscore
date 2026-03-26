import { Component, signal } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

/**
 * The root component of the MyNetScore application.
 */
@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('mynetscore');
}
