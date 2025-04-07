import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormationListService {
  private baseUrl = 'http://localhost:9094/Formation-Service/api/formations';
  private categorieUrl = 'http://localhost:9094/Formation-Service/api/categories';
  private sponsorUrl = 'http://localhost:9094/Formation-Service/api/sponsors';

  constructor(private http: HttpClient) {}

  getFormations(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  createFormation(formation: any): Observable<any> {
    return this.http.post(this.baseUrl, formation);
  }

  updateFormation(formation: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${formation.id}`, formation);
  }

  deleteFormation(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.categorieUrl);
  }

  getSponsors(): Observable<any[]> {
    return this.http.get<any[]>(this.sponsorUrl);
  }
}
