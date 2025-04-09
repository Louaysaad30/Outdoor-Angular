import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccountModule } from '../../account.module';
import { AuthServiceService } from '../services/auth-service.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AccountModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
    constructor(private authService: AuthServiceService, private router: Router) {}
    logout() {
      this.authService.logout();
      this.router.navigate(['/auth/logout']); // Redirect to login
    
  }
}