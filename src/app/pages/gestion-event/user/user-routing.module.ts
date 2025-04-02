import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {EventListFrontOfficeComponent} from "./event-list-front-office/event-list-front-office.component";
import {EventDetailsFrontOfficeComponent} from "./event-details-front-office/event-details-front-office.component";

const routes: Routes = [
  {path :'events' , component : EventListFrontOfficeComponent},
  {path :'events/:id' , component : EventDetailsFrontOfficeComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
