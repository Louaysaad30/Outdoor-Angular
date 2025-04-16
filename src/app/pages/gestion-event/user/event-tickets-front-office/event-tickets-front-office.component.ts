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

  @Component({
    selector: 'app-event-tickets-front-office',
    standalone: true,
    imports: [
      CommonModule,
      RouterLink,
      SharedModule,
      RouterLinkActive
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
          userId: this.userId ?? undefined,  // Convert null to undefined
        });

        this.reservationService.createReservation(reservation).subscribe({
          next: (newReservation) => {
            // Update local reservation counts
            const currentCount = this.reservationCounts.get(ticket.id!) || 0;
            this.reservationCounts.set(ticket.id!, currentCount + 1);

            // Update available tickets
            ticket.availableTickets--;

            if (newReservation) {
              // Create a complete reservation object with ticket info
              const completeReservation = {
                ...newReservation,
                ticket: ticket // Include the ticket information
              };

              // Add to userReservations array to update UI immediately
              this.userReservations.push(completeReservation);
            }


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
  }
