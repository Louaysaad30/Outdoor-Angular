import { Categorie } from './categorie.model';
import { Sponsor } from './sponsor.model';

export interface Formation {
  id?: number;
  titre: string;
  description: string;
  imageUrl: string;
  prix: number;
  enLigne: boolean;
  lieu?: string;
  meetLink?: string;
  dateDebut: string; // ISO string
  dateFin: string;
  datePublication: string;
  formateurId?: number;
  evenementId?: number;
  titrePause?: string;
  dureePauseMinutes?: number;
  besoinSponsor?: boolean;
  categorie?: Categorie;
  sponsor?: Sponsor;
}
