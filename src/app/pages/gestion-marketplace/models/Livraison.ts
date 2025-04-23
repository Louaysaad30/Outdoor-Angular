import { Commande } from "./Commande";
import { Status } from "./Status";

export class Livraison{

  idLivraison?: number;
  dateLivraison!: Date;
  adresseLivraison!: string;
  etatLivraison!: Status;
  commande?: Commande[];
  livreurId?: number; // Add this property to match possible API expectations
  OrderNumber?: string;
  montantCommande?: number;
  paymentMethod?: string;
  updateDate?: Date;


}
