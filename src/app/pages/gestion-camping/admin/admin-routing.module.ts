import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CampingComponent} from "./camping/camping.component";

const routes: Routes = [
  {path:"camping",component:CampingComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
