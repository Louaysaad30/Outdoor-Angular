
export interface Ticket {
  id?: number;
  type: TicketType;
  price: number;
  availableTickets: number;
  purchaseLimit: number;
  discountCode?: string | null;
  event: {
    id: number;
    title?: string;
  };
}

export enum TicketType {
  VIP = 'VIP',
  REGULAR = 'REGULAR',
  PREMIUM = 'PREMIUM',
  STUDENT = 'STUDENT'
}
