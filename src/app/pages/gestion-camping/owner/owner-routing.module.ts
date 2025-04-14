import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CampingComponent} from "./camping/camping.component";
import {DeatilCentreComponent} from "./deatil-centre/deatil-centre.component";

const routes: Routes = [
  {path:"camping",component:CampingComponent},
  { path: "camping/detail/:id", component: DeatilCentreComponent }


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OwnerRoutingModule { }
