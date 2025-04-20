export interface Review {
  id?: number;
  rating: number;
  comment: string;
  createdDate?: string;
  vehiculeId: number;
  userId: number;
  user: {  
    nom: string;
    prenom: string;
    image: string | null;
  };
}