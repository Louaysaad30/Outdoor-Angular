import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddProductComponent } from './add-product/add-product.component';
import { ProductListComponent } from './product-list/product-list.component';
import { OrdersComponent } from './orders/orders.component';

const routes: Routes = [{path:'add-product', component:AddProductComponent},
  {path:'productList',component:ProductListComponent},
  {path:'orders',component:OrdersComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
