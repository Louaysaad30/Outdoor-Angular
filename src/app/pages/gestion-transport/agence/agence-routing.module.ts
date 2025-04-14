import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddVehiculeComponent } from './add-vehicule/add-vehicule.component'; 
import { ListVehiculeAgenceComponent } from './list-vehicule-agence/list-vehicule-agence.component';
import { UpdateVehiculeComponent } from './update-vehicule/update-vehicule.component';

const routes: Routes = [
  { path: 'vehicules/add', component: AddVehiculeComponent },
  { path: 'vehicules/list/agences/:agenceId', component: ListVehiculeAgenceComponent },
  { path: 'update-vehicule/:id', component: UpdateVehiculeComponent },



];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgenceRoutingModule { }