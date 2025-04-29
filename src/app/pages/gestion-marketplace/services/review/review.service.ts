import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from '../../models/Review';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:9093/Review';

  constructor(private http: HttpClient) { }

  // Add a new review
  addReview(review: Review): Observable<Review> {
    // Créer un nouvel objet pour éviter de modifier l'original
    const reviewToSend = { ...review };

    // Extraire l'ID du produit
    const productId = reviewToSend.product?.idProduit;

    // Supprimer l'objet product qui cause des problèmes
    delete reviewToSend.product;

    // Ajouter productId comme paramètre de requête
    const params = new HttpParams().set('productId', productId?.toString() || '');

    console.log('Sending review to server:', JSON.stringify(reviewToSend), 'with productId:', productId);
    return this.http.post<Review>(`${this.apiUrl}/add`, reviewToSend, { params });
  }

  // Update an existing review
  updateReview(review: Review): Observable<Review> {
    return this.http.put<Review>(`${this.apiUrl}/update`, review);
  }

  // Delete a review by ID
  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Get a review by ID
  getReviewById(id: number): Observable<Review> {
    return this.http.get<Review>(`${this.apiUrl}/${id}`);
  }

  // Get all reviews
  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/all`);
  }

  // Get reviews by product ID
  getReviewsByProductId(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/product/${productId}`);
  }
}
