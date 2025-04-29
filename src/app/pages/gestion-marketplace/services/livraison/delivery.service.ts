import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Livraison } from '../../models/Livraison';
import { DeliveryAssignmentDTO } from '../../models/DTO/DeliveryAssignmentDTO';
import { DeliveryStatusUpdateDto } from '../../models/DTO/DeliveryStatusUpdateDto';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = 'http://localhost:9093/Livraison';

  constructor(private http: HttpClient) { }

  getAllLivraisons(): Observable<Livraison[]> {
    return this.http.get<Livraison[]>(`${this.apiUrl}/getAllLivraisons`).pipe(
      tap(deliveries => console.log(`Retrieved ${deliveries.length} deliveries`)),
      catchError(error => {
        console.error('Error fetching deliveries:', error);
        throw error;
      })
    );
  }


  getLivraisonById(idLivraison: number): Observable<Livraison> {
    return this.http.get<Livraison>(`${this.apiUrl}/get/${idLivraison}`).pipe(
      tap(delivery => console.log(`Retrieved delivery with ID: ${idLivraison}`)),
      catchError(error => {
        console.error(`Error fetching delivery ${idLivraison}:`, error);
        throw error;
      })
    );
  }


  addLivraison(livraison: Livraison): Observable<Livraison> {
    console.log('Sending livraison to server:', JSON.stringify(livraison));
    return this.http.post<Livraison>(`${this.apiUrl}/addLivraison`, livraison).pipe(
      tap(response => {
        console.log(`Created new delivery with ID: ${response.idLivraison}`);
        console.log('Server response:', response);

        // Add warning if response has null livreurId despite sending it
        if (livraison.livreurId !== undefined && (response.livreurId === null && response.LivreurId === null)) {
          console.warn('Warning: Server returned livraison with null LivreurId and livreurid!');
        }
      }),
      catchError(error => {
        console.error('Error creating livraison:', error);
        throw error;
      })
    );
  }

  updateLivraison(livraison: Livraison): Observable<Livraison> {
    return this.http.put<Livraison>(`${this.apiUrl}/update`, livraison).pipe(
      tap(updatedDelivery => console.log(`Updated delivery with ID: ${updatedDelivery.idLivraison}`)),
      catchError(error => {
        console.error(`Error updating delivery ${livraison.idLivraison}:`, error);
        throw error;
      })
    );
  }


  deleteLivraison(idLivraison: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${idLivraison}`).pipe(
      tap(() => console.log(`Deleted delivery with ID: ${idLivraison}`)),
      catchError(error => {
        console.error(`Error deleting delivery ${idLivraison}:`, error);
        throw error;
      })
    );
  }

  getLivraisonByLivreurId(livreurId: number): Observable<Livraison[]> {
    return this.http.get<Livraison[]>(`${this.apiUrl}/getByLivreurId/${livreurId}`).pipe(
      tap(deliveries => console.log(`Retrieved ${deliveries.length} deliveries for livreur ID: ${livreurId}`)),
      catchError(error => {
        console.error(`Error fetching deliveries for livreur ${livreurId}:`, error);
        throw error;
      })
    );
  }

  // Add this method to your DeliveryService class
updateDeliveryStatus(idLivraison: number, dto: DeliveryStatusUpdateDto): Observable<Livraison> {
  return this.http.put<Livraison>(`${this.apiUrl}/updateLivraisonStatus/${idLivraison}`, dto).pipe(
    tap(updatedDelivery => console.log(`Updated delivery status for ID: ${updatedDelivery.idLivraison} to ${dto.etatLivraison}`)),
    catchError(error => {
      console.error(`Error updating delivery status for ${idLivraison}:`, error);
      return throwError(() => error); // Retournez l'erreur correctement
    })
  );
}


}
