import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Materiel} from "../model/materiel.model";

@Injectable({
  providedIn: 'root'
})
export class MaterielService {
  private apiUrl = 'http://localhost:9092/Camping-Service/Materiel'; // Adjust the URL based on your backend configuration

  constructor(private http: HttpClient) {}

  getAllMateriels(): Observable<Materiel[]> {
    return this.http.get<Materiel[]>(`${this.apiUrl}/all`);
  }

  addMateriel(materiel: Materiel): Observable<Materiel> {
    return this.http.post<Materiel>(`${this.apiUrl}/add`, materiel);
  }

  updateMateriel(materiel: Materiel): Observable<Materiel> {
    return this.http.put<Materiel>(`${this.apiUrl}/update`, materiel);
  }

  getMateriel(id: number): Observable<Materiel> {
    return this.http.get<Materiel>(`${this.apiUrl}/get/${id}`);
  }

  deleteMateriel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getMaterielsByCentre(centreId: number): Observable<Materiel[]> {
    return this.http.get<Materiel[]>(`${this.apiUrl}/byCentre/${centreId}`);
  }

  uploadImage(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }
}
