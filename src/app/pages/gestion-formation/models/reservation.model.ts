export interface Reservation {
  id: number;
  participantNom: string;
  participantPrenom: string;
  formationTitre: string; // 🆕 un simple string
  statut: StatutReservation;
  dateReservation: string;
}

export enum StatutReservation {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRME = 'CONFIRME',
  ANNULE = 'ANNULE'
}
