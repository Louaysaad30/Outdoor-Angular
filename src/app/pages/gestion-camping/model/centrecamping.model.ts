import {Logement} from "./logments.model";

export interface CentreCamping {
  idCentre: number;
  longitude: string;
  latitude: string
  address: string
  name: string;
  capcite: number;
  image: string;
  logements: Logement[]; // Ensure this property is defined
  materiels?: any[];
  reservations?: any[];
  idOwner: number;
  prixJr: number;
  verified: boolean;
}
