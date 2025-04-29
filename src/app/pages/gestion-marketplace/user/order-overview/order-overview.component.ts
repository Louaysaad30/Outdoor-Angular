import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
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
import { UpdateStateCommand } from '../../models/DTO/UpdateStateCommand';

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
  // Reference to the modal component
  @ViewChild('cancelOrderModal', { static: false }) cancelOrderModal?: ModalDirective;
  // Add this ViewChild reference
  @ViewChild('cannotCancelModal', { static: false }) cannotCancelModal?: ModalDirective;

  userId: number = 1; // Static user ID for now
  orders: OrderWithItems[] = [];
  cancelledOrders: OrderWithItems[] = [];
  deliveredOrders: OrderWithItems[] = []; // Add this line
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isCancellingOrder = false;
  selectedOrderId?: number;
  selectedOrderNumber?: string;
  selectedOrderDate?: Date;
  // Add a property to track if the order has a delivery person assigned
  selectedOrderHasDelivery = false;
  selectedOrder: any; // Replace with your Order type
  isDownloadingInvoice = false;

  // Variable pour suivre si un téléchargement est déjà en cours
  public downloadInProgress = false;

  constructor(
    private checkoutService: CheckoutService,
    private ligneCommandeService: LignedecommandeService,
    private productService: ProductService,
    private toastr: ToastrService // Add this injection
  ) {}

  ngOnInit(): void {
    this.loadUserOrders();
    // Add this line to load delivered orders when component initializes
    this.loadDeliveredOrders();
  }

  loadUserOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Use the specific method to get all orders for this user
    this.checkoutService.getCommandesByUserId(this.userId)
      .subscribe({
        next: (orders: Commande[]) => {
          // Separate orders by status
          const activeOrders = orders.filter(order => order.etat !== 'CANCELED' && order.etat !== 'DELIVERED');
          const cancelledOrders = orders.filter(order => order.etat === 'CANCELED');
          const deliveredOrders = orders.filter(order => order.etat === 'DELIVERED');

          // Process active orders
          this.orders = activeOrders.map(order => ({
            ...order,
            orderItems: [],
            isLoadingItems: true,
            showItems: true
          }));

          // Process cancelled orders with minimal data
          this.cancelledOrders = cancelledOrders.map(order => ({
            ...order,
            orderItems: [],
            isLoadingItems: false,
            showItems: false
          }));

          // Process delivered orders
          this.deliveredOrders = deliveredOrders.map(order => ({
            ...order,
            orderItems: [],
            isLoadingItems: false,
            showItems: false
          }));

          // Load items for active orders only
          if (this.orders.length > 0) {
            this.loadAllOrderItems();
          }

          // Optionally load minimal data for cancelled and delivered orders if needed
          if (this.cancelledOrders.length > 0) {
            this.loadCancelledOrdersBasicInfo();
          }

          if (this.deliveredOrders.length > 0) {
            this.loadDeliveredOrdersBasicInfo();
          }

          console.log('User orders loaded:', this.orders);
          console.log('Cancelled orders:', this.cancelledOrders);
          console.log('Delivered orders:', this.deliveredOrders);
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

  // Add this method to your component class
  cancelOrder(orderId: number): void {
    if (!orderId) {
      this.errorMessage = "Cannot cancel order: Invalid order ID";
      return;
    }

    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      this.isCancellingOrder = true;

      const updateCommand: UpdateStateCommand = {
        idCommande: orderId,
        etat: Status.CANCELED // Using the enum value from Status.ts
      };

      this.checkoutService.updateOrderStatus(updateCommand).subscribe({
        next: (updatedOrder) => {
          // Find and update the order in the local array
          const index = this.orders.findIndex(o => o.idCommande === orderId);
          if (index !== -1) {
            this.orders[index].etat = Status.CANCELED; // Update the status locally
          }

          // Show success message
          alert('Your order has been successfully cancelled.');
          this.isCancellingOrder = false;
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
          this.errorMessage = 'Failed to cancel the order. Please try again later.';
          this.isCancellingOrder = false;
        }
      });
    }
  }

  // Modify the openCancelModal method to validate order status first
  openCancelModal(order: any) {
    // Only allow cancellation for ON_HOLD orders
    if (order.etat !== 'ON_HOLD') {
      this.toastr.error('Only orders that are on hold can be cancelled');
      return;
    }

    this.selectedOrder = order;
    this.selectedOrderId = order.idCommande;  // Make sure this is set
    this.selectedOrderNumber = order.OrderNumber;
    this.selectedOrderDate = order.dateCommande;

    // Open your modal
    if (this.cancelOrderModal) {
      this.cancelOrderModal.show();
    }
  }

  // Update confirmCancel to double-check the order status
  confirmCancel() {
    if (!this.selectedOrderId) return;

    // Find the order to check its status
    const orderToCancel = this.orders.find(o => o.idCommande === this.selectedOrderId);

    // Only allow ON_HOLD orders to be cancelled
    if (!orderToCancel || orderToCancel.etat !== 'ON_HOLD') {
      console.error('Attempted to cancel an order that is not on hold');
      this.toastr.error('Only orders that are on hold can be cancelled');

      if (this.cancelOrderModal) {
        this.cancelOrderModal.hide();
      }

      this.isCancellingOrder = false;
      return;
    }

    this.isCancellingOrder = true;

    const updateCommand: UpdateStateCommand = {
      idCommande: this.selectedOrderId,
      etat: Status.CANCELED
    };

    this.checkoutService.updateOrderStatus(updateCommand).subscribe({
      next: (updatedOrder) => {
        // Find the order in the active orders array
        const index = this.orders.findIndex(o => o.idCommande === this.selectedOrderId);

        if (index !== -1) {
          // Get the cancelled order and remove it from active orders
          const cancelledOrder = { ...this.orders[index], etat: Status.CANCELED };
          this.orders.splice(index, 1);

          // Add to cancelled orders list
          this.cancelledOrders.push(cancelledOrder);

          // Update UI to reflect changes
          this.toastr.success('Your order has been successfully cancelled');
        }

        // Hide the modal
        if (this.cancelOrderModal) {
          this.cancelOrderModal.hide();
        }

        // Reset state
        this.isCancellingOrder = false;
        this.selectedOrderId = undefined;
        this.selectedOrderNumber = undefined;
        this.selectedOrderDate = undefined;
        this.selectedOrderHasDelivery = false;
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        this.toastr.error('Failed to cancel your order');
        this.isCancellingOrder = false;
      }
    });
  }

  // Add this method to get the item count for cancelled orders
  getOrderItemCount(order: OrderWithItems): number {
    if (order.orderItems && order.orderItems.length > 0) {
      return order.orderItems.length;
    }

    // If order items haven't been loaded, estimate from total amount
    return Math.max(1, Math.floor(order.montantCommande / 50));
  }

  // Add this method to load basic info for cancelled orders
  loadCancelledOrdersBasicInfo(): void {
    // For each cancelled order, you might want to get just the count of items
    // rather than all the details
    this.cancelledOrders.forEach(order => {
      if (order.idCommande) {
        this.ligneCommandeService.getByCommandeId(order.idCommande)
          .subscribe({
            next: (lignes) => {
              order.orderItems = lignes;
            },
            error: (error) => {
              console.error(`Error loading basic info for cancelled order ${order.idCommande}:`, error);
            }
          });
      }
    });
  }

  // Method to load the delivered orders
  private loadDeliveredOrders() {
    this.checkoutService.getAllCommandes()
      .subscribe({
        next: (allOrders: Commande[]) => {
          // Filter orders that belong to the current user and have DELIVERED status
          this.deliveredOrders = allOrders
            .filter(order => order.userId === this.userId && order.etat === Status.DELIVERED)
            .map(order => ({
              ...order,
              orderItems: [],
              isLoadingItems: false,
              showItems: false // Don't need to show detailed items for delivered orders
            }));

          // Optionally load basic info for delivered orders if needed
          if (this.deliveredOrders.length > 0) {
            this.loadDeliveredOrdersBasicInfo();
          }

          console.log('Delivered orders loaded:', this.deliveredOrders);
        },
        error: (error) => {
          console.error('Error loading delivered orders:', error);
          this.deliveredOrders = [];
        }
      });
  }

  // Add this helper method to load basic info for delivered orders
  loadDeliveredOrdersBasicInfo(): void {
    // For each delivered order, just get the count of items
    this.deliveredOrders.forEach(order => {
      if (order.idCommande) {
        this.ligneCommandeService.getByCommandeId(order.idCommande)
          .subscribe({
            next: (lignes) => {
              order.orderItems = lignes;
            },
            error: (error) => {
              console.error(`Error loading basic info for delivered order ${order.idCommande}:`, error);
            }
          });
      }
    });
  }

  // Add this method to handle reordering
  reorderItems(order: OrderWithItems): void {
    // Implement reordering logic - create a new cart with the same items
    this.toastr.info('Creating new order with the same items...', 'Reordering');

    // You'll need to implement this based on your cart service
    // For example:
    // this.cartService.clearCart();
    // order.orderItems?.forEach(item => {
    //   this.cartService.addToCart({
    //     productId: item.produit?.idProduit,
    //     quantity: item.quantite,
    //     price: item.prix
    //   });
    // });
    // this.router.navigate(['/marketplacefront/checkout']);
  }
}
