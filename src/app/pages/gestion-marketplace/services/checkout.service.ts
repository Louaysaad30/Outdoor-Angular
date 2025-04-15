import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../models/Commande';
import { environment } from 'src/environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { LigneCommande } from '../models/LigneCommande';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  private baseUrl = 'http://localhost:9093/Commande';

  constructor(private http: HttpClient) { }

  // Get all orders
  getAllCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.baseUrl}/getAllCommandes`);
  }

  // Add new order
  addCommande(commande: Commande): Observable<Commande> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    // Create a clean order object without any undefined values
    const orderData = {
        nom: commande.nom,
        phone: commande.phone,
        email: commande.email,
        city: commande.city,
        gouvernement: commande.gouvernement,
        adresse: commande.adresse,
        shippingMethod: commande.shippingMethod,
        AdditionalService: commande.AdditionalService,
        montantCommande: commande.montantCommande,
        dateCommande: commande.dateCommande.toISOString(),
        ligneCommande: commande.ligneCommande,
        userId: commande.userId,
        etat: commande.etat,
        OrderNumber: commande.OrderNumber
    };

    return this.http.post<Commande>(
        `${this.baseUrl}/addCommande`,
        orderData,
        { headers }
    ).pipe(
        tap(response => console.log('Server response:', response)),
        catchError(error => {
            console.error('Server error:', error);
            throw error;
        })
    );
  }

  // Update existing order
  updateCommande(commande: Commande): Observable<Commande> {
    return this.http.put<Commande>(`${this.baseUrl}/update`, commande);
  }

  // Get order by ID
  getCommande(idCommande: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.baseUrl}/get/${idCommande}`);
  }

  // Delete order
  deleteCommande(idCommande: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${idCommande}`);
  }

  // Add this method to your checkout service
  getCommandesByUserIdAndStatus(userId: number, status: string): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.baseUrl}/getByUserIdAndStatus/${userId}/${status}`)
      .pipe(
        tap(orders => console.log(`Found ${orders.length} orders for user ${userId} with status ${status}`)),
        catchError(error => {
          console.error('Error fetching orders by user and status:', error);
          throw error;
        })
      );
  }

  // Add this method to your service
  downloadInvoice(orderId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/invoice/${orderId}`, {
      responseType: 'blob',
      headers: new HttpHeaders().append('Accept', 'application/pdf')
    }).pipe(
      tap(() => console.log(`Invoice for order ${orderId} downloaded successfully`)),
      catchError(error => {
        console.error('Error downloading invoice:', error);
        throw error;
      })
    );
  }

  // Ajouter cette méthode à votre CheckoutService
getProductNamesByCommandeId(commandeId: number): Observable<string[]> {
  return this.http.get<string[]>(`${this.baseUrl}/getProductNamesByCommandeId/${commandeId}`)
    .pipe(
      tap(productNames => console.log(`Found ${productNames.length} products for order ${commandeId}`)),
      catchError(error => {
        console.error(`Error fetching product names for order ${commandeId}:`, error);
        throw error;
      })
    );
}
}
