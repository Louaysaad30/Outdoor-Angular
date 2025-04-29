import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ReservationRequest } from '../models/reservation-request.model';
import { Observable } from 'rxjs';
import { Reservation } from '../models/reservation.model'; 
import { UserReservation } from '../models/UserReservation.model'; // attention au nom du fichier aussi !

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private baseUrl = 'http://localhost:9094/Formation-Service/api/reservations';

  constructor(private http: HttpClient) {}

  // 🟢 Create a reservation with User-ID in header
  createReservation(reservation: ReservationRequest, userId: number): Observable<any> {
    const headers = new HttpHeaders({
      'User-ID': userId.toString()
    });

    return this.http.post(`${this.baseUrl}`, reservation, { headers });
  }

  // 🔵 ADMIN: get all reservations
  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}`);
  }

  // 🔵 ADMIN: confirm a reservation
  confirmReservation(reservationId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/confirm/${reservationId}`, {});
  }

  // 🔵 ADMIN: cancel a reservation
  cancelReservation(reservationId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/cancel/${reservationId}`, {});
  }

  // 🔵 USER: get my reservations
  getReservationsForUser(userId: number): Observable<UserReservation[]> {
    return this.http.get<UserReservation[]>(`${this.baseUrl}/user/${userId}`);
  }
}
