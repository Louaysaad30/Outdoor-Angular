import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { AddPostComponent } from "./add-post/add-post.component";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [
      // Add this line to declare the component
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    FormsModule,
  ]
})
export class UserModule { }
