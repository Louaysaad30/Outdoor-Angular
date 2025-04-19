import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../models/Commande';
import { environment } from 'src/environments/environment';
import { tap, catchError, map } from 'rxjs/operators';
import { LigneCommande } from '../models/LigneCommande';
import { Status } from '../models/Status';
import { UpdateStateCommand } from '../models/DTO/UpdateStateCommand';
import { method } from 'lodash';

interface StripeCheckoutResponse {
  checkoutUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  private baseUrl = 'http://localhost:9093/Commande';
  private paymentUrl = 'http://localhost:9093/api/payment'; // Adjust if your payment endpoint is on a different URL

  constructor(private http: HttpClient) { }

  // Create a Stripe checkout session and return the redirect URL
  createStripeCheckoutSession(customData?: any): Observable<string> {
    return this.http.post<StripeCheckoutResponse>(
      `${this.paymentUrl}/create-checkout-session`,
      customData || {}
    ).pipe(
      tap(response => console.log('Stripe checkout session created:', response)),
      map(response => response.checkoutUrl), // Extract just the URL
      catchError(error => {
        console.error('Error creating Stripe checkout session:', error);
        throw error;
      })
    );
  }

  // Method to redirect to Stripe checkout
  redirectToStripeCheckout(): Observable<never> {
    return this.createStripeCheckoutSession().pipe(
      tap(checkoutUrl => {
        // Redirect the browser to the Stripe checkout page
        window.location.href = checkoutUrl;
      }),
      // This observable will never complete normally since we're redirecting
      map(() => {
        throw new Error('Redirect to payment gateway in progress');
      })
    );
  }

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
        OrderNumber: commande.OrderNumber,
        paymentMethod: commande.paymentMethod,
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

  downloadInvoice(commandeId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/downloadInvoice/${commandeId}`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('Invoice downloaded successfully for order', commandeId);

        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `facture_${commandeId}.pdf`;

        // Create a download link and trigger the download
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();

          // Clean up
          window.URL.revokeObjectURL(url);
        }
      }),
      catchError(error => {
        console.error(`Error downloading invoice for order ${commandeId}:`, error);
        throw error;
      }),
      // Extract just the blob body from the response and handle null case
      map(response => response.body || new Blob())
    );
  }

  updateOrderStatus(dto: UpdateStateCommand): Observable<Commande> {
    return this.http.put<Commande>(
      `${this.baseUrl}/updateStatus/${dto.idCommande}`,
      dto
    ).pipe(
      tap(updatedOrder => console.log(`Order ${dto.idCommande} status updated`)),
      catchError(error => {
        console.error(`Error updating status for order ${dto.idCommande}:`, error);
        throw error;
      })
    );
  }

  // Add this method to get all orders for a user
  getCommandesByUserId(userId: number): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.baseUrl}/getByUserId/${userId}`)
      .pipe(
        tap(orders => console.log(`Found ${orders.length} orders for user ${userId}`)),
        catchError(error => {
          console.error('Error fetching orders by user:', error);
          throw error;
        })
      );
  }
}
