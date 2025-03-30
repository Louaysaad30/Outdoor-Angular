import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VehiculeListComponent } from './vehicule-list/vehicule-list/vehicule-list.component';

const routes: Routes = [
  { path: 'vehicule-list', component: VehiculeListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
