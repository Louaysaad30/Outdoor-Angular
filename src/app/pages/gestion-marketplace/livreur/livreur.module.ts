import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LivreurRoutingModule } from './livreur-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrderListComponent } from './order-list/order-list.component';




@NgModule({
  declarations: [OrderListComponent],
  imports: [
    CommonModule,
    LivreurRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class LivreurModule { }
