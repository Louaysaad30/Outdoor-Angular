// File: ligne-reservation.model.ts
import {Reservation} from "./reservation.model";
import {Logement} from "./logments.model";
import {Materiel} from "./materiel.model";

export interface LigneReservation {
  idLigne?: number;
  dateDebut: Date;
  dateFin: Date;
  quantite: number;
  prix: number;
  reservation?: Reservation;
  logement:Logement;
  materiel: Materiel;
}
