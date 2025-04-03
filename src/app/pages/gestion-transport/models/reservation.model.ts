export interface Reservation {
    id?: number;
    fullName: string;
    phone: string;
    vehicule: { id: number }; // Modify this to be an object with 'id'
    debutLocation: string;
    finLocation: string;
    pickupLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropOffLocation: string;
    dropOffLatitude: number;
    dropOffLongitude: number;
    prixTotal: number;
    statut: string; // "EN_ATTENTE" par défaut
    userId: number;
  }
  