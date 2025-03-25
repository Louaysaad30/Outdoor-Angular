import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ForumDetailComponent} from "./forumDetail/forumDetail.component";
import {ForumPostComponent} from "./forum-post/forum-post.component";
import {AddPostComponent} from "./add-post/add-post.component";

const routes: Routes = [
  {path:"forumdetail",component:ForumDetailComponent},
  {path:"forumpost",component:ForumPostComponent},
  {path:"addPost",component:AddPostComponent},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
