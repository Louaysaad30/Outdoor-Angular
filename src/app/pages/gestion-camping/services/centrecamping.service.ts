import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {finalize, Observable} from 'rxjs';
import { CentreCamping } from '../model/centrecamping.model';
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {AngularFirestore} from "@angular/fire/compat/firestore";

@Injectable({
  providedIn: 'root'
})
export class CentreCampingService {
  private apiUrl = 'http://localhost:9092/Camping-Service/CentreCamping';

  constructor(private http: HttpClient, private storage: AngularFireStorage, private firestore: AngularFirestore) {}

  getAllCentreCamping(): Observable<CentreCamping[]> {
    return this.http.get<CentreCamping[]>(`${this.apiUrl}/all`);
  }

  addCentreCamping(centreCamping: CentreCamping): Observable<CentreCamping> {
    return this.http.post<CentreCamping>(`${this.apiUrl}/add`, centreCamping);
  }

  uploadImage(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  updateCentreCamping(id: number, centreCamping: CentreCamping): Observable<CentreCamping> {
    return this.http.put<CentreCamping>(`${this.apiUrl}/update/${id}`, centreCamping);
  }

  getCentreCamping(id: number): Observable<CentreCamping> {
    return this.http.get<CentreCamping>(`${this.apiUrl}/get/${id}`);
  }

  deleteCentreCamping(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  getVerifiedCentreCamping(): Observable<CentreCamping[]> {
    return this.http.get<CentreCamping[]>(`${this.apiUrl}/verified`);
  }

  getCentreCampingByOwner(idOwner: number): Observable<CentreCamping[]> {
    return this.http.get<CentreCamping[]>(`${this.apiUrl}/my/${idOwner}`);
  }

  verifyCentreCamping(id: number): Observable<CentreCamping> {
    return this.http.put<CentreCamping>(`${this.apiUrl}/verify/${id}`, {});
  }

  deactivateCentreCamping(id: number): Observable<CentreCamping> {
    return this.http.put<CentreCamping>(`${this.apiUrl}/deactivate/${id}`, {});
  }

  analyzeText(text: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/analyze-sentiment`, text);
  }
}
