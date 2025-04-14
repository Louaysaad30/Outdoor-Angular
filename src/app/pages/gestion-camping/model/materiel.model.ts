import {CentreCamping} from "./centrecamping.model";

export interface Materiel {
  idMateriel: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
  centre: CentreCamping; // Representing centre as an object
}
