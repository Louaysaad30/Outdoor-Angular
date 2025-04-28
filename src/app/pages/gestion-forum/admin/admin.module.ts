import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import {FlatpickrModule} from "angularx-flatpickr";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Page route
import { SharedModule } from 'src/app/shared/shared.module';

// Simplebar
import { SimplebarAngularModule } from 'simplebar-angular';

// Count To
import { CountUpModule } from 'ngx-countup';

// Flat Picker

// Apex Chart Package
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

// Leaflet map
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import {DashboardForumComponent} from "./dashboard-forum/dashboard-forum.component";

// component


@NgModule({
  declarations: [
    DashboardForumComponent,
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FlatpickrModule,
    CommonModule,
    SharedModule,
    BsDropdownModule,
    CountUpModule,
    NgApexchartsModule,
    TabsModule.forRoot(),
    TooltipModule.forRoot(),
    PaginationModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    SimplebarAngularModule,
    ProgressbarModule.forRoot(),
    LeafletModule,
    NgxEchartsModule.forRoot({ echarts }),
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    FlatpickrModule.forRoot()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminModule { }
