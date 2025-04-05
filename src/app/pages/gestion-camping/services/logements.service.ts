import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Logement} from "../model/logments.model";

@Injectable({
  providedIn: 'root'
})
export class LogementService {

  private baseUrl = 'http://localhost:9092/Camping-Service/Logement'; // Adjust the base URL as needed

  constructor(private http: HttpClient) { }

  getAllLogements(): Observable<Logement[]> {
    return this.http.get<Logement[]>(`${this.baseUrl}/all`);
  }

  addLogement(logement: Logement): Observable<Logement> {
    return this.http.post<Logement>(`${this.baseUrl}/add`, logement);
  }

  updateLogement(logement: Logement): Observable<Logement> {
    return this.http.put<Logement>(`${this.baseUrl}/update`, logement);
  }

  getLogement(id: number): Observable<Logement> {
    return this.http.get<Logement>(`${this.baseUrl}/get/${id}`);
  }

  deleteLogement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  uploadImage(file: File): Observable<{ message: string, fileUrl: string }> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{ message: string, fileUrl: string }>(`${this.baseUrl}/upload`, formData);
  }
  getLogementsByCentre(centreId: number): Observable<Logement[]> {
    return this.http.get<Logement[]>(`${this.baseUrl}/byCentre/${centreId}`);
  }
}
