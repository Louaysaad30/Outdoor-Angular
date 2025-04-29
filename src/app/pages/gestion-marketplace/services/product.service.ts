import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';
import { environment } from 'src/environments/environment';
import { ProductImageService } from './product-image.service'; // Adjust the path as needed

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:9093/Produit';

  constructor(private http: HttpClient) { }

  // Add new product
  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/add`, product);
  }

  // Get all products
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/getAllProduits`);
  }

  // Get product by ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/get/${id}`);
  }

  // Update product
  updateProduct(id: number, productData: any): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/update/${id}`, productData);
  }

  // Delete product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Assign product to category
  assignProductToCategory(productId: number, categoryId: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/affecterProduitCategorie/${productId}/${categoryId}`, null);
  }

  // Assign product to product code
  assignProductToProductCode(productId: number, codeId: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/affecterProduitCodeProduit/${productId}/${codeId}`, {});
  }

  // Upload image
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  // Add this method temporarily if needed
  addProductImage(productId: number, imageUrl: string): Observable<any> {
    // This is just a wrapper that calls the proper service
    const productImageService = new ProductImageService(this.http);
    return productImageService.addImageToProduct(productId, imageUrl);
  }



  
}
