import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormationListComponent } from './formation-list/formation-list.component';
import { CategorieListComponent } from './categorie-list/categorie-list.component';
import { SponsorListComponent } from './sponsor-list/sponsor-list.component';
import { ReservationListComponent } from './reservations-list/reservations-list.component';
import { FormateurDashboardComponent } from './formateur-dashboard/formateur-dashboard.component'; // ✅ ajouté

const routes: Routes = [
  // Pages pour ADMIN
  { path: 'formation-list', component: FormationListComponent },
  { path: 'categorie-list', component: CategorieListComponent },
  { path: 'sponsor-list', component: SponsorListComponent },
  { path: 'reservations-list', component: ReservationListComponent },

  // Page pour FORMATEUR
  { path: 'formateur-dashboard', component: FormateurDashboardComponent } 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
