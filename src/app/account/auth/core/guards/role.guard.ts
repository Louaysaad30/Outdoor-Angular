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
      // Utilisateur non connecté → redirection vers login
      this.router.navigate(['/auth/signin'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Rôle requis défini dans la route
    const requiredRole = route.data['role'];
    const userRole = user.authorities[0]?.authority;

    if (userRole !== requiredRole) {
      // Rôle incorrect → redirection vers une page d'erreur
      this.router.navigate(['/auth/errors/503']); // ou '404' ou autre selon ce que tu veux
      return false;
    }

    return true; // L'utilisateur a le bon rôle
  }
}
