import { Component, OnInit } from '@angular/core';
import { LigneCommande } from '../../models/LigneCommande';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { ProductService } from '../../services/product.service';
import { PanierService } from '../../services/panier.service';
import { of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
})
export class CartComponent implements OnInit {
  cartData: LigneCommande[] = [];
  subtotal: number = 0;
  shippingRate: number = 65;
  tax: number = 0;
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
            // Log each ligne's details for debugging
            lignes.forEach(ligne => console.log('Ligne details:', ligne));
          }),
          switchMap(lignes => this.productService.getAllProducts().pipe(
            map(products => {
              console.log('Products loaded:', products);

              // Map prix to potential product IDs
              const priceToProductMap = new Map(
                products.map(p => [p.prixProduit, p])
              );

              return lignes.map(ligne => {
                // Try to find product by matching prix
                const product = priceToProductMap.get(ligne.prix);
                console.log(`Matching product for ligne ${ligne.idLigneCommande} with prix ${ligne.prix}:`, product);

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

  calculateQty(action: string, currentQty: number, index: number): void {
    const ligne = this.cartData[index];
    if (!ligne) return;

    let newQuantity = currentQty;
    if (action === '0' && currentQty > 1) {
      newQuantity = currentQty - 1;
    } else if (action === '1' && currentQty < 100) {
      newQuantity = currentQty + 1;
    }

    if (newQuantity !== currentQty) {
      const updatedLigne = {
        ...ligne,
        quantite: newQuantity
      };

      this.ligneCommandeService.updateLigneCommande(updatedLigne).subscribe({
        next: (response) => {
          this.cartData[index].quantite = newQuantity;
          this.calculateTotals();
        },
        error: (error) => console.error('Error updating quantity:', error)
      });
    }
  }

  private calculateTotals(): void {
    this.subtotal = this.cartData.reduce((sum, item) => {
      if (!item.produit) return sum;
      return sum + (item.quantite * item.produit.prixProduit);
    }, 0);

    this.tax = this.subtotal * 0.18;
    this.totalprice = this.subtotal + this.shippingRate + this.tax;

    console.log('Totals calculated:', {
      subtotal: this.subtotal,
      tax: this.tax,
      total: this.totalprice
    });
  }

  updateCartTotals(): void {
    this.calculateTotals();
  }
}
