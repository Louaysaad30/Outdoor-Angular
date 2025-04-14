import { Ticket } from './ticket.model';

export class TicketReservation {
  id?: number;
  userId?: number;
  ticketId?: number; // Add this field
  ticket?: Ticket;

  constructor(reservation?: Partial<TicketReservation>) {
    if (reservation) {
      Object.assign(this, reservation);
    }
  }
}
