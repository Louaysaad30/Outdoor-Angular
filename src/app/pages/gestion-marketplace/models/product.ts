import { cl } from "@fullcalendar/core/internal-common";
import { PCategorie } from "./PCategorie";
import { LigneCommande } from "./LigneCommande";



export class Product {
  idProduit?: number;
  nomProduit!: string;
  descriptionProduit!: string;
  imageProduit!: string;
  prixProduit!: number;
  stockProduit!: number;
  categorie!:PCategorie;
  ligneCommande!:LigneCommande[];
}
