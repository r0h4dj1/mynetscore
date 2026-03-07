import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

/**
 * Component representing the rounds page.
 */
@Component({
  selector: 'app-rounds',
  templateUrl: './rounds.component.html',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class RoundsPage {}
