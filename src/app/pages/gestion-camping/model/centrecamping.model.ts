
export interface CentreCamping {
  idCentre: number;
  longitude: string;
  latitude: string
  address: string
  name: string;
  capcite: number;
  image: string;
  logements?: any[];
  materiels?: any[];
  reservations?: any[];
  idOwner: number;
  prixJr: number;
  verified: boolean;
}
