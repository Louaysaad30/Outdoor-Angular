import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilDetailsComponent } from './profil-details/profil-details.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';

const routes: Routes = [
  {
    path:'profile',component:ProfilDetailsComponent
  },
  {
    path:'editProfile',component:EditProfileComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
