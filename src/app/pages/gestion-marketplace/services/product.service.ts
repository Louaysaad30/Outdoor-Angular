import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl ='http://localhost:9093/Produit';

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
  updateProduct(product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/update`, product);
  }

  // Delete product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Assign product to category
  assignProductToCategory(productId: number, categoryId: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/affecterProduitCategorie/${productId}/${categoryId}`, {});
  }

  // Unassign product from category
  unassignProductFromCategory(productId: number): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/desaffecterProduitCategorie/${productId}`, {});
  }
}
