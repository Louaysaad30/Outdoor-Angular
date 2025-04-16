import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { MarketPlaceComponent } from './market-place/market-place.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { DropzoneModule } from 'ngx-dropzone-wrapper';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { CartComponent } from './cart/cart.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { AlertModule } from 'ngx-bootstrap/alert';
import { OrderOverviewComponent } from './order-overview/order-overview.component';
import { saveAs } from 'file-saver';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { SlickCarouselModule } from 'ngx-slick-carousel';

@NgModule({
  declarations: [MarketPlaceComponent,CartComponent,CheckoutComponent,OrderOverviewComponent,ProductDetailsComponent],
  imports: [
    CommonModule,
    UserRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CKEditorModule,
    NgSelectModule,
    DropzoneModule,
    RouterModule,
    BsDropdownModule.forRoot(),
    PaginationModule.forRoot(),
    ModalModule.forRoot(),
    AccordionModule.forRoot(),
    NgxSliderModule,
    AlertModule.forRoot(),
    SlickCarouselModule


  ]
})
export class UserModule { }
