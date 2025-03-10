import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GestionCampingRoutingModule } from './gestion-camping-routing.module';
import {AdminModule} from "./admin/admin.module";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    GestionCampingRoutingModule,
    AdminModule,

  ]
})
export class GestionCampingModule { }
