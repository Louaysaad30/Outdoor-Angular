import {CentreCamping} from "./centrecamping.model";
import {TypeMateriel} from "./typeMateriel.model";

export interface Materiel {
  idMateriel: number;
  name: string;
  description: string;
  quantity: number;
  price: number;
  image: string;
  type :TypeMateriel;
  centre: CentreCamping; // Representing centre as an object
}
