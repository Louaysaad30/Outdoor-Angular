import { Component, OnInit, ViewChild } from '@angular/core';
import { LigneCommande } from '../../models/LigneCommande';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { ProductService } from '../../services/product.service';
import { PanierService } from '../../services/panier.service';
import { of, EMPTY } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { Product } from '../../models/product';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { UpdateQuantiteDTO } from '../../models/DTO/UpdateQuantiteDTO';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
})
export class CartComponent implements OnInit {
  @ViewChild('deleteRecordModal') deleteRecordModal?: ModalDirective;
  private itemToDeleteId?: number;

  cartData: LigneCommande[] = [];
  subtotal: number = 0;
  flatFee: number = 1; // Add flat fee property
  totalprice: number = 0;
  userId: number = 1;

  constructor(
    private ligneCommandeService: LignedecommandeService,
    private productService: ProductService,
    private panierService: PanierService
  ) {}

  ngOnInit(): void {
    this.loadCartData();
  }

  loadCartData(): void {
    this.panierService.getPanierByUser(this.userId).pipe(
      tap(panier => console.log('Panier received:', panier)),
      switchMap(panier => {
        if (!panier?.idPanier) {
          return of([] as LigneCommande[]);
        }

        return this.ligneCommandeService.getLigneCommandesByPanierId(panier.idPanier).pipe(
          tap(lignes => {
            console.log('Raw lignes:', lignes);
            lignes.forEach(ligne => console.log('Ligne details:', ligne));
          }),
          switchMap(lignes => this.productService.getAllProducts().pipe(
            map(products => {
              console.log('Products loaded:', products);

              return lignes.map(ligne => {
                // First try exact price match
                let product = products.find(p => p.prixProduit === ligne.prix);

                if (!product) {
                  // If no exact match, try finding closest price match
                  product = products.reduce<Product | undefined>((closest, current) => {
                    const currentDiff = Math.abs(current.prixProduit - ligne.prix);
                    const closestDiff = closest ? Math.abs(closest.prixProduit - ligne.prix) : Infinity;
                    return currentDiff < closestDiff ? current : closest;
                  }, undefined);
                }

                console.log(`Found product for ligne ${ligne.idLigneCommande}:`, product);

                if (!product) {
                  console.warn(`No product found for ligne ${ligne.idLigneCommande}`);
                  return null;
                }

                const mappedLigne = new LigneCommande();
                mappedLigne.idLigneCommande = ligne.idLigneCommande;
                mappedLigne.quantite = ligne.quantite;
                mappedLigne.prix = ligne.prix;
                mappedLigne.produit = product;
                mappedLigne.panier = panier;
                mappedLigne.idProduit = product.idProduit;

                console.log('Mapped ligne with product:', mappedLigne);
                return mappedLigne;
              }).filter((ligne): ligne is LigneCommande => ligne !== null);
            })
          )),
          tap(mappedLignes => console.log('Final mapped lignes:', mappedLignes))
        );
      })
    ).subscribe({
      next: (lignes: LigneCommande[]) => {
        this.cartData = lignes;
        console.log('Final cart data:', this.cartData);
        this.calculateTotals();
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.cartData = [];
        this.calculateTotals();
      }
    });
  }

  calculateQty(type: string, currentQty: number, index: number): void {
    let newQty = currentQty;

    if (type === '0' && currentQty > 1) {
      newQty = currentQty - 1;
    } else if (type === '1') {
      newQty = currentQty + 1;
    }

    if (newQty !== currentQty && this.cartData[index]) {
      const ligne = this.cartData[index];

      // Temporarily update quantity to calculate new total
      const originalQty = this.cartData[index].quantite;
      this.cartData[index].quantite = newQty;
      this.calculateTotals();

      const updateDto: UpdateQuantiteDTO = {
        idLigneCommande: ligne.idLigneCommande!,
        quantite: newQty,
        idPanier: ligne.panier?.idPanier!,
        total: this.subtotal // Send subtotal instead of totalprice to database
      };

      // Restore original quantity until server confirms update
      this.cartData[index].quantite = originalQty;

      this.ligneCommandeService.updateLigneCommande(updateDto).pipe(
        tap(updatedLigne => {
          if (updatedLigne && updatedLigne.quantite) {
            this.cartData[index].quantite = updatedLigne.quantite;
            this.calculateTotals();
          }
        }),
        catchError(error => {
          console.error('Error updating quantity and total:', error);
          this.calculateTotals();
          return EMPTY;
        })
      ).subscribe();
    }
  }

  deleteLigneCommande(id: number | undefined): void {
    if (!id) {
      console.error('Cannot delete ligne commande: ID is undefined');
      return;
    }
    this.itemToDeleteId = id;
    this.deleteRecordModal?.show();
  }

  confirmDelete(): void {
    if (!this.itemToDeleteId) return;

    this.ligneCommandeService.deleteLigneCommande(this.itemToDeleteId).pipe(
      tap(() => {
        this.cartData = this.cartData.filter(item => item.idLigneCommande !== this.itemToDeleteId);
        this.calculateTotals();
        this.deleteRecordModal?.hide();
        this.itemToDeleteId = undefined;
      }),
      catchError(error => {
        console.error('Error deleting item:', error);
        alert('Failed to remove item from cart. Please try again.');
        return EMPTY;
      })
    ).subscribe();
  }

  private calculateTotals(): void {
    this.subtotal = this.cartData.reduce((sum, item) =>
        sum + (item.produit.prixProduit * item.quantite), 0);
    // Only store subtotal in database, but display total with fee in UI
    this.totalprice = this.subtotal;

    console.log('Totals calculated:', {
        subtotal: this.subtotal,
        total: this.totalprice
    });
  }

  updateCartTotals(): void {
    this.calculateTotals();
  }

  // Add method to get display total (for UI only)
  getDisplayTotal(): number {
    return this.totalprice + this.flatFee;
  }
}
