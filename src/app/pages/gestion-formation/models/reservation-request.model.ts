export interface ReservationRequest {
    formationId: number;    // ID de la formation à réserver
    nom: string;            // nom que l'utilisateur entre
    prenom: string;         // prénom que l'utilisateur entre
    email: string;          // email que l'utilisateur entre
    telephone: string;      // téléphone que l'utilisateur entre
    message?: string;       // (optionnel) commentaire/message
  }
  