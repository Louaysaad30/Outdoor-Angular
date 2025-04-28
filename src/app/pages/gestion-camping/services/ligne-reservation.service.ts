import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {LigneReservation} from "../model/ligneReservation.model";

@Injectable({
  providedIn: 'root'
})
export class LigneReservationService {

  private apiUrl = 'http://localhost:9092/Camping-Service/LigneReservation';

  constructor(private http: HttpClient) {}

  getAllLigneReservations(): Observable<LigneReservation[]> {
    return this.http.get<LigneReservation[]>(`${this.apiUrl}/all`);
  }

  addLigneReservation(ligneReservation: LigneReservation): Observable<LigneReservation> {
    return this.http.post<LigneReservation>(`${this.apiUrl}/add`, ligneReservation);
  }

  updateLigneReservation(id: number, ligneReservation: LigneReservation): Observable<LigneReservation> {
    return this.http.put<LigneReservation>(`${this.apiUrl}/update/${id}`, ligneReservation);
  }

  getLigneReservation(id: number): Observable<LigneReservation> {
    return this.http.get<LigneReservation>(`${this.apiUrl}/get/${id}`);
  }

  deleteLigneReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
  deleteLigneReservationsByReservationId(reservationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteByReservation/${reservationId}`);
  }

  }
