import { Ticket } from './ticket.model';

export class TicketReservation {
  id?: number;
  userId?: number;
  ticketId?: number; // Add this field
  ticket?: Ticket;
  reservationCode?: string;

  constructor(reservation?: Partial<TicketReservation>) {
    if (reservation) {
      Object.assign(this, reservation);
    }
  }

  appliedDiscountCode ?: string;
  finalPrice ?: number;
}
