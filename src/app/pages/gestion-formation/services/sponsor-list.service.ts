import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sponsor } from '../models/sponsor.model';

@Injectable({
  providedIn: 'root'
})
export class SponsorListService {

  private apiUrl = 'http://localhost:9094/Formation-Service/api/sponsors';
  constructor(private http: HttpClient) {}

  getSponsors(): Observable<Sponsor[]> {
    return this.http.get<Sponsor[]>(this.apiUrl);
  }

  addSponsor(formData: FormData): Observable<Sponsor> {
    return this.http.post<Sponsor>(`${this.apiUrl}/add`, formData);
  }

  deleteSponsor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateSponsor(id: number, formData: FormData): Observable<Sponsor> {
    return this.http.put<Sponsor>(`${this.apiUrl}/update/${id}`, formData);
  }
} 
