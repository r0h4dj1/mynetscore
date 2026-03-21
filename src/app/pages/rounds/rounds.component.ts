import { Component } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

/**
 * Component representing the rounds page.
 */
@Component({
  selector: 'app-rounds',
  templateUrl: './rounds.component.html',
  standalone: true,
  imports: [IonIcon, RouterLink],
})
export class RoundsPage {
  constructor() {
    addIcons({
      add,
    });
  }
}
