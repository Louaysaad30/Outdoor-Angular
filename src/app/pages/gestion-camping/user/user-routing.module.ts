import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CampingfrontComponent} from "./campingfront/campingfront.component";

const routes: Routes = [
  {path:"camping",component:CampingfrontComponent},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
