import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reservation } from '../models/reservation.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private apiUrl = 'http://localhost:9095/api/demandes';

  constructor(private http: HttpClient) {}

  getReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(this.apiUrl);
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`);
  }

  createReservation(reservation: Reservation): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservation);
  }

  updateReservation(id: number, reservation: Reservation): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}`, reservation);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getReservationsByUserId(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/by-user/${userId}`);
  }

  // Method to check vehicle availability
  checkAvailability(vehicleId: string, startDate: string, endDate: string): Observable<boolean> {
    const url = `${this.apiUrl}/check-availability?vehicleId=${vehicleId}&startDate=${startDate}&endDate=${endDate}`;
    return this.http.get<boolean>(url);
  }
}