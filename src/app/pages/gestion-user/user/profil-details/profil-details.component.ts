import { Component } from '@angular/core';
import { SharedModule } from "../../../../shared/shared.module";
import { TabsModule } from 'ngx-bootstrap/tabs';

import { SimplebarAngularModule } from "simplebar-angular";
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { AuthServiceService } from 'src/app/account/auth/services/auth-service.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-profil-details',
  standalone: true,
 imports: [
    TabsModule,
    SharedModule,
  ],
     templateUrl: './profil-details.component.html',
  styleUrl: './profil-details.component.scss'
})
export class ProfilDetailsComponent {
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  currentUser: any;
  constructor(private authService: AuthServiceService,private router: Router) {}

  goToEditProfile() {
    this.router.navigate(['/userfront/user/editProfile']);
  }
  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    if (!this.currentUser) {
      // Si l'utilisateur n'est pas connecté, redirigez-le vers la page de connexion
      console.log("No user found in session.");
    }
    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: 'Pages', active: true },
      { label: 'Profile', active: true }
    ];
  }

  // follow button toggle
  Followbtn(ev: any) {
    ev.target.closest('button').classList.toggle('active')
  }
}
