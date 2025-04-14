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
  currentUser: any ;

  constructor(
    private ligneCommandeService: LignedecommandeService,
    private productService: ProductService,
    private panierService: PanierService
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    this.loadCartData();
  }

  /**
   * Loads cart data for the current user, including product details
   */
  loadCartData(): void {
    // Step 1: Get the user's cart (panier)
    this.panierService.getPanierByUser(this.currentUser.id).pipe(
      catchError(error => {
        console.error('Error fetching user cart:', error);
        return of(null);
      }),

      // Step 2: Get ligne commandes associated with the cart
      switchMap(panier => {
        if (!panier?.idPanier) {
          console.log('No cart found for user or empty cart');
          return of([] as LigneCommande[]);
        }

        return this.ligneCommandeService.getLigneCommandesByPanierId(panier.idPanier).pipe(
          catchError(error => {
            console.error(`Error fetching ligne commandes for panier ${panier.idPanier}:`, error);
            return of([] as LigneCommande[]);
          }),

          // Step 3: Load product data to enrich the cart items
          switchMap(lignes => {
            if (lignes.length === 0) {
              return of([] as LigneCommande[]);
            }

            return this.productService.getAllProducts().pipe(
              catchError(error => {
                console.error('Error fetching products:', error);
                return of([] as Product[]);
              }),

              // Step 4: Map ligne commandes to include product details
              map(products => this.mapLigneCommandesToProducts(lignes, products, panier))
            );
          })
        );
      })
    ).subscribe({
      next: (enrichedCartItems: LigneCommande[]) => {
        this.cartData = enrichedCartItems;
        this.calculateTotals();
        console.log('Cart loaded successfully with', enrichedCartItems.length, 'items');
      },
      error: (error) => {
        console.error('Unexpected error in cart data loading:', error);
        this.cartData = [];
        this.calculateTotals();
      }
    });
  }

  /**
   * Maps ligne commande objects to include their associated product data
   */
  private mapLigneCommandesToProducts(
    lignes: LigneCommande[],
    products: Product[],
    panier: any
  ): LigneCommande[] {
    return lignes
      .map(ligne => {
        // Create a new ligne commande with basic information
        const mappedLigne = new LigneCommande();
        mappedLigne.idLigneCommande = ligne.idLigneCommande;
        mappedLigne.quantite = ligne.quantite;
        mappedLigne.prix = ligne.prix;
        mappedLigne.panier = panier;

        // Find associated product using different strategies
        const product = this.findProductForLigne(ligne, products);

        if (product) {
          mappedLigne.produit = product;
          mappedLigne.idProduit = product.idProduit;
          return mappedLigne;
        }

        console.error(`Could not associate a product with ligne ${ligne.idLigneCommande}`);
        return null;
      })
      .filter((ligne): ligne is LigneCommande => ligne !== null);
  }

  /**
   * Finds the corresponding product for a ligne commande using multiple strategies
   */
  private findProductForLigne(ligne: any, products: Product[]): Product | null {
    // Strategy 1: Use embedded product if available
    if (ligne.produit) {
      console.log(`Using embedded product for ligne ${ligne.idLigneCommande}`);
      return ligne.produit;
    }

    // Strategy 2: Match by product ID if available
    if (ligne.idProduit) {
      const productById = products.find(p => p.idProduit === ligne.idProduit);
      if (productById) {
        console.log(`Found product for ligne ${ligne.idLigneCommande} by ID`);
        return productById;
      }
    }

    // Strategy 3: Check for product ID in nested product object
    if (ligne.produit?.idProduit) {
      const productByNestedId = products.find(p => p.idProduit === ligne.produit.idProduit);
      if (productByNestedId) {
        console.log(`Found product by nested product ID for ligne ${ligne.idLigneCommande}`);
        return productByNestedId;
      }
    }

    // Strategy 4: Multi-attribute matching as last resort
    const potentialMatches = products.filter(p => {
      let matchScore = 0;

      // Price match (weight: medium)
      if (p.prixProduit === ligne.prix) matchScore += 2;

      // Name match if available (weight: high)
      if (ligne.nomProduit && p.nomProduit &&
          p.nomProduit.toLowerCase().includes(ligne.nomProduit.toLowerCase())) {
        matchScore += 3;
      }

      // Description match if available (weight: medium)
      if (ligne.descriptionProduit && p.descriptionProduit &&
          p.descriptionProduit.toLowerCase().includes(ligne.descriptionProduit.toLowerCase())) {
        matchScore += 2;
      }

      return matchScore >= 2; // Lower threshold for better matching chance
    });

    if (potentialMatches.length > 0) {
      console.log(`Found product for ligne ${ligne.idLigneCommande} using attribute matching`);
      return potentialMatches[0];
    }

    return null;
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
