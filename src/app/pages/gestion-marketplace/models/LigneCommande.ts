import { Product } from "./product";
import { Commande } from "./Commande";
import { Panier } from "./Panier";

export class LigneCommande {
    idLigneCommande?: number;
    id?: number;              // Backend sometimes uses 'id' instead of 'idLigneCommande'
    quantite!: number;
    prix!: number;
    produit!: Product;        // Reference to the full Product object
    commande?: Commande;      // Optional commande reference
    panier!: Panier;          // Required panier reference
    idProduit?: number;       // Direct reference to product ID
}
