export interface ReviewAnalysisResponse {
  idReview: number;
  reviewText: string;
  sentiment: string;
  age?: number;
  error?: string;
  idProduit: number;  // Ajoutez cette ligne
 dateCreation?: Date; // Ajoutez cette ligne

}
