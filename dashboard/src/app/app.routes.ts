import { Routes } from '@angular/router';
import { LoginComponent  } from './auth/login.component';
import { authGuard } from './core/auth.guard';
import { DashboardLayoutComponent } from './layout/dashboard-layout.component';
import { TasksComponent } from './tasks/tasks.component';
import { ComingSoonComponent } from './coming-soon.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent  },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      { path: 'tasks', component: TasksComponent },
    ]
  },
  { path: 'files', component: ComingSoonComponent, canActivate: [authGuard] },
  { path: 'settings', component: ComingSoonComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
