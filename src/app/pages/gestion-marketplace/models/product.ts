import { cl } from "@fullcalendar/core/internal-common";
import { PCategorie } from "./PCategorie";
import { LigneCommande } from "./LigneCommande";
import { CodeProduit } from "./CodeProduit";
import { ProductImage } from "./ProductImage";

export class Product {
  idProduit!: number;
  nomProduit!: string;
  descriptionProduit!: string;
  codeProduit!: CodeProduit;
  imageProduit!: string;
  prixProduit!: number;
  dateCreation!: Date; // Add creation date field
  stockProduit!: number;
  categorie!: PCategorie;
  ligneCommande!: LigneCommande[];
  states?: boolean;

  // Add these properties for image gallery navigation
  imageGallery?: ProductImage[];
  currentImageIndex?: number;
}
