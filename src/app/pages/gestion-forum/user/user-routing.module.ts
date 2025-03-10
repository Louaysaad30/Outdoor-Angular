import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ForumDetailComponent} from "./forumDetail/forumDetail.component";
import {ForumPostComponent} from "./forum-post/forum-post.component";

const routes: Routes = [
  {path:"forumDetail",component:ForumDetailComponent},
  {path:"forumPost",component:ForumPostComponent},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
