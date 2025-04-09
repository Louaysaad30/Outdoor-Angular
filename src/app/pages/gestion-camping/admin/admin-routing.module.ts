import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CampingComponent} from "../owner/camping/camping.component";
import {CampingAdminComponent} from "./camping-admin/camping-admin.component";

const routes: Routes = [
  {path:"camping",component:CampingAdminComponent},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
