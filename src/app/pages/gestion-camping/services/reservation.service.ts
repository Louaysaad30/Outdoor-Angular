import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Reservation} from "../model/reservation.model";
import {map} from "rxjs/operators";
import {UserDto} from "../model/userDTO.model";
import {loadStripe, Stripe} from '@stripe/stripe-js';


@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private apiUrl = 'http://localhost:9092/Camping-Service/Reservation';
  private stripePromise = loadStripe('pk_test_51RGsB6H9bVUYUHF1jnUOujMYayju3c7QVyrn8L8zEUWBcLwSAqSg6HFzRAuVoDOh5bcgJhKvwQ43x5ncWsE52iVg00norMPh4S');
  private cardElement: any;

  constructor(private http: HttpClient) {}

  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/all`);
  }

  getUserById(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/user/${id}`);
  }
  getUsersByCentreId(centreId: number): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users/byCentre/${centreId}`);
  }

  addReservation(reservation: Reservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/add`, reservation);
  }

  updateReservation( reservation: Reservation): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/update}`, reservation);
  }

  getReservation(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/get/${id}`);
  }

  // Alternative fix for ReservationService
  deleteReservation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, {
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(() => ({ success: true }))
    );
  }

  getReservationsByCentre(centreId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/byCentre/${centreId}`);
  }
// Add to reservation.service.ts
  checkAvailability(request: {
    centreId: number,
    startDate: Date,
    endDate: Date,
    nbrPersonnes: number,
    items: {id: number, type: string, quantity: number}[]
  }): Observable<{
    available: boolean,
    personCapacityExceeded?: boolean,
    availableCapacity?: number,
    unavailableItems?: {id: number, name: string, type: string, availableQuantity: number}[]
  }> {
    return this.http.post<any>(`${this.apiUrl}/checkAvailability`, request);

  }

  getReservationsByClientId(clientId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/byClient/${clientId}`);
  }

  getConfirmedReservationsByCentreId(centreId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/confirmed/byCentre/${centreId}`);
  }

  confirmReservation(idReservation: number): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/confirm/${idReservation}`, {});
  }

  processPayment(reservationId: number, amount: number): Observable<any> {
    const request = {
      reservationId: reservationId,
      amount: amount,
      currency: 'usd' // Make sure to use lowercase as required by your backend
    };
    return this.http.post(`${this.apiUrl}/payment/process`, request);
  }


  getPaymentHistory(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${clientId}`);
  }


  getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  setCardElement(cardElement: any): void {
    this.cardElement = cardElement;
  }

}
