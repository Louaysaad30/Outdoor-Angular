import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormationListService {
  private baseUrl = 'http://localhost:9094/Formation-Service/api/formations';
  private categoryUrl = 'http://localhost:9094/Formation-Service/api/categories';
  private sponsorUrl = 'http://localhost:9094/Formation-Service/api/sponsors';

  constructor(private http: HttpClient) {}

  getFormations(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.categoryUrl);
  }

  getSponsors(): Observable<any[]> {
    return this.http.get<any[]>(this.sponsorUrl);
  }

  createFormationWithImage(formData: FormData): Observable<any> {
    return this.http.post(this.baseUrl + '/upload', formData);
  }

  updateFormationWithImage(formData: FormData, id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/upload/${id}`, formData);
  }

  deleteFormation(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
