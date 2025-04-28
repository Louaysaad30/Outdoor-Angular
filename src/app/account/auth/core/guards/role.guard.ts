import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class roleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!user) {
      this.router.navigate(['/auth/signin'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const requiredRole = route.data['role'];
    const userRole = user.authorities[0]?.authority;

    // Handle both array and single string role requirements
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        this.router.navigate(['/auth/errors/503']);
        return false;
      }
    } else {
      if (userRole !== requiredRole && userRole !== 'ADMIN') { // ADMIN can access everything
        this.router.navigate(['/auth/errors/503']);
        return false;
      }
    }

    return true;
  }
}
