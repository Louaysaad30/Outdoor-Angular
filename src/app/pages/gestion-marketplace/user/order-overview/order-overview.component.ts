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
import { Status } from '../../models/Status';
import { ToastrService } from 'ngx-toastr'; // Add this import

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
    private productService: ProductService,
    private toastr: ToastrService // Add this injection
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
            .filter(order => order.userId === this.userId && order.etat === Status.IN_PROGRESS)
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

  // Keep only this method and remove downloadOrderInvoice method
  downloadInvoice(orderId: number | undefined, event?: Event): void {
    // Prevent default action only if event is provided
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!orderId) {
      this.toastr.error('Order ID is missing. Cannot download invoice.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.checkoutService.downloadInvoice(orderId).subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;

        // Check if the blob is of PDF type
        if (blob.type === 'application/pdf' || blob.size > 100) {
          // Save the file using FileSaver.js
          saveAs(blob, `facture_${orderId}.pdf`);

          this.toastr.success('Invoice downloaded successfully');
        } else {
          // Handle case where response isn't a valid PDF
          console.error('Invalid PDF response:', blob);
          this.errorMessage = 'The downloaded file is not a valid PDF. Please contact support.';
          this.toastr.error('Downloaded file is not a valid PDF');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error downloading invoice:', error);
        this.errorMessage = 'Failed to download invoice. Please try again later.';
        this.toastr.error('Failed to download invoice');
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

  generateQRCodeUrl(order: any): string {
    if (!order || !order.idCommande) {
      return 'assets/images/placeholder-qr.png'; // Provide a fallback image
    }

    // Create content string with order details
    const qrContent = this.generateQrContent(order);

    // Encode the content for URL
    const encodedContent = encodeURIComponent(qrContent);

    // Use Google Charts API to generate QR code
    return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodedContent}&choe=UTF-8&chld=H|1`;
  }

  generateQrContent(order: any): string {
    // Create a well-structured object with clear labels and formatting
    const qrData = {
      "Invoice ID": order.idCommande,
      "Order #": order.OrderNumber,
      "Date": new Date(order.dateCommande).toLocaleDateString(),
      "Total": `${order.montantCommande} TND`,
      "Status": order.etat,
      "Customer": order.nom,
      "Address": `${order.adresse}, ${order.city}, ${order.gouvernement}`,
      "Shipping": order.shippingMethod === "ExpressDelivery" ? "Express" : "Standard",
    };

    // Format with line breaks for better readability when scanned
    let formattedContent = "";
    for (const [key, value] of Object.entries(qrData)) {
      formattedContent += `${key}: ${value}\n`;
    }

    return formattedContent.trim();
  }

  generateScannable(order: any): string {
    if (!order) {
      return 'No order data available';
    }

    // Create a simple text format with line breaks for better readability when scanned
    const lines = [
      `Order ID: ${order.idCommande || 'N/A'}`,
      `Order #: ${order.OrderNumber || 'N/A'}`,
      `Date: ${order.dateCommande ? new Date(order.dateCommande).toLocaleDateString() : 'N/A'}`,
      `Customer: ${order.nom || 'N/A'}`,
      `Address: ${order.adresse || ''}, ${order.city || ''}, ${order.gouvernement || ''}`,
      `Amount: ${order.montantCommande ? order.montantCommande + ' TND' : 'N/A'}`,
      `Status: ${order.etat || 'Pending'}`
    ];

    // Join the lines with newline characters for better readability when scanned
    return lines.join('\n');
  }
}
