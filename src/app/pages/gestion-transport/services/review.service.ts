import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { Vehicule } from '../models/vehicule.model';
import { Review } from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private baseUrl = 'http://localhost:9095/reviews';

  constructor(private http: HttpClient) {}

  getVehiculeById(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.baseUrl}/vehicules/${id}`);
  }


  
  getAllReviews(): Observable<Review[]> {
  return this.http.get<Review[]>(`${this.baseUrl}/all`);
}

  getReviewsByVehicule(vehiculeId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/${vehiculeId}`);  // Updated URL
  }
  
  
  addReview(vehiculeId: number, review: Review): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/${vehiculeId}`, review);
  }

  deleteReview(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Delete review error:', error);
        throw error; 
      })
    );
  }
}
