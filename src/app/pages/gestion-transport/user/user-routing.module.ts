import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VehiculeListComponent } from './vehicule-list/vehicule-list/vehicule-list.component';
import { VehiculeDetailsComponent } from './vehicule-details/vehicule-details.component';
import { LocationFormComponent } from './location-form/location-form.component';
import { ReservationsComponent } from './reservations/reservations.component';

const routes: Routes = [
  { path: 'vehicule-list', component: VehiculeListComponent } ,
  { path: 'detail-vehicule/:id', component: VehiculeDetailsComponent },
  { path: 'reservation/:id', component: LocationFormComponent },
  {path: 'reservations', component: ReservationsComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
