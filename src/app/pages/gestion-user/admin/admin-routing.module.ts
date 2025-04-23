import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListUsersComponent } from './list-users/list-users.component';
import { StatisticsComponent } from './statistics/statistics.component';

const routes: Routes = [
  {path: 'list-users', component: ListUsersComponent},
  {path: 'statistics', component: StatisticsComponent},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
