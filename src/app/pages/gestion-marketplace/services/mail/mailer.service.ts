
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MailerService {
  private apiUrl =  'http://localhost:9093'; // Ajustez selon votre configuration

  constructor(private http: HttpClient) { }

  /**
   * Envoie un email via l'API backend
   * @param to Adresse email du destinataire
   * @param subject Sujet de l'email
   * @param body Contenu de l'email
   * @returns Observable avec la réponse du serveur
   */
  sendEmail(to: string, subject: string, body: string): Observable<string> {
    const payload = {
      to,
      subject,
      body,
      contentType: 'text/html' // Add this line to specify HTML content

    };

    return this.http.post<string>(`${this.apiUrl}/api/mail/send`, payload);
  }

  /**
   * Envoie une notification d'ordre à l'utilisateur
   * @param email Email du destinataire
   * @param orderNumber Numéro de commande
   * @param orderStatus Statut de la commande
   * @returns Observable avec la réponse du serveur
   */
  sendOrderNotification(email: string, orderNumber: string, orderStatus: string): Observable<string> {
    const subject = `Order ${orderNumber} - ${orderStatus}`;
    const body = `
      Dear Customer,

      Your order #${orderNumber} has been ${orderStatus.toLowerCase()}.

      Thank you for shopping with Outdoor!

      Best regards,
      The Outdoor Team
    `;

    return this.sendEmail(email, subject, body);
  }

  /**
   * Envoie un email de confirmation après l'achat
   * @param email Email du destinataire
   * @param orderDetails Détails de la commande
   * @returns Observable avec la réponse du serveur
   */
  sendOrderConfirmation(email: string, orderDetails: any): Observable<string> {
    const subject = `Order Confirmation - Outdoor`;

    // Construire le corps de l'email avec les détails de la commande
    let body = `
      Dear ${orderDetails.customerName || 'Customer'},

      Thank you for your purchase! Your order #${orderDetails.orderNumber} has been received.

      Order Summary:
      ---------------
      Order Number: ${orderDetails.orderNumber}
      Date: ${new Date().toLocaleDateString()}
      Total Amount: ${orderDetails.total} TND

      Your order will be processed shortly. You will receive a confirmation email when your order is shipped.

      For any questions, please contact our customer service.

      Best regards,
      The Outdoor Team
    `;

    return this.sendEmail(email, subject, body);
  }
}
