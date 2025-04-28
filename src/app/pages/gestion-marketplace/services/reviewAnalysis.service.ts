import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReviewAnalysisResponse } from '../models/ReviewAnalysisResponse';

@Injectable({
  providedIn: 'root'
})
export class ReviewAnalysisService {
  private apiUrl = 'localhost:9093/Review/analyze'; // Remplacez par l'URL de votre API

  constructor(private http: HttpClient) {}

  getReviewAnalyses(): Observable<ReviewAnalysisResponse[]> {
    // Add http:// or https:// prefix to the URL and provide an empty object as the request body
    return this.http.post<ReviewAnalysisResponse[]>('http://localhost:9093/Review/analyze', {});
  }
}
