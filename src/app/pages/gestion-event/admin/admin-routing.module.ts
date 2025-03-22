import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {EventAreaListComponent} from "./event-area-list/event-area-list.component";
import {EventAreaDetailsComponent} from "./event-area-details/event-area-details.component";

const routes: Routes = [
  {path : 'event-area-list',component : EventAreaListComponent},
  {path : 'event-area-details/:id',component : EventAreaDetailsComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
