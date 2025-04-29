export interface Review {
    id?: number;
    title: string;
    comment: string;
    rating: number;
    createdAt?: Date;
    userId: number;
    formationId: number;
    userName?: string; // Optionnel pour afficher dans la liste sans erreur
    imageUrl?: string; // Optionnel pour image attachée au review
  }
  