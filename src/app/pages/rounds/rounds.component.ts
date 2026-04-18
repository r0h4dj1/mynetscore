import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { NgIcon } from '@ng-icons/core';

/**
 * Component representing the rounds page.
 */
@Component({
  selector: 'app-rounds',
  host: { class: 'block h-full' },
  templateUrl: './rounds.component.html',
  standalone: true,
  imports: [NgIcon, RouterLink, PageHeaderComponent],
})
export class RoundsPage {}
