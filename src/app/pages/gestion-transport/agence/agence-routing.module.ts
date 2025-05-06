import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddVehiculeComponent } from './add-vehicule/add-vehicule.component'; 
import { UpdateVehiculeComponent } from './update-vehicule/update-vehicule.component';
import { DashboardAgenceComponent } from './dashboard-agence/dashboard-agence.component';

const routes: Routes = [
  { path: '', component: DashboardAgenceComponent },
  { path: 'vehicules/add', component: AddVehiculeComponent },
  { path: 'update-vehicule/:id', component: UpdateVehiculeComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgenceRoutingModule { }

