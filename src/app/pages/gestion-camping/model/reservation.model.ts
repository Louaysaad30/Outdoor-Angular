// File: reservation.model.ts
import {CentreCamping} from "./centrecamping.model";
import {LigneReservation} from "./ligneReservation.model";

export interface Reservation {
  idReservation?: number;
  dateDebut: Date;
  dateFin: Date;
  nbrPersonnes: number;
  prixCamping: number;
  prixLigne: number;
  prixTotal: number;
  idClient: number;
  confirmed: boolean;
  centre: CentreCamping; // Optionally define a CentreCamping interface
  lignesReservation?: LigneReservation[]; // Optionally import or define LigneReservation
}
