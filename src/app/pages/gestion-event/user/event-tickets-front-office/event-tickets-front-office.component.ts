import { Component, OnInit } from '@angular/core';
  import {ActivatedRoute, Router, RouterLink, RouterLinkActive} from '@angular/router';
  import { EventService } from '../../services/event.service';
  import { TicketService } from '../../services/ticket.service';
  import { ReservationService } from '../../services/reservation.service';
  import { Event } from '../../models/event.model';
  import { Ticket } from '../../models/ticket.model';
  import { TicketReservation } from '../../models/ticketReservation.model';
  import { CommonModule } from '@angular/common';
  import { SharedModule } from '../../../../shared/shared.module';
import {FormsModule} from "@angular/forms";

  @Component({
    selector: 'app-event-tickets-front-office',
    standalone: true,
    imports: [
      CommonModule,
      RouterLink,
      SharedModule,
      RouterLinkActive,
      FormsModule
    ],
    templateUrl: './event-tickets-front-office.component.html',
    styleUrls: ['./event-tickets-front-office.component.scss']
  })
  export class EventTicketsFrontOfficeComponent implements OnInit {
    event: Event | null = null;
    tickets: Ticket[] = [];
    loading: boolean = true;
    userId: number | null = null;
    userReservations: TicketReservation[] = [];
    reservationCounts: Map<number, number> = new Map();

    // Toast properties
    showToast: boolean = false;
    toastMessage: string = '';
    toastType: 'success' | 'warning' | 'danger' | 'primary' = 'primary';

    // Discount properties
    discountCode: string = '';
    showDiscountForm: boolean = false;
    selectedTicketId: number | null = null;
    discountValidated: boolean = false;
    discountedPrice: number = 0;

    constructor(
      private route: ActivatedRoute,
      private router: Router,
      private eventService: EventService,
      private ticketService: TicketService,
      private reservationService: ReservationService
    ) { }

    ngOnInit(): void {
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user')!);
      this.userId = currentUser ? currentUser.id : null;

      // Get event ID from route params
      this.route.paramMap.subscribe(params => {
        const eventId = Number(params.get('id'));
        if (eventId) {
          this.loadEvent(eventId);
          this.loadTickets(eventId);
          if (this.userId) {
            this.loadUserReservations();
          }
        }
      });
      // Load user reservations if user is logged in
      if (this.userId) {
        this.loadUserReservations();
      }
    }


    loadEvent(eventId: number): void {
      this.eventService.getEventById(eventId).subscribe({
        next: (event) => {
          this.event = event;
        },
        error: (error) => {
          console.error('Error loading event:', error);
          this.showToastNotification('Failed to load event details', 'danger');
        }
      });
    }

    loadTickets(eventId: number): void {
      this.loading = true;
      this.ticketService.getTicketsByEventId(eventId).subscribe({
        next: (tickets) => {
          this.tickets = tickets;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading tickets:', error);
          this.showToastNotification('Failed to load tickets', 'danger');
          this.loading = false;
        }
      });
    }

    loadUserReservations(): void {
  if (this.userId) {
    this.reservationService.getReservationsByUserId(this.userId).subscribe({
      next: (reservations) => {
        this.userReservations = reservations;
        console.log('Loaded reservations:', this.userReservations);
      },
      error: (error) => {
        console.error('Error loading user reservations:', error);
      }
    });
  }
}


    getColorClass(ticketType: string): string {
      switch (ticketType) {
        case 'VIP':
          return 'primary';
        case 'PREMIUM':
          return 'warning';
        case 'STUDENT':
          return 'info';
        case 'REGULAR':
        default:
          return 'success';
      }
    }


    getReservationCount(ticketId: number): number {
      if (!this.userReservations || this.userReservations.length === 0) {
        return 0;
      }

      const count = this.userReservations.filter(reservation => {
        // Check if the reservation has a ticket object with matching ID
        return reservation.ticket && reservation.ticket.id === ticketId;
      }).length;

      return count;
    }


    hasReachedPurchaseLimit(ticket: Ticket): boolean {
      if (!ticket.id) return false;
      const count = this.getReservationCount(ticket.id);
      return count >= ticket.purchaseLimit;
    }


    reserveTicket(ticket: Ticket): void {
      if (!this.userId) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // Use the backend check instead of local check
      this.reservationService.checkReservationLimit(this.userId, ticket.id!).subscribe({
        next: (response) => {
          if (response.canReserve) {
            const reservation = new TicketReservation({
              ticketId: ticket.id,
              userId: this.userId ?? undefined,
            });

            // Pass the discount code if validated
            const discountCodeToApply =
              (this.discountValidated && this.selectedTicketId === ticket.id)
                ? this.discountCode
                : null;

            this.reservationService.createReservationWithDiscount(
              reservation,
              discountCodeToApply
            ).subscribe({
              next: (newReservation) => {
                // Update available tickets
                ticket.availableTickets--;

                if (newReservation) {
                  // Create a complete reservation object with ticket info
                  const completeReservation = {
                    ...newReservation,
                    ticket: ticket
                  };

                  // Add to userReservations array to update UI immediately
                  this.userReservations.push(completeReservation);
                }

                this.resetDiscountState();
                this.showToastNotification('Ticket reserved successfully!', 'success');
              },
              error: (error) => {
                this.showToastNotification('Failed to reserve ticket. Please try again.', 'danger');
              }
            });
          } else {
            this.showToastNotification(`You've reached the purchase limit (${response.limit}) for this ticket type`, 'warning');
          }
        },
        error: (error) => {
          this.showToastNotification('Failed to check reservation limit. Please try again.', 'danger');
        }
      });
    }

    showToastNotification(message: string, type: 'success' | 'warning' | 'danger' | 'primary'): void {
      this.toastMessage = message;
      this.toastType = type;
      this.showToast = true;

      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
    }

    closeToast(): void {
      this.showToast = false;
    }



    toggleDiscountForm(ticket: Ticket): void {
      if (this.selectedTicketId === ticket.id) {
        this.showDiscountForm = !this.showDiscountForm;
        if (!this.showDiscountForm) {
          this.resetDiscountState();
        }
      } else {
        this.selectedTicketId = ticket.id!;
        this.showDiscountForm = true;
        this.resetDiscountState();
      }
    }

    resetDiscountState(): void {
      this.discountCode = '';
      this.discountValidated = false;
      this.discountedPrice = 0;
    }

    applyDiscount(ticket: Ticket): void {
      if (!this.discountCode.trim()) {
        this.showToastNotification('Please enter a discount code', 'warning');
        return;
      }

      // Check if discount code is valid by extracting from ticket.discountCode
      if (ticket.discountCode && ticket.discountCode.includes(':')) {
        const [storedCode, percentageStr] = ticket.discountCode.split(':');

        if (storedCode === this.discountCode.trim()) {
          const percentage = parseFloat(percentageStr);
          this.discountedPrice = parseFloat((ticket.price * (1 - percentage / 100)).toFixed(2));
          this.discountValidated = true;
          this.showToastNotification(`Discount of ${percentage}% applied!`, 'success');
        } else {
          this.showToastNotification('Invalid discount code', 'warning');
          this.discountValidated = false;
        }
      } else {
        this.showToastNotification('No discount available for this ticket', 'warning');
        this.discountValidated = false;
      }
    }
  }
