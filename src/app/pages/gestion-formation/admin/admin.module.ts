import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { FormationListComponent } from './formation-list/formation-list.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module'; // Import shared module if app-breadcrumbs is part of it
import { ModalModule } from 'ngx-bootstrap/modal';
import { HttpClientModule } from '@angular/common/http';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';


@NgModule({
  declarations: [
    FormationListComponent // Declare the component here
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    BsDropdownModule.forRoot(), // Initialize dropdown module
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    HttpClientModule,
    ModalModule.forRoot() // Import ModalModule for ngx-bootstrap
    // Ensure this contains app-breadcrumbs if needed
  ]
})
export class AdminModule { }