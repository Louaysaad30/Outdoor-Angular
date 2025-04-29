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
import { MailerService } from '../../services/mail/mailer.service';

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
    private toastr: ToastrService,
    private mailerService: MailerService
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
                  this.sendStatusUpdateEmail(orders[0], newStatus);

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

  private sendStatusUpdateEmail(order: Commande, newStatus: Status): void {
    const statusLabel = this.getStatusLabel(newStatus);
    console.log('Sending email notification for status:', statusLabel);

    // Modern email template with enhanced design
    const emailHeader = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Outdoor - Order Update</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

          body {
            font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .header {
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            padding: 30px 20px;
            text-align: center;
          }
          .header img {
            max-width: 150px;
            height: auto;
          }
          .content {
            padding: 40px 30px;
            background-color: #fff;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 50px;
            font-weight: 600;
            margin: 10px 0;
            color: white;
            background-color: ${this.getStatusColor(newStatus)};
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .order-details {
            background-color: #f9f9f9;
            border-left: 4px solid #4CAF50;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
          }
          .footer {
            background-color: #f7f7f7;
            padding: 25px 20px;
            text-align: center;
            font-size: 13px;
            color: #666;
          }
          .btn {
            display: inline-block;
            padding: 12px 25px;
            background: linear-gradient(to right, #4CAF50, #2E7D32);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          }
          h2 {
            color: #2E7D32;
            margin-bottom: 20px;
            font-weight: 600;
          }
          p {
            margin-bottom: 15px;
          }
          .divider {
            height: 1px;
            background-color: #eaeaea;
            margin: 30px 0;
          }
          .contact-info {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 10px;
          }
          .social-icon {
            display: inline-block;
            margin: 0 5px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 style="color: white; margin: 10px 0; font-weight: 700; letter-spacing: 1px;">
              OUTDOOR ADVENTURES
            </h1>
          </div>
          <div class="content">
    `;

    const emailFooter = `
          <div class="divider"></div>
          <p style="text-align: center; font-size: 14px;">
            Need assistance? Our customer service team is here to help!
          </p>
          <div class="contact-info">
            <span>📞 +216 71 000 000</span>
            <span>✉️ support@outdoor.com</span>
          </div>
          </div>
          <div class="footer">
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Outdoor - All Rights Reserved</p>
            <p style="margin: 5px 0;">Tunisia, Africa Mall</p>
            <div style="margin-top: 15px;">
              <a href="#" class="social-icon">Facebook</a> •
              <a href="#" class="social-icon">Instagram</a> •
              <a href="#" class="social-icon">Twitter</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Content based on status
    let subject = `Your Order ${order.OrderNumber} - Delivery Update`;
    let messageContent = '';

    switch (newStatus) {
      case Status.IN_PROGRESS:
        messageContent = `
          <h2>🚚 Your Order is Out for Delivery!</h2>
          <p style="font-size: 16px;">Dear ${order.nom},</p>
          <p>Great news! Your order is now <strong>out for delivery</strong>.</p>

          <div class="order-details">
            <p><strong>Order Number:</strong> #${order.OrderNumber}</p>
            <p><strong>Status:</strong> <span class="status-badge">OUT FOR DELIVERY</span></p>
            <p><strong>Estimated Delivery:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>Our delivery person is on the way with your package. You should receive it soon!</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>

          <p>Thank you for shopping with Outdoor!</p>
          <p style="margin-top: 25px;">Best regards,<br><strong>The Outdoor Team</strong></p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://outdoor.com/track-order?id=${order.OrderNumber}" class="btn">TRACK YOUR DELIVERY</a>
          </div>
        `;
        break;

      case Status.DELIVERED:
        messageContent = `
          <h2>✓ Your Order Has Been Delivered!</h2>
          <p style="font-size: 16px;">Dear ${order.nom},</p>
          <p>We're happy to inform you that your order has been <strong>successfully delivered</strong>!</p>

          <div class="order-details">
            <p><strong>Order Number:</strong> #${order.OrderNumber}</p>
            <p><strong>Status:</strong> <span class="status-badge">DELIVERED</span></p>
            <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>We hope you enjoy your purchase. If you're satisfied with our service, we would appreciate your feedback.</p>

          <p>Thank you for choosing Outdoor for your outdoor needs.</p>
          <p style="margin-top: 25px;">Best regards,<br><strong>The Outdoor Team</strong></p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://outdoor.com/review?order=${order.OrderNumber}" class="btn">LEAVE FEEDBACK</a>
          </div>
        `;
        break;

      case Status.CANCELED:
        messageContent = `
          <h2>⚠️ Your Order Delivery Has Been Canceled</h2>
          <p style="font-size: 16px;">Dear ${order.nom},</p>
          <p>We regret to inform you that the delivery for your order has been <strong>canceled</strong>.</p>

          <div class="order-details">
            <p><strong>Order Number:</strong> #${order.OrderNumber}</p>
            <p><strong>Status:</strong> <span class="status-badge">CANCELED</span></p>
            <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>Our customer service team will contact you shortly to provide more information and reschedule the delivery if needed.</p>
          <p>We apologize for any inconvenience this may cause.</p>

          <p style="margin-top: 25px;">Best regards,<br><strong>The Outdoor Team</strong></p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://outdoor.com/contact-us" class="btn">CONTACT SUPPORT</a>
          </div>
        `;
        break;

      default:
        messageContent = `
          <h2>📋 Your Order Status Has Been Updated</h2>
          <p style="font-size: 16px;">Dear ${order.nom},</p>
          <p>Your order status has been updated to <strong>${statusLabel}</strong>.</p>

          <div class="order-details">
            <p><strong>Order Number:</strong> #${order.OrderNumber}</p>
            <p><strong>Status:</strong> <span class="status-badge">${statusLabel.toUpperCase()}</span></p>
            <p><strong>Update Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>Thank you for shopping with Outdoor!</p>
          <p style="margin-top: 25px;">Best regards,<br><strong>The Outdoor Team</strong></p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://outdoor.com/track-order?id=${order.OrderNumber}" class="btn">TRACK YOUR ORDER</a>
          </div>
        `;
    }

    // Combine header, content and footer
    const fullHtmlMessage = emailHeader + messageContent + emailFooter;

    // Send the email
    this.mailerService.sendEmail(order.email, subject, fullHtmlMessage) // Use the correct parameter name here (body)
      .subscribe({
        next: (response) => {
          console.log('Email sent successfully:', response);
          this.toastr.success('Status update notification sent to customer');
        },
        error: (err) => {
          // Only treat actual errors as errors, not "OK" responses
          if (err === 'OK' || err.status === 200) {
            console.log('Email sent successfully with OK response');
            this.toastr.success('Status update notification sent to customer');
          } else {
            console.error('Error sending email notification:', err);
            this.toastr.warning('Delivery status updated but failed to send email notification');
          }
        }
      });
  }

  // Helper method to get appropriate color for status badges
  private getStatusColor(status: Status): string {
    switch (status) {
      case Status.IN_PROGRESS:
        return '#2196F3'; // Blue
      case Status.SHIPPED:
        return '#FF9800'; // Orange
      case Status.DELIVERED:
        return '#4CAF50'; // Green
      case Status.CANCELED:
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
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
      case Status.ON_HOLD:
        return 'ON_HOLD';
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
