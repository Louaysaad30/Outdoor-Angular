import { NgModule } from '@angular/core';
  import { RouterModule, Routes } from '@angular/router';

// Component
import { LayoutComponent } from './layouts/layout.component';
import { AuthlayoutComponent } from './authlayout/authlayout.component';
import { authGuard } from './account/auth/core/guards/auth.guard';
import { roleGuard } from './account/auth/core/guards/role.guard';
import { AuthGuard } from './core/guards/auth.guard';
import {LayoutsUserComponent} from "./layouts-user/layouts-user.component";
import { Error404Component } from './account/auth/errors/error404/error404.component';

const routes: Routes = [
  { path: '', redirectTo: 'auth/signin', pathMatch: 'full' },
  { path: 'auth', component: AuthlayoutComponent, loadChildren: () => import('./account/account.module').then(m => m.AccountModule), canActivate: [authGuard] },
  { path: 'pages',component: AuthlayoutComponent, loadChildren: () => import('./extraspages/extraspages.module').then(m => m.ExtraspagesModule)},
  { path: 'userback', component: LayoutComponent, loadChildren: () => import('./pages/gestion-user/gestion-user.module').then(m => m.GestionUserModule) ,  canActivate: [ roleGuard] ,  data: { role: 'ADMIN' }},
  { path: 'userfront', component: LayoutsUserComponent, loadChildren: () => import('./pages/gestion-user/gestion-user.module').then(m => m.GestionUserModule) ,  canActivate: [ roleGuard] ,  data: { roles: ['USER', 'AGENCE'] }},
  { path: 'campingback', component: LayoutComponent, loadChildren: () => import('./pages/gestion-camping/gestion-camping.module').then(m => m.GestionCampingModule)  },
  { path: 'campingfront', component: LayoutsUserComponent, loadChildren: () => import('./pages/gestion-camping/gestion-camping.module').then(m => m.GestionCampingModule)  },
  { path: 'forumback', component: LayoutComponent, loadChildren: () => import('./pages/gestion-forum/gestion-forum.module').then(m => m.GestionForumModule) ,  canActivate: [ roleGuard] ,  data: { role: 'ADMIN' }  },
  { path: 'forumfront', component: LayoutsUserComponent, loadChildren: () => import('./pages/gestion-forum/gestion-forum.module').then(m   => m.GestionForumModule)  },
  { path: 'eventback', component: LayoutComponent, loadChildren: () =>import('./pages/gestion-event/gestion-event.module').then( m   => m.GestionEventModule)  },
  { path: 'eventfront', component: LayoutsUserComponent, loadChildren: () => import('./pages/gestion-event/gestion-event.module').then( m   => m.GestionEventModule)  ,  canActivate: [ roleGuard] ,  data: { roles: ['USER'] } },
  { path: 'formationback', component: LayoutComponent, loadChildren: () =>import('./pages/gestion-formation/gestion-formation.module').then( m   => m.GestionFormationModule)  },
  { path: 'formationfront', component: LayoutsUserComponent, loadChildren: () => import('./pages/gestion-formation/gestion-formation.module').then( m   => m.GestionFormationModule)  },
  { path: 'marketplaceback', component: LayoutComponent, loadChildren: () =>import('./pages/gestion-marketplace/gestion-marketplace.module').then( m   => m.GestionMarketplaceModule)  },
  { path: 'marketplacefront', component: LayoutsUserComponent, loadChildren: () => import('./pages/gestion-marketplace/gestion-marketplace.module').then( m   => m.GestionMarketplaceModule)  },
  { path: 'transportback', component: LayoutComponent, loadChildren: () =>import('./pages/gestion-transport/gestion-transport.module').then( m   => m.GestionTransportModule)  },
  { path: 'transportfront', component: LayoutsUserComponent, loadChildren: () => import('./pages/gestion-transport/gestion-transport.module').then( m   => m.GestionTransportModule)  },
  { path: '**', component: Error404Component }


  @NgModule({
    imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }
