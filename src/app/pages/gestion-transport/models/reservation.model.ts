import { Vehicule } from "./vehicule.model";

export interface Reservation {
    id?: number;
    fullName: string;
    phone: string;
    //vehicule: { id: number }; 
    vehicule: Vehicule;
    debutLocation: string;
    finLocation: string;
    pickupLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    prixTotal: number;
    //statut: string; 
    statut: 'EN_ATTENTE' | 'APPROUVÉE' | 'REJETÉE';
    causeRejet?: string;
    userId: number;
  }
  