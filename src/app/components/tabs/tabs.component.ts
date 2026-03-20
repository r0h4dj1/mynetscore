import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, book, golf } from 'ionicons/icons';

/**
 * Component representing the main tabs container.
 */
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon],
})
export class TabsComponent {
  constructor() {
    addIcons({
      home,
      book,
      golf,
    });
  }
}
