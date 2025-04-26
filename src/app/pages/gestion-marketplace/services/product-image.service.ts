import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ProductImage {
  idImage: number;
  imageUrl: string;
  displayOrder: number;
  produit?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProductImageService {
  private apiUrl = 'http://localhost:9093/ProductImage';


  constructor(private http: HttpClient) { }

  /**
   * Get all product images
   */
  getAllProductImages(): Observable<ProductImage[]> {
    return this.http.get<ProductImage[]>(this.apiUrl);
  }

  /**
   * Get a specific product image by ID
   */
  getProductImageById(imageId: number): Observable<ProductImage> {
    return this.http.get<ProductImage>(`${this.apiUrl}/${imageId}`);
  }

  /**
   * Get all images for a specific product
   */
  getImagesByProductId(productId: number): Observable<ProductImage[]> {
    return this.http.get<ProductImage[]>(`${this.apiUrl}/product/${productId}`);
  }

  /**
   * Add a new image to a product
   */
  addImageToProduct(productId: number, imageUrl: string): Observable<ProductImage> {
    return this.http.post<ProductImage>(`${this.apiUrl}/product/${productId}`, imageUrl);
  }

  /**
   * Update a product image
   */
  updateProductImage(imageId: number, image: ProductImage): Observable<ProductImage> {
    return this.http.put<ProductImage>(`${this.apiUrl}/${imageId}`, image);
  }

  /**
   * Delete a product image
   */
  deleteProductImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${imageId}`);
  }

  /**
   * Set an image as the main product image
   */
  setMainProductImage(productId: number, imageId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/product/${productId}/main-image/${imageId}`, {});
  }

  /**
   * Reorder product images
   */
  reorderProductImages(productId: number, imageIdsInOrder: number[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/product/${productId}/reorder`, imageIdsInOrder);
  }
}
