import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

/**
 * Component representing the rounds page.
 */
@Component({
  selector: 'app-rounds',
  host: { class: 'block h-full' },
  templateUrl: './rounds.component.html',
  standalone: true,
  imports: [NgIcon, RouterLink],
})
export class RoundsPage {}
