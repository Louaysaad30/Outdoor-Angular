import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {EventListFrontOfficeComponent} from "./event-list-front-office/event-list-front-office.component";
import {EventDetailsFrontOfficeComponent} from "./event-details-front-office/event-details-front-office.component";
import {EventTicketsFrontOfficeComponent} from "./event-tickets-front-office/event-tickets-front-office.component";
import {UserReservationsComponent} from "./user-reservations/user-reservations.component";

const routes: Routes = [
  {path :'events' , component : EventListFrontOfficeComponent},
  {path :'events/:id' , component : EventDetailsFrontOfficeComponent},
  {path :'events/:id/tickets' , component : EventTicketsFrontOfficeComponent},
  {path :'reservations' , component : UserReservationsComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
