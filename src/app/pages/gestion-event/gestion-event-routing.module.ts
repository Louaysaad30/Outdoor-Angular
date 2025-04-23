import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from 'src/app/account/auth/core/guards/role.guard';

const routes: Routes = [
  {  path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},
  {  path: 'user', loadChildren: () => import('./user/user.module').then(m => m.UserModule),canActivate: [ roleGuard] ,  data: { roles: ['USER'] } },
  {  path: 'event-manager', loadChildren: () => import('././event-manager/event-manager.module').then(m => m.EventManagerModule),canActivate: [ roleGuard] ,  data: { roles: ['EVENT-MANAGER'] } }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionEventRoutingModule { }
