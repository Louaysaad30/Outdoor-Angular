import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {MesPostsComponent} from "../user/mes-posts/mes-posts.component";
import {PostsComponent} from "./posts/posts.component";
import {PostdetailComponent} from "./postdetail/postdetail.component";
import {DashboardForumComponent} from "./dashboard-forum/dashboard-forum.component";
const routes: Routes = [
  {path:"posts",component:PostsComponent},
  {path: "postdetail/:id", component: PostdetailComponent},
  {path:"DashboardForum",component:DashboardForumComponent}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
