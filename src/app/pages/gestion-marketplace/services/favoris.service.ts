import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Favoris } from '../models/Favoris';


@Injectable({
  providedIn: 'root'
})
export class FavorisService {
 private apiUrl = 'http://localhost:9093/Favoris';

  constructor(private http: HttpClient) { }

  retrieveAllFavoris(): Observable<Favoris[]> {
    return this.http.get<Favoris[]>(`${this.apiUrl}/getAllFavoris`);
  }

  addFavoris(favoris: Favoris): Observable<Favoris> {
    return this.http.post<Favoris>(`${this.apiUrl}/addFavoris`, favoris);
  }

  updateFavoris(favoris: Favoris): Observable<Favoris> {
    return this.http.put<Favoris>(`${this.apiUrl}/update`, favoris);
  }

  retrieveFavoris(idFavoris: number): Observable<Favoris> {
    return this.http.get<Favoris>(`${this.apiUrl}/get/${idFavoris}`);
  }

  removeFavoris(idFavoris: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${idFavoris}`);
  }
}
