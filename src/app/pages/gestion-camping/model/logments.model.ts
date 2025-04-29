import {TypeLogement} from "./typeLogment.model";
import {CentreCamping} from "./centrecamping.model";

export interface Logement {
  idLogement: number;
  name: string;
  description: string;
  quantity: number;
  price: number;
  type: TypeLogement; // Using the TypeLogement enum
  image: string;
  centre: CentreCamping; // Representing centre as an object
}
