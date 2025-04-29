import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = new Router(); // Créer une instance de Router (si nécessaire)

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (user && user.authorities?.length > 0) {
    const role = user.authorities[0].authority;

    // Redirection basée sur le rôle
    if (role === 'ADMIN') {
      router.navigate(['/userback']);
    } else if (role === 'USER') {
      //achanger landing pages
      router.navigate(['/forumfront/user/forumPost']);
    } else if (role === 'AGENCE') {
      router.navigate(['/transportback']);
    } else if (role === 'OWNER') {
      router.navigate(['/campingback']);
    } else if (role === 'FORMATEUR') {
      router.navigate(['/formationback']);
    } else if (role === 'EVENT_MANAGER') {
      router.navigate(['/eventback/event-manager']);
    } else if (role === 'LIVREUR') {
      router.navigate(['/marketplaceback/livreur/orders']);
    } else {
      router.navigate(['/auth/signin']);
    }
    
    return false; // Empêche l'accès si l'utilisateur est connecté
  }
  
  return true; // Permet l'accès si l'utilisateur n'est pas connecté
};
