export interface Sponsor {
  id: number;
  nom: string;
  contactEmail: string;
  telephone: string;
  logoUrl?: string;
  typeSponsor: 'INDIVIDU' | 'ENTREPRISE';
  niveauSponsor: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  pays?: string;     // Only used if typeSponsor === 'INDIVIDU'
  adresse?: string;  // Only used if typeSponsor === 'ENTREPRISE'
  formations?: any[]; 
}
