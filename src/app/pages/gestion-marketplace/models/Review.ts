import { Product } from "./product";

export interface Review {
  idReview?: number;
  rating?: number;
  reviewText?: string;
  userName?: string;
  dateCreation?: Date;
  image?: string;
  userId?: number;
  product?: Product | { idProduit: number }; // Rendre optionnel et accepter un objet simplifié
  productId?: number; // Pour la compatibilité avec l'API
  dateDeNaissance?: Date; // Ajouté pour la compatibilité avec l'API
}
