import { Component, OnInit } from '@angular/core';
import { CheckoutService } from '../../services/checkout.service';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { Commande } from '../../models/Commande';
import { LigneCommande } from '../../models/LigneCommande';
import { saveAs } from 'file-saver';
import { forkJoin } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';

interface OrderWithItems extends Commande {
  orderItems?: LigneCommande[];
  isLoadingItems?: boolean;
  showItems?: boolean;
}

@Component({
  selector: 'app-order-overview',
  templateUrl: './order-overview.component.html'
})
export class OrderOverviewComponent implements OnInit {
  userId: number = 1; // Static user ID for now
  orders: OrderWithItems[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private checkoutService: CheckoutService,
    private ligneCommandeService: LignedecommandeService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadUserOrders();
  }

  loadUserOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Use the specific method to get orders for this user with 'exist' status
    this.checkoutService.getCommandesByUserIdAndStatus(this.userId, 'exist')
      .subscribe({
        next: (orders: Commande[]) => {
          this.orders = orders.map(order => ({
            ...order,
            orderItems: [],
            isLoadingItems: true,
            showItems: true // Always show items
          }));

          if (this.orders.length > 0) {
            this.loadAllOrderItems();
          }

          console.log('User orders loaded:', this.orders);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.loadUserOrdersFallback();
        }
      });
  }

  loadUserOrdersFallback(): void {
    this.checkoutService.getAllCommandes()
      .subscribe({
        next: (allOrders: Commande[]) => {
          // Filter orders that belong to the current user and have 'exist' status
          this.orders = allOrders
            .filter(order => order.userId === this.userId && order.etat === 'exist')
            .map(order => ({
              ...order,
              orderItems: [],
              isLoadingItems: true,
              showItems: true // Always show items
            }));

          if (this.orders.length > 0) {
            this.loadAllOrderItems();
          }

          console.log('User orders loaded (fallback):', this.orders);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.errorMessage = 'Failed to load your orders. Please try again.';
          this.isLoading = false;
        }
      });
  }

  loadAllOrderItems(): void {
    // Process each order individually
    this.orders.forEach(order => {
      if (order.idCommande) {
        // First get the ligne commandes for this order
        this.ligneCommandeService.getByCommandeId(order.idCommande).pipe(
          tap(lignes => console.log(`Raw lignes for order ${order.idCommande}:`, lignes)),
          // Then load all products to map them to the ligne commandes
          switchMap(lignes => this.productService.getAllProducts().pipe(
            map(products => {
              console.log('Products loaded:', products);

              // Replace the existing mapping logic with this improved version
              return lignes.map(ligne => {
                // Create new ligne commande with basic data
                const mappedLigne = new LigneCommande();
                mappedLigne.idLigneCommande = ligne.idLigneCommande || ligne.id;
                mappedLigne.quantite = ligne.quantite;
                mappedLigne.prix = ligne.prix;
                mappedLigne.commande = order;

                let matchedProduct = null;

                // Strategy 1: Use embedded product if available (your backend seems to provide this)
                if (ligne.produit) {
                  console.log(`Using embedded product for ligne ${ligne.idLigneCommande}:`, ligne.produit);
                  matchedProduct = ligne.produit;
                }
                // Strategy 2: Match by product ID if available
                else if (ligne.idProduit) {
                  matchedProduct = products.find(p => p.idProduit === ligne.idProduit);
                  if (matchedProduct) {
                    console.log(`Found product for ligne ${ligne.idLigneCommande} by ID`);
                  }
                }
                // Strategy 3: Match by price as last resort
                else {
                  const priceMatches = products.filter(p => Math.abs(p.prixProduit - ligne.prix) < 0.001);
                  if (priceMatches.length === 1) {
                    matchedProduct = priceMatches[0];
                    console.log(`Found product for ligne ${ligne.idLigneCommande} by unique price match`);
                  } else if (priceMatches.length > 1) {
                    // Multiple products with same price, log and pick the first one
                    console.warn(`Multiple products with price ${ligne.prix} for ligne ${ligne.idLigneCommande}`, priceMatches);
                    matchedProduct = priceMatches[0];
                  }
                }

                // If we didn't find a product, create a placeholder
                if (!matchedProduct) {
                  console.warn(`No product found for ligne ${ligne.idLigneCommande || ligne.id}`);
                  matchedProduct = {
                    idProduit: -1 * (ligne.idLigneCommande || 0),
                    nomProduit: `Item (${ligne.prix} €)`,
                    prixProduit: ligne.prix,
                    descriptionProduit: 'Product information not available',
                    stockProduit: 0,
                    imageProduit: 'assets/images/placeholder-product.jpg'
                  } as Product;
                }

                // Assign the matched or placeholder product
                mappedLigne.produit = matchedProduct;
                mappedLigne.idProduit = matchedProduct.idProduit;

                return mappedLigne;
              }).filter((ligne): ligne is LigneCommande => ligne !== null);
            })
          ))
        ).subscribe({
          next: (items: LigneCommande[]) => {
            order.orderItems = items;
            order.isLoadingItems = false;
            console.log(`Loaded ${items.length} items for order ${order.idCommande}:`, items);
          },
          error: (error) => {
            console.error(`Error loading items for order ${order.idCommande}:`, error);
            order.isLoadingItems = false;
          }
        });
      } else {
        order.isLoadingItems = false;
      }
    });
  }

  calculateItemTotal(price: number, quantity: number): number {
    return price * quantity;
  }

  downloadInvoice(orderId: number): void {
    this.checkoutService.downloadInvoice(orderId).subscribe({
      next: (response: Blob) => {
        saveAs(response, `invoice-${orderId}.pdf`);
      },
      error: (error) => {
        console.error('Error downloading invoice:', error);
        this.errorMessage = 'Failed to download invoice. Please try again later.';
      }
    });
  }

  // Helper method to format shipping method display
  getShippingMethodDisplay(method: string): string {
    return method === 'ExpressDelivery' ? 'Express Delivery' : 'Standard Delivery';
  }

  // Add this helper method to calculate the total with extras
  calculateTotalWithExtras(order: Commande): number {
    // The montantCommande already includes all costs (shipping, service fee, etc.)
    return order.montantCommande || 0;
  }
}
