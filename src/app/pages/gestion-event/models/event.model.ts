export enum Status {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  FINISHED = 'FINISHED',
  CANCELED = 'CANCELED'
}
export interface Event {
  id?: number;
  title?: string;
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  imageUrl?: string;
  status?: Status;
  eventArea?: {
    id?: number;
  };
  tickets?: any[];
}
