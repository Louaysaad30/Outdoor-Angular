import { Commande } from "./Commande";
import { Status } from "./Status";

export class Livraison{

  idLivraiosn?: number;
  dateLivraison!: Date;
  adresseLivraison!: string;
  etatLivraison!:Status;
  commande!:Commande[];
}
