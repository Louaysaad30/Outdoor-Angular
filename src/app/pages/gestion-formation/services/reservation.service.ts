import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReservationRequest } from '../models/reservation-request.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private baseUrl = 'http://localhost:9094/Formation-Service/api/reservations'; 

  constructor(private http: HttpClient) {}

  createReservation(reservation: ReservationRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}`, reservation);
  }

  getUserReservations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/my-reservations`);
  }
}
