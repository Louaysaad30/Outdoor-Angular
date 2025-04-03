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
        if (!panier || !panier.idPanier) {
          return of([] as LigneCommande[]);
        }

        return this.ligneCommandeService.getLigneCommandesByPanierId(panier.idPanier).pipe(
          tap(lignes => {
            console.log('Raw lignes:', lignes);
            lignes.forEach(ligne => console.log('Ligne structure:', JSON.stringify(ligne, null, 2)));
          }),
          switchMap(lignes =>
            // Get all products first
            this.productService.getAllProducts().pipe(
              tap(products => console.log('Available products:', products)),
              map(products => {
                return lignes
                  .map(ligne => {
                    // Match products based on the ligne commande ID and product mapping
                    const productMapping = {
                      21: 69, // ligne ID -> product ID
                      22: 71,
                      23: 72
                    };
                    const targetProductId = ligne.idLigneCommande !== undefined ? productMapping[ligne.idLigneCommande as keyof typeof productMapping] : undefined;
                    console.log(`Mapping ligne ${ligne.idLigneCommande} to product ${targetProductId}`);

                    const product = products.find(p => p.idProduit === targetProductId);
                    console.log('Found product:', product);

                    if (!product) {
                      console.log(`No product found for ligne ${ligne.idLigneCommande}`);
                      return null;
                    }

                    return {
                      idLigneCommande: ligne.idLigneCommande,
                      quantite: ligne.quantite,
                      prix: ligne.prix,
                      produit: product,
                      panier: panier
                    } as LigneCommande;
                  })
                  .filter((ligne): ligne is LigneCommande => ligne !== null);
              })
            )
          )
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
    this.subtotal = this.cartData.reduce((sum, item) =>
      sum + (item.quantite * item.produit.prixProduit), 0);
    this.tax = this.subtotal * 0.18;
    this.totalprice = this.subtotal + this.shippingRate + this.tax;
    console.log('Totals calculated:', {
      subtotal: this.subtotal,
      tax: this.tax,
      total: this.totalprice
    }); // Debug log
  }

  updateCartTotals(): void {
    this.calculateTotals();
  }
}
