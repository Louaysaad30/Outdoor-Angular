import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { TicketService } from '../../services/ticket.service';
import { EventService } from '../../services/event.service';
import { Ticket, TicketType } from '../../models/ticket.model';
import { Event } from '../../models/event.model';

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
    private eventService: EventService
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
}
