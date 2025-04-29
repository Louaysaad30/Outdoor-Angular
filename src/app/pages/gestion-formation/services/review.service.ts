import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from '../models/review.model'; // adapt path if needed

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private apiUrl = 'http://localhost:9094/Formation-Service/api/reviews';

  constructor(private http: HttpClient) {}

  // Récupérer tous les avis pour une formation
  getReviewsByFormation(formationId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/formation/${formationId}`);
  }

  // Ajouter un nouvel avis
  addReview(review: Partial<Review>): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}`, review);
  }

  // Optionnel : Supprimer un avis
  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Optionnel : Modifier un avis
  updateReview(id: number, review: Partial<Review>): Observable<Review> {
    return this.http.put<Review>(`${this.apiUrl}/${id}`, review);
  }
  generateAIReview(formationId: number, titre: string, rating: number, userId?: number): Observable<Review> {
    const payload: any = {
      formationId,
      titre,
      rating
    };
    if (userId) {
      payload.userId = userId;
    }
    return this.http.post<Review>(`${this.apiUrl}/generate-ai`, payload);
  }
  
}
