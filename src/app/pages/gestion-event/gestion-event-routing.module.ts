import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '../../account/auth/core/guards/role.guard';

const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [roleGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule),
    canActivate: [roleGuard],
    data: { role: 'USER' }
  },
  {
    path: 'event-manager',
    loadChildren: () => import('./event-manager/event-manager.module').then(m => m.EventManagerModule),
    canActivate: [roleGuard],
    data: { role: 'EVENT_MANAGER' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionEventRoutingModule { }
