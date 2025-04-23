import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgenceRoutingModule } from './agence-routing.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AddVehiculeComponent } from './add-vehicule/add-vehicule.component';
import { UpdateVehiculeComponent } from './update-vehicule/update-vehicule.component';
import { DashboardAgenceComponent } from './dashboard-agence/dashboard-agence.component';
import { HttpClientModule } from '@angular/common/http';
import { CountUpModule } from 'ngx-countup';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxEchartsModule } from 'ngx-echarts';
import { FlatpickrModule } from 'angularx-flatpickr';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';




@NgModule({
  declarations: [
    AddVehiculeComponent,
    UpdateVehiculeComponent,
    DashboardAgenceComponent,
  ],
  imports: [
    CommonModule,
    AgenceRoutingModule, 
    FormsModule,
    ReactiveFormsModule, 
    HttpClientModule,
    SharedModule,
    BsDropdownModule,
    CountUpModule,
    PaginationModule.forRoot(),
    ProgressbarModule.forRoot(),
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
    NgApexchartsModule,
    FlatpickrModule.forRoot(),
    NgbPaginationModule    
  ]
})
export class AgenceModule {
    
 }
