export interface UserReservation {
    id: number;
    statut: 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE';
    dateReservation: string;
    formation: {
      titre: string;
      imageUrl: string;
      prix: number;
      duree: string;
      dateDebut: string; // pour calculer days left
    };
  }
  