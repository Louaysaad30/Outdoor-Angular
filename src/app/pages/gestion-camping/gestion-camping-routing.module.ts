import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LeafletComponent} from "../maps/leaflet/leaflet.component";
import {AdminModule} from "./admin/admin.module";

const routes: Routes = [
  {  path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},
  {  path: 'user', loadChildren: () => import('./user/user.module').then(m => m.UserModule)},
  {  path: 'owner', loadChildren: () => import('./owner/owner.module').then(m => m.OwnerModule)}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionCampingRoutingModule { }
