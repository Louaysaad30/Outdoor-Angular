import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserRoutingModule } from './user-routing.module';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    UserRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ToastrModule.forRoot(), 
  ]
})
export class UserModule { }
