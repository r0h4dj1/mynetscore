import { Routes } from '@angular/router';
import { TabsComponent } from './components/tabs/tabs.component';

export const routes: Routes = [
  {
    path: '',
    component: TabsComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomePage),
      },
      {
        path: 'rounds',
        loadComponent: () => import('./pages/rounds/rounds.component').then((m) => m.RoundsPage),
      },
      {
        path: 'rounds/add',
        loadComponent: () => import('./pages/add-round/add-round.component').then((m) => m.AddRoundPage),
      },
      {
        path: 'rounds/:id/edit',
        loadComponent: () => import('./pages/edit-round/edit-round.component').then((m) => m.EditRoundPage),
      },
      {
        path: 'courses',
        loadComponent: () => import('./pages/courses/courses.component').then((m) => m.CoursesPage),
      },
      {
        path: 'courses/:id',
        loadComponent: () => import('./pages/course-detail/course-detail.component').then((m) => m.CourseDetailPage),
      },
    ],
  },
];
