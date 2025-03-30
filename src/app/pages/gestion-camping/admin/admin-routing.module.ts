import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CampingComponent} from "../owner/camping/camping.component";

const routes: Routes = [
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
