export interface FormationRequest {
    titre: string;
    description: string;
    prix: number;
    formateurId?: number; // si tu l’utilises dans le formulaire
    mode: string; // 'presentiel' ou 'enligne'
    dateDebut: string; // ISO 8601 string: '2025-04-09T18:00'
    dateFin: string;
    categorieId: number;
    lieu?: string;
    pauseTitle?: string;
    pauseDuration?: number;
    pauseSponsorRequired: boolean;
    sponsorId?: number;
  }
  