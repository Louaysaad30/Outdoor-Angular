import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormationListComponent } from './formation-list/formation-list.component';
import { CategorieListComponent } from './categorie-list/categorie-list.component';

const routes: Routes = [
  { path: 'formation-list', component: FormationListComponent },
  { path: 'categorie-list', component: CategorieListComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
