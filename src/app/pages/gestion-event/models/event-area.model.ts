export class EventArea {
  id?: number;
  name!: string ;
  capacity!: number;
  latitude!: number;
  longitude!: number ;
  description!: string ;
  areaImg?: string ;
  events!: Event[];
  address?: string ;
  status?: EventAreaStatus;
  rejectionMessage?: string;
  userId?: number;
}

export enum EventAreaStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
export class EventAreaApprovalDTO {
  message?: string;

  constructor(message?: string) {
    this.message = message;
  }
}

// Add this to your event-area.model.ts file
export interface EventAreaStatusChangeDTO {
  newStatus: string;
  message?: string;
}
