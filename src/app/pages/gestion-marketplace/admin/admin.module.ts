import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { DropzoneModule } from 'ngx-dropzone-wrapper';
import { NgSelectModule } from '@ng-select/ng-select';
import { AddProductComponent } from './add-product/add-product.component';
import { AddProductCodeComponent } from './add-product-code/add-product-code.component';
import { AddPCategoryComponent } from './add-pcategory/add-pcategory.component';


@NgModule({
  declarations: [AddProductComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    CKEditorModule,
    NgSelectModule,
    DropzoneModule,
    ReactiveFormsModule,
    AddProductCodeComponent,
    AddPCategoryComponent


  ]
})
export class AdminModule { }
