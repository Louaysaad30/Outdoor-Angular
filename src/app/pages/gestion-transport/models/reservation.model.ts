import { Vehicule } from "./vehicule.model";

export interface Reservation {
    id: number;
    fullName: string;
    phone: string;
    vehicule: Vehicule;
    debutLocation: string;
    finLocation: string;
    pickupLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    prixTotal: number; 
    statut: 'EN_ATTENTE' | 'APPROUVÉE' | 'REJETÉE' | 'CANCELLED';
    causeRejet?: string;
    userId: number;
  }
  