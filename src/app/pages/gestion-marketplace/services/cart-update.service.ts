import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartUpdateService {
  // Subject qui émettra un événement quand le panier sera modifié
  private cartUpdateSource = new Subject<void>();

  // Observable auquel les composants peuvent souscrire
  cartUpdate$ = this.cartUpdateSource.asObservable();

  // Méthode pour signaler une mise à jour du panier
  triggerCartUpdate() {
    this.cartUpdateSource.next();
  }

  // Add to your CartUpdateService class
  private cartCount: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCount.asObservable();

  updateCartCount(count: number): void {
    this.cartCount.next(count);
  }
}
