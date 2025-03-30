import { VehiculeListComponent } from './vehicule-list/vehicule-list/vehicule-list.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutingModule } from './user-routing.module';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { FormsModule } from '@angular/forms'; 


@NgModule({
  declarations: [
    VehiculeListComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    AccordionModule.forRoot(),
    FormsModule
  ]
})
export class UserModule { }
