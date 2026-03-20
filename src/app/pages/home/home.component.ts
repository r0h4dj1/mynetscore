import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

/**
 * Component representing the home page.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [IonContent],
})
export class HomePage {}
