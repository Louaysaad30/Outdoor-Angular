export interface FormationRequest {
  titre: string;
  description: string;
  prix: number;
  formateurId: number;
  mode: string; // 'presentiel' | 'enligne'
  dateDebut: string;
  dateFin: string;
  categorieId: number;
  lieu?: string;
  pauseTitle?: string;
  pauseDuration?: number;
  pauseSponsorRequired?: boolean;
  sponsorId?: number | null;
  meetLink?: string; 
}
