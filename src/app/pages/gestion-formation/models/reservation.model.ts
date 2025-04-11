import { Formation } from './formation.model';

export interface Reservation {
  id: number;
  participantId: number;
  statut: StatutReservation;
  dateReservation: string;
  formation?: Formation;
}

export enum StatutReservation {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRME = 'CONFIRME',
  ANNULE = 'ANNULE'
}
