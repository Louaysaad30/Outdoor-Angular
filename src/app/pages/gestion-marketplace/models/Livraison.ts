import { Commande } from "./Commande";
import { Status } from "./Status";

export class Livraison {
  idLivraison?: number;
  dateLivraison!: Date;
  adresseLivraison!: string;
  etatLivraison!: Status;
  commande?: Commande[];

  // Add both property variations to ensure compatibility
  livreurId?: number;
  LivreurId?: number; // Uppercase version that server expects

  OrderNumber?: string;
  montantCommande?: number;
  paymentMethod?: string;
  updateDate?: Date;
}
