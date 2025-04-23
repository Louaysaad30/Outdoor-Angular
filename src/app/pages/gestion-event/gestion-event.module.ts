import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GestionEventRoutingModule } from './gestion-event-routing.module';
import {FlatpickrModule} from "angularx-flatpickr";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    GestionEventRoutingModule,
    FlatpickrModule.forRoot()

  ]
})
export class GestionEventModule { }
