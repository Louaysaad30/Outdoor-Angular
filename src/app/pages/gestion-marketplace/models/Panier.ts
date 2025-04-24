import { LigneCommande } from "./LigneCommande";

export class Panier {
  idPanier?: number;
  lignesCommande!:LigneCommande[];
  total!: number;
  idUser!: number;
}
