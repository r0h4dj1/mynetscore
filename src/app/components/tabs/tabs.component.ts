import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton } from '@ionic/angular/standalone';

/**
 * Component representing the main tabs container.
 */
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton],
})
export class TabsComponent {}
