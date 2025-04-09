import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import {FlatpickrModule} from "angularx-flatpickr";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FlatpickrModule.forRoot()

  ]
})
export class AdminModule { }
