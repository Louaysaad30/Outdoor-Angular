export interface Categorie {
  id: number;
  nom: string;
  imageUrl: string;
  description: string;
  formations: any[]; // Ou Formation[] si tu as le modèle
}
