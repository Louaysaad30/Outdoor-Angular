import { Injectable } from '@angular/core';
      import { HttpClient, HttpErrorResponse } from '@angular/common/http';
      import { Observable, throwError } from 'rxjs';
      import { catchError, tap } from 'rxjs/operators';
      import { TicketReservation } from '../models/ticketReservation.model';

      @Injectable({
        providedIn: 'root'
      })
      export class ReservationService {
        private apiUrl = 'http://localhost:9091/api/reservations';

        constructor(private http: HttpClient) { }

        getAllReservations(): Observable<TicketReservation[]> {
          return this.http.get<TicketReservation[]>(this.apiUrl)
            .pipe(catchError(this.handleError));
        }

        getReservationsByUserId(userId: number): Observable<TicketReservation[]> {
          return this.http.get<TicketReservation[]>(`${this.apiUrl}/user/${userId}`)
            .pipe(catchError(this.handleError));
        }

        createReservation(reservation: TicketReservation): Observable<TicketReservation> {
          console.log('Sending reservation payload:', JSON.stringify(reservation));
          return this.http.post<TicketReservation>(this.apiUrl, reservation)
            .pipe(
              tap(response => console.log('Reservation response:', response)),
              catchError((error: HttpErrorResponse) => {
                console.error('Reservation error details:', error.error);
                return throwError('Failed to reserve ticket. Please try again.');
              })
            );
        }

        deleteReservation(id: number): Observable<void> {
          return this.http.delete<void>(`${this.apiUrl}/${id}`)
            .pipe(catchError(this.handleError));
        }

        private handleError(error: HttpErrorResponse) {
          console.error('API Error:', error);
          let errorMsg = 'An error occurred';

          if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMsg = `Error: ${error.error.message}`;
          } else {
            // Server-side error
            errorMsg = `Error Code: ${error.status}, Message: ${error.message}`;
            if (typeof error.error === 'object' && error.error !== null) {
              console.error('Error body:', error.error);
            }
          }

          return throwError(errorMsg);
        }
      }
