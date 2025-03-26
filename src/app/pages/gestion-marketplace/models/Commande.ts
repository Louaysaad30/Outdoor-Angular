import { LigneCommande } from "./LigneCommande";
import { Livraison } from "./Livraison";

export class Commande{


  idCommande?: number;
  dateCommande!: Date;
  montantCommande!: number;
  livraison!:Livraison;
  ligneCommande!:LigneCommande[];



}
