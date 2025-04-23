import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {EventListComponent} from "../admin/event-list/event-list.component";
import {EmEventListComponent} from "./em-event-list/em-event-list.component";
import {EventAreaListComponent} from "../admin/event-area-list/event-area-list.component";
import {EmEventareaListComponent} from "./em-eventarea-list/em-eventarea-list.component";
import {EventAreaDetailsComponent} from "../admin/event-area-details/event-area-details.component";
import {EmEventareaDetailsComponent} from "./em-eventarea-details/em-eventarea-details.component";
import {TicketListComponent} from "../admin/ticket-list/ticket-list.component";
import {EmTicketListComponent} from "./em-ticket-list/em-ticket-list.component";

const routes: Routes = [
  {path : 'event-area-list',component : EmEventareaListComponent},
  {path : 'event-area-details/:id',component : EmEventareaDetailsComponent},
  {path : 'event-list',component : EmEventListComponent},
  {path : 'ticket-list',component : EmTicketListComponent},


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventManagerRoutingModule { }
