import { Review } from "./review.model";

export interface Vehicule {
  id: number;
  type: string;
  modele: string;
  disponible: boolean;
  statut: string;
  localisation: string;
  prixParJour: number;
  nbPlace: number;
  image?: string;
  rating?: number; 
  reviews?: Review[]; 
  agence: {
    id: number;
    nom: string;
    email: string;
    numero: string;
    adresse: string;
  };
}
