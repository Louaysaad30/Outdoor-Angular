import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { TicketService } from '../../services/ticket.service';
import { EventService } from '../../services/event.service';
import { Ticket, TicketType } from '../../models/ticket.model';
import { Event } from '../../models/event.model';
import { ReservationService } from '../../services/reservation.service';
import { TicketReservation } from '../../models/ticketReservation.model';
import { AuthServiceService } from '../../../../account/auth/services/auth-service.service'; // Use this instead of AuthService
@Component({
  selector: 'app-event-tickets-front-office',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './event-tickets-front-office.component.html',
  styleUrl: './event-tickets-front-office.component.scss'
})
export class EventTicketsFrontOfficeComponent implements OnInit {
  eventId: number | null = null;
  event: Event | null = null;
  tickets: Ticket[] = [];
  loading = true;


  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    private eventService: EventService,
    private reservationService: ReservationService,
    private authService: AuthServiceService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.eventId = id;
        this.loadEventDetails(id);
        this.loadEventTickets(id);
      }
    });
  }

  loadEventDetails(eventId: number): void {
    this.eventService.getEventById(eventId).subscribe({
      next: (event) => {
        this.event = event;
      },
      error: (error) => {
        console.error('Error loading event details:', error);
      }
    });
  }

  loadEventTickets(eventId: number): void {
    this.loading = true;
    this.ticketService.getTicketsByEventId(eventId).subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.loading = false;
      }
    });
  }

  getColorClass(ticketType: TicketType): string {
    switch (ticketType) {
      case TicketType.VIP: return 'danger';
      case TicketType.PREMIUM: return 'success';
      case TicketType.REGULAR: return 'secondary';
      case TicketType.STUDENT: return 'info';
      default: return 'secondary';
    }
  }

  reserveTicket(ticket: Ticket): void {
    // Get current user ID from auth service
      const currentUser = JSON.parse(localStorage.getItem('user')!);
      const userId = currentUser ? currentUser.id  : null;
      if (!userId) {
      // Handle not logged in

      alert('Please login to reserve tickets');
      return;
    }

    console.log("current user is",currentUser);
    const reservation: TicketReservation = {
      userId: userId,
      ticketId: ticket.id
    };

    this.reservationService.createReservation(reservation).subscribe({
      next: (result) => {
        alert('Ticket reserved successfully!');
        // Refresh tickets to update availability
        this.loadEventTickets(this.eventId!);
      },
      error: (error) => {
        console.error('Error reserving ticket:', error);
        alert('Failed to reserve ticket. Please try again.');
      }
    });
  }


}
