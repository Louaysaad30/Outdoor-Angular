import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Formation } from '../models/formation.model';

@Injectable({
  providedIn: 'root'
})
export class FormationListService {
  private baseUrl = 'http://localhost:9094/Formation-Service/api/formations';
  private categoryUrl = 'http://localhost:9094/Formation-Service/api/categories';
  private sponsorUrl = 'http://localhost:9094/Formation-Service/api/sponsors';
  private userBaseUrl = 'http://localhost:9096/user'; // ✅ Corrigé : URL de base user-service

  constructor(private http: HttpClient) {}

  // 🔵 FORMATIONS

  getFormations(): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.baseUrl}`);
  }

  getFormationById(id: number): Observable<Formation> {
    return this.http.get<Formation>(`${this.baseUrl}/${id}`);
  }

  getFormationsByFormateur(formateurId: number): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.baseUrl}/formateur/${formateurId}`);
  }

  createFormationWithImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  updateFormationWithImage(formData: FormData, id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/update`, formData);
  }

  deleteFormation(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  improveDescription(text: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/improve-description`, { text });
  }

  suggestSponsor(data: { description: string; prix: number; mode: string; lieu: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/suggest-sponsor`, data);
  }

  getYoutubeVideo(title: string): Observable<string> {
    const encoded = encodeURIComponent(title.trim());
    return this.http.get(`${this.baseUrl.replace('/formations', '')}/youtube/video?query=${encoded}`, { responseType: 'text' });
  }

  // 🔵 CATEGORIES & SPONSORS

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.categoryUrl);
  }

  getSponsors(): Observable<any[]> {
    return this.http.get<any[]>(this.sponsorUrl);
  }

  // 🔵 USERS

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.userBaseUrl}/all`);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.userBaseUrl}/${id}`);
  }
}
