import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

import { GestionFormationRoutingModule } from './gestion-formation-routing.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    GestionFormationRoutingModule,
    BsDropdownModule.forRoot()
  ]
})
export class GestionFormationModule { }
