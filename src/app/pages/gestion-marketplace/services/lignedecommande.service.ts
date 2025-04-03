import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { LigneCommande } from '../models/LigneCommande';

@Injectable({
  providedIn: 'root'
})
export class LignedecommandeService {
  private apiUrl = 'http://localhost:9093/LigneCommande';

  constructor(private http: HttpClient) { }

  getAllLigneCommandes(): Observable<LigneCommande[]> {
    return this.http.get<LigneCommande[]>(`${this.apiUrl}/getAllLigneCommandes`);
  }

  addLigneCommande(ligneCommande: LigneCommande): Observable<LigneCommande> {
    return this.http.post<LigneCommande>(`${this.apiUrl}/addLigneCommande`, ligneCommande);
  }

  updateLigneCommande(ligneCommande: LigneCommande): Observable<LigneCommande> {
    return this.http.put<LigneCommande>(`${this.apiUrl}/update`, ligneCommande);
  }

  getLigneCommandeById(id: number): Observable<LigneCommande> {
    return this.http.get<LigneCommande>(`${this.apiUrl}/get/${id}`);
  }

  deleteLigneCommande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getLigneCommandesByPanierId(panierId: number): Observable<LigneCommande[]> {
    return this.http.get<LigneCommande[]>(`${this.apiUrl}/getByPanier/${panierId}`).pipe(
      tap(response => console.log('Backend response:', response)),
      map(lignes => lignes.map(ligne => ({
        ...ligne,
        idProduit: ligne.produit?.idProduit // This will be undefined if produit is null/undefined
      } as LigneCommande))), // Explicit type assertion
      tap(mapped => console.log('Mapped lignes with product IDs:', mapped))
    );
  }
}
