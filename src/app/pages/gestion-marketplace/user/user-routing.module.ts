import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MarketPlaceComponent } from './market-place/market-place.component';
import { CartComponent } from './cart/cart.component';

const routes: Routes = [
  {path:'market-place',component:MarketPlaceComponent},
  {path:'cart',component:CartComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
