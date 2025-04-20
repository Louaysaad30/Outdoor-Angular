import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehicule } from '../models/vehicule.model';

@Injectable({
  providedIn: 'root'
})
export class VehiculeService {
  private apiUrl = 'http://localhost:9095/api/vehicules';

  constructor(private http: HttpClient) { }

  addVehicule(data: FormData) {
    return this.http.post(`${this.apiUrl}/add`, data);
  }


  getVehicules(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(this.apiUrl);
  }

  getVehiculeById(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.apiUrl}/${id}`);
  }

  getVehiculesByAgence(agenceId: number): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.apiUrl}/agence/${agenceId}/vehicules`);
  }

  deleteVehicule(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateVehicule(id: number, formData: FormData) {
    return this.http.put(`${this.apiUrl}/update/${id}`, formData);
  }

  // New method to generate vehicle JSON using Groq
  generateVehiculeFromGroq(attributes: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate`, attributes);
  }

  updateVehiculeRating(vehiculeId: number, rating: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${vehiculeId}/rating`, { rating });
  }
}
