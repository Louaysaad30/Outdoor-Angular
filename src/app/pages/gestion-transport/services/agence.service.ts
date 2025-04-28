import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Agence } from '../models/agence.model'; 

@Injectable({
  providedIn: 'root',
})
export class AgenceService {
  private apiUrl = 'http://localhost:9095/api/agences'; 

  constructor(private http: HttpClient) {}

  // Get all agences
  getAllAgences(): Observable<Agence[]> {
    return this.http.get<Agence[]>(this.apiUrl);
  }

  // Get a single agence by ID
  getAgenceById(id: number): Observable<Agence> {
    return this.http.get<Agence>(`${this.apiUrl}/${id}`);
  }

  // Create a new agence
  createAgence(agence: Agence): Observable<Agence> {
    return this.http.post<Agence>(this.apiUrl, agence);
  }

  // Update an existing agence
  updateAgence(id: number, agenceDetails: Agence): Observable<Agence> {
    return this.http.put<Agence>(`${this.apiUrl}/${id}`, agenceDetails);
  }

  // Delete an agence by ID
  deleteAgence(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
