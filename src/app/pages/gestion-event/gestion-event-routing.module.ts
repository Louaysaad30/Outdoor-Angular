import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {  path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},
  {  path: 'user', loadChildren: () => import('./user/user.module').then(m => m.UserModule)},
  {  path: 'event-manager', loadChildren: () => import('././event-manager/event-manager.module').then(m => m.EventManagerModule)}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionEventRoutingModule { }
