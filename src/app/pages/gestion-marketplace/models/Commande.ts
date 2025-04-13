import { LigneCommande } from "./LigneCommande";
import { Livraison } from "./Livraison";

export class Commande {
    idCommande?: number;
    dateCommande: Date;
    montantCommande: number;
    nom: string;
    phone: number;
    email: string;
    adresse: string;
    gouvernement: string;
    city: string;
    shippingMethod: string;
    AdditionalService: number;
    ligneCommande!: LigneCommande[];
    userId!: number;
    etat!: string;
    OrderNumber!: string;


    constructor() {
        this.dateCommande = new Date();
      //  this.ligneCommande = [];
        this.montantCommande = 0;
        this.nom = '';
        this.phone = 0;
        this.email = '';
        this.adresse = '';
        this.gouvernement = '';
        this.city = '';
        this.shippingMethod = '';
        this.AdditionalService = 0;
        this.etat='exist'
        this.OrderNumber='';

    }
}
