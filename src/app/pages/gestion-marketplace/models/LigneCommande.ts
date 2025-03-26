import { P } from "@fullcalendar/core/internal-common";
import { Product } from "./product";
import { Commande } from "./Commande";
import { Panier } from "./Panier";


export class LigneCommande {
    idLigneCommande?: number;
    quantite!: number;
    prix!: number;
    produit!: Product;
    commande!: Commande;
    panier!:Panier;

}
