import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilDetailsComponent } from './profil-details/profil-details.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { ChatConvComponent } from './chat-conv/chat-conv.component';

const routes: Routes = [
  {
    path:'profile',component:ProfilDetailsComponent
  },
  {
    path:'editProfile',component:EditProfileComponent
  },
  {
    path:'chat',component:ChatConvComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
