import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CampingfrontComponent} from "./campingfront/campingfront.component";
import {DetailCentreComponent} from "./detail-centre/detail-centre.component";
import {MesReservationComponent} from "./mes-reservation/mes-reservation.component";

const routes: Routes = [
  {path:"camping",component:CampingfrontComponent},
  { path: "camping/detail/:id", component:DetailCentreComponent  },
  {path:"myReservation",component:MesReservationComponent}



];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
