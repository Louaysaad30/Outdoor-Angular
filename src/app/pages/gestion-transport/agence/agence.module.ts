import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgenceRoutingModule } from './agence-routing.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AddVehiculeComponent } from './add-vehicule/add-vehicule.component';
import { ListVehiculeAgenceComponent } from './list-vehicule-agence/list-vehicule-agence.component';
import { UpdateVehiculeComponent } from './update-vehicule/update-vehicule.component';


@NgModule({
  declarations: [
    AddVehiculeComponent,
    ListVehiculeAgenceComponent,
    UpdateVehiculeComponent
  ],
  imports: [
    CommonModule,
    AgenceRoutingModule, 
    FormsModule,
    ReactiveFormsModule,
    
    
  ]
})
export class AgenceModule {
    
 }