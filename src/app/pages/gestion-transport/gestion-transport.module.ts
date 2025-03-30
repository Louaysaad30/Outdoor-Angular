import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserModule } from './user/user.module';
import { GestionTransportRoutingModule } from './gestion-transport-routing.module';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    GestionTransportRoutingModule,
    UserModule,
  ]
})
export class GestionTransportModule { }
