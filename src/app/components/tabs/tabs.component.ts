import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { NgIcon } from '@ng-icons/core';

/**
 * Component representing the main tabs container.
 */
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, NgIcon],
})
export class TabsComponent {}
