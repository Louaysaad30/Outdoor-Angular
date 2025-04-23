import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {EventAreaListComponent} from "./event-area-list/event-area-list.component";
import {EventAreaDetailsComponent} from "./event-area-details/event-area-details.component";
import {EventListComponent} from "./event-list/event-list.component";
import {TicketListComponent} from "./ticket-list/ticket-list.component";
import {EventAreaApprovalComponent} from "./event-area-approval/event-area-approval.component";

const routes: Routes = [
  {path : 'event-area-list',component : EventAreaListComponent},
  {path : 'event-area-details/:id',component : EventAreaDetailsComponent},
  {path : 'event-list',component : EventListComponent},
  {path : 'ticket-list',component : TicketListComponent},
  {path : 'event-area-approval',component : EventAreaApprovalComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
