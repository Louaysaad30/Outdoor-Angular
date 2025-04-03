import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Panier } from '../models/Panier';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private apiUrl = 'http://localhost:9093/Panier';

  constructor(private http: HttpClient) { }

  // Get all Paniers
  getAllPaniers(): Observable<Panier[]> {
    return this.http.get<Panier[]>(`${this.apiUrl}/getAllPaniers`);
  }

  // Add new Panier
  addPanier(panier: Panier): Observable<Panier> {
    return this.http.post<Panier>(`${this.apiUrl}/addPanier`, panier);
  }

  // Update existing Panier
  updatePanier(panier: Panier): Observable<Panier> {
    return this.http.put<Panier>(`${this.apiUrl}/update`, panier);
  }

  // Get Panier by ID
  getPanierById(id: number): Observable<Panier> {
    return this.http.get<Panier>(`${this.apiUrl}/get/${id}`);
  }

  // Delete Panier
  deletePanier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Add product to Panier
  ajouterProduitAuPanier(userId: number, produitId: number, quantite: number): Observable<Panier> {
    return this.http.put<Panier>(
      `${this.apiUrl}/ajouterProduitAuPanier/${userId}/${produitId}/${quantite}`,
      {}
    );
  }

  // Get Panier by User ID
  getPanierByUser(userId: number): Observable<Panier> {
    return this.http.get<Panier>(`${this.apiUrl}/getPanierByUser/${userId}`).pipe(
      tap(response => console.log('API Response:', response)), // Debug log
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => error);
      })
    );
  }
}
