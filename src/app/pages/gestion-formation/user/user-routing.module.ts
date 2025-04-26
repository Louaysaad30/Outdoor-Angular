import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormationFrontOfficeComponent } from './formation-front-office/formation-front-office.component';
import { FormationDetailsComponent } from './formation-details/formation-details.component';

const routes: Routes = [
  { path: 'formation', component: FormationFrontOfficeComponent },
  { path: 'formation/details/:id', component: FormationDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
