import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Livraison } from '../../models/Livraison';
import { DeliveryService } from '../../services/livraison/delivery.service';
import { CheckoutService } from '../../services/checkout.service';
import { ToastrService } from 'ngx-toastr';
import { Status } from '../../models/Status';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Commande } from '../../models/Commande';
import { forkJoin, of } from 'rxjs';
import { DeliveryAssignmentDTO } from '../../models/DTO/DeliveryAssignmentDTO';
import { DeliveryStatusUpdateDto } from '../../models/DTO/DeliveryStatusUpdateDto';
import { UpdateStateCommand } from '../../models/DTO/UpdateStateCommand';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styles: [`
    .dropdown-menu {
      display: none;
      z-index: 1000;
    }
    .dropdown-menu.show {
      display: block;
    }
    .dropdown-item {
      cursor: pointer;
    }
  `]
})
export class OrderListComponent implements OnInit {
  // Current user and deliveries data
  currentUser: any;
  deliveries: Livraison[] = [];
  filteredDeliveries: Livraison[] = [];
  ordersMap: Map<number, Commande> = new Map(); // Store orders by livraison ID
  loading: boolean = true;
  error: string | null = null;

  // Filters
  statusFilter = new FormControl('all');
  searchTerm = new FormControl('');
  sortBy = new FormControl('date');
  sortOrder = new FormControl('desc');
  Status = Status;

  // Status options for display
  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: Status.IN_PROGRESS, label: 'Pending' },
    { value: Status.SHIPPED, label: 'In Progress' },
    { value: Status.DELIVERED, label: 'Completed' },
    { value: Status.CANCELED, label: 'Cancelled' }
  ];

  // Sort options
  sortOptions = [
    { value: 'date', label: 'Delivery Date' },
    { value: 'address', label: 'Address' },
    { value: 'status', label: 'Status' },
    { value: 'amount', label: 'Amount' }
  ];

  constructor(
    private deliveryService: DeliveryService,
    private checkoutService: CheckoutService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Get current user from localStorage
    this.currentUser = JSON.parse(localStorage.getItem('user')!);

    // Setup search debounce
    this.searchTerm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => this.applyFilters());

    // Setup other filter change listeners
    this.statusFilter.valueChanges.subscribe(() => this.applyFilters());
    this.sortBy.valueChanges.subscribe(() => this.applyFilters());
    this.sortOrder.valueChanges.subscribe(() => this.applyFilters());

    // Load deliveries
    this.loadDeliveries();
  }



  loadDeliveries(): void {

    this.loading = true;
    this.error = null;
    this.ordersMap.clear();

    if (!this.currentUser?.id) {
      this.error = 'User information not found. Please log in again.';
      this.loading = false;
      this.toastr.error(this.error, 'Error');
      return;
    }

    this.deliveryService.getLivraisonByLivreurId(this.currentUser.id).subscribe({

      next: (deliveries) => {
        this.deliveries = deliveries;

        // Create array of observables to fetch commands for each delivery
        const observables = deliveries
          .filter(d => d.idLivraison) // Filter out deliveries without ID
          .map(delivery =>
            this.checkoutService.getCommandeByLivraisonId(delivery.idLivraison!).pipe(
                // Add a console log to display the list of orders
                switchMap(orders => {
                console.log(`Orders for delivery ${delivery.idLivraison}:`, orders);
                return of(orders);
                }),
              catchError(err => {
                console.error(`Error fetching orders for delivery ${delivery.idLivraison}:`, err);
                return of([]);
              })
            )
          );

        if (observables.length === 0) {
          this.applyFilters();
          this.loading = false;
          return;
        }

        forkJoin(observables).subscribe({
          next: (results) => {
            // Associate orders with deliveries
            deliveries.forEach((delivery, index) => {
              if (delivery.idLivraison && results[index] && results[index].length > 0) {
                this.ordersMap.set(delivery.idLivraison, results[index][0]);
              }
            });

            this.applyFilters();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error fetching client information:', err);
            this.applyFilters();
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading deliveries:', err);
        this.error = 'Failed to load deliveries. Please try again later.';
        this.loading = false;
        this.toastr.error(this.error, 'Error');
      }
    });
  }

  // Get the order associated with a delivery
  getClientOrder(deliveryId?: number): Commande | undefined {
    if (!deliveryId) return undefined;
    return this.ordersMap.get(deliveryId);
  }

  applyFilters(): void {
    let filtered = [...this.deliveries];

    // Apply status filter
    if (this.statusFilter.value !== 'all') {
      filtered = filtered.filter(delivery =>
        delivery.etatLivraison === this.statusFilter.value
      );
    }

    // Apply search filter (case insensitive)
    const term = this.searchTerm.value?.toLowerCase();
    if (term) {
      filtered = filtered.filter(delivery => {
        const clientOrder = delivery.idLivraison ? this.ordersMap.get(delivery.idLivraison) : undefined;

        return (
          delivery.adresseLivraison?.toLowerCase().includes(term) ||
          delivery.OrderNumber?.toLowerCase().includes(term) ||
          delivery.paymentMethod?.toLowerCase().includes(term) ||
          clientOrder?.nom?.toLowerCase().includes(term) ||
          clientOrder?.phone?.toString().includes(term) ||
          clientOrder?.email?.toLowerCase().includes(term) ||
          clientOrder?.adresse?.toLowerCase().includes(term)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const isAsc = this.sortOrder.value === 'asc';
      const sortByValue = this.sortBy.value;

      switch (sortByValue) {
        case 'date':
          return this.compare(new Date(a.dateLivraison), new Date(b.dateLivraison), isAsc);
        case 'address':
          return this.compare(a.adresseLivraison, b.adresseLivraison, isAsc);
        case 'status':
          return this.compare(a.etatLivraison, b.etatLivraison, isAsc);
        case 'amount':
          return this.compare(a.montantCommande || 0, b.montantCommande || 0, isAsc);
        default:
          return 0;
      }
    });

    this.filteredDeliveries = filtered;
  }

  private compare(a: any, b: any, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  updateDeliveryStatus(delivery: Livraison, newStatus: Status): void {
    console.log('Updating status:', delivery.idLivraison, 'to', newStatus);

    // Create a DeliveryStatusUpdateDto object for the delivery
    const statusUpdateDto: DeliveryStatusUpdateDto = {
      idLivraison: delivery.idLivraison!,
      etatLivraison: newStatus,
      updateDate: new Date()
    };

    // First, update the delivery status
    this.deliveryService.updateDeliveryStatus(delivery.idLivraison!, statusUpdateDto).subscribe({
      next: (updatedDelivery) => {
        console.log('Delivery status updated successfully:', updatedDelivery);

        // Now, find the associated order to update its status
        this.checkoutService.getCommandeByLivraisonId(delivery.idLivraison!).subscribe({
          next: (orders) => {
            if (orders && orders.length > 0) {
              const order = orders[0]; // Assuming one order per delivery

              // Map delivery status to order status
              // You can customize this mapping according to your business logic
              const orderStatus = this.mapDeliveryStatusToOrderStatus(newStatus);

              // Create UpdateStateCommand DTO for order update
              const updateOrderDto: UpdateStateCommand = {
                idCommande: order.idCommande!,
                etat: orderStatus
              };

              // Update the order status
              this.checkoutService.updateOrderStatus(updateOrderDto).subscribe({
                next: (updatedOrder) => {
                  console.log('Order status also updated successfully:', updatedOrder);

                  // Update local arrays and UI
                  this.updateLocalDeliveryStatus(delivery, newStatus, orderStatus);

                  this.toastr.success(`Delivery status updated to ${this.getStatusLabel(newStatus)}`);
                },
                error: (err) => {
                  console.error('Error updating order status:', err);
                  // Even if order update fails, we still updated the delivery status
                  this.updateLocalDeliveryStatus(delivery, newStatus, null);
                  this.toastr.warning(`Delivery status updated, but order status update failed`);
                }
              });
            } else {
              console.warn('No order found for this delivery:', delivery.idLivraison);
              // Update local arrays with just delivery status
              this.updateLocalDeliveryStatus(delivery, newStatus, null);
              this.toastr.success(`Delivery status updated to ${this.getStatusLabel(newStatus)}`);
            }
          },
          error: (err) => {
            console.error('Error finding order for delivery:', err);
            // Update local arrays with just delivery status
            this.updateLocalDeliveryStatus(delivery, newStatus, null);
            this.toastr.success(`Delivery status updated to ${this.getStatusLabel(newStatus)}`);
          }
        });
      },
      error: (err) => {
        console.error('Error updating delivery status:', err);
        this.toastr.error('Failed to update delivery status. Please try again.');
      }
    });
  }

  // Helper method to update local arrays
  private updateLocalDeliveryStatus(delivery: Livraison, newDeliveryStatus: Status, newOrderStatus: Status | null): void {
    // Update the delivery in the arrays
    const index = this.deliveries.findIndex(d => d.idLivraison === delivery.idLivraison);
    if (index >= 0) {
      this.deliveries[index] = {...delivery, etatLivraison: newDeliveryStatus};

      // If we have an updated order status and the delivery has a linked order
      if (newOrderStatus && this.ordersMap.has(delivery.idLivraison!)) {
        const order = this.ordersMap.get(delivery.idLivraison!);
        if (order) {
          // Update the order status in our local map
          order.etat = newOrderStatus;
          this.ordersMap.set(delivery.idLivraison!, order);
        }
      }
    }

    // Refresh the filtered list
    this.applyFilters();
  }

  // Helper method to map delivery status to order status
  private mapDeliveryStatusToOrderStatus(deliveryStatus: Status): Status {
    switch (deliveryStatus) {
      case Status.SHIPPED:
        return Status.IN_PROGRESS; // Order remains in progress when delivery starts
      case Status.DELIVERED:
        return Status.DELIVERED;   // Order is completed when delivered
      case Status.CANCELED:
        return Status.CANCELED;    // Order is canceled when delivery is canceled
      default:
        return Status.IN_PROGRESS; // Default to in progress
    }
  }

  // Helper method to get readable status label
  public getStatusLabel(status: Status): string {
    switch (status) {
      case Status.IN_PROGRESS:
        return 'In Progress';
      case Status.SHIPPED:
        return 'Shipped';
      case Status.DELIVERED:
        return 'Delivered';
      case Status.CANCELED:
        return 'Canceled';
      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: Status): string {
    switch (status) {
      case Status.IN_PROGRESS:
        return 'status-pending';
      case Status.SHIPPED:
        return 'status-in-progress';
      case Status.DELIVERED:
        return 'status-completed';
      case Status.CANCELED:
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  refreshDeliveries(): void {
    this.loadDeliveries();
  }
  getStatusUpdateComment(status: Status): string {
    switch(status) {
      case Status.SHIPPED:
        return 'Delivery started by driver';
      case Status.DELIVERED:
        return 'Delivery completed successfully';
      case Status.CANCELED:
        return 'Delivery canceled by driver';
      default:
        return '';
    }
  }
}
