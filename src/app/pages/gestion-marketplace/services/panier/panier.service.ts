import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Panier } from '../../models/Panier';
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
    console.log(`PanierService: Adding product ${produitId} for user ${userId} with quantity ${quantite}`);

    // Ensure we're sending a proper REST request
    return this.http.put<Panier>(
      `${this.apiUrl}/ajouterProduitAuPanier/${userId}/${produitId}/${quantite}`,
      {}
    ).pipe(
      tap(response => console.log('Cart update response:', response)),
      catchError(error => {
        console.error(`Error adding product ${produitId} to cart:`, error);
        return throwError(() => new Error(`Failed to add product ${produitId} to cart: ${error.message}`));
      })
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

  // Update Panier total
  updatePanierTotal(panierId: number, total: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateTotal/${panierId}`, { total })
      .pipe(
        tap(response => console.log('Update total response:', response)),
        catchError(error => {
          console.error('Error updating total:', error);
          return throwError(() => error);
        })
      );
  }

  // Vérifier si un panier est validé
  checkIfPanierValidated(panier: Panier): boolean {
    // En fonction de votre modèle de données, vérifiez la propriété validated
    // Selon votre code, il semble que vous vérifiiez "validated === true"
    return panier.validated === true;
  }

  getAllPaniersByUserId(userId: number): Observable<Panier[]> {
    return this.http.get<Panier[]>(`${this.apiUrl}/getAllPaniersByUserId/${userId}`).pipe(
      tap(response => console.log('API Response:', response)), // Debug log
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => error);
      })
    );
  }

  validatePanier(panierId: number): Observable<Panier> {
    return this.http.put<Panier>(`${this.apiUrl}/validatePanier/${panierId}`, {}).pipe(
      tap(response => console.log('Panier validated:', response)),
      catchError(error => {
        console.error('Error validating panier:', error);
        return throwError(() => error);
      })
    );
  }
}
