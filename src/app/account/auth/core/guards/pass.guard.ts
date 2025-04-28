import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PassGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if user data exists in localStorage
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!user) {
      // User not logged in -> redirect to login page
      this.router.navigate(['/auth/signin'], { 
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // User is logged in
    return true;
  }
}