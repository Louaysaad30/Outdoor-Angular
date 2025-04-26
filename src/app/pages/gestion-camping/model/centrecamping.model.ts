import {Logement} from "./logments.model";
import {Materiel} from "./materiel.model";

export interface CentreCamping {
  idCentre: number;
  longitude: number;
  latitude: number
  address: string
  name: string;
  capcite: number;
  image: string;
  logements: Logement[]; // Ensure this property is defined
  materiels: Materiel[];
  reservations?: any[];
  idOwner: number;
  prixJr: number;
  verified: boolean;
numTel : number;
}
