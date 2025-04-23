import { LigneCommande } from "./LigneCommande";

export class Panier {
  idPanier?: number;
  total!: number;
  userId!: number;
  validated!: boolean;
}
