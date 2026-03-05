import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * The root component of the MyNetScore application.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('mynetscore');
}
