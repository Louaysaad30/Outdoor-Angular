import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgenceRoutingModule } from './agence-routing.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AddVehiculeComponent } from './add-vehicule/add-vehicule.component';
import { ListVehiculeAgenceComponent } from './list-vehicule-agence/list-vehicule-agence.component';
import { UpdateVehiculeComponent } from './update-vehicule/update-vehicule.component';
import { AgenceReservationsComponent } from './agence-reservations/agence-reservations.component';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    AddVehiculeComponent,
    ListVehiculeAgenceComponent,
    UpdateVehiculeComponent,
    AgenceReservationsComponent
  ],
  imports: [
    CommonModule,
    AgenceRoutingModule, 
    FormsModule,
    ReactiveFormsModule, 
    HttpClientModule,
  ]
})
export class AgenceModule {
    
 }