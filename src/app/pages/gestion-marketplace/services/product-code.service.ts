import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CodeProduit } from '../models/CodeProduit';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductCodeService {
  private apiUrl = 'http://localhost:9093/CodeProduit';

  constructor(private http: HttpClient) { }

  // Add new product code
  addProductCode(codeProduit: CodeProduit): Observable<CodeProduit> {
    return this.http.post<CodeProduit>(`${this.apiUrl}/add`, codeProduit);
  }

  // Get product code by code
  getProductCodeByCode(code: string): Observable<CodeProduit> {
    return this.http.get<CodeProduit>(`${this.apiUrl}/get/${code}`);
  }

  // Delete product code
  deleteProductCode(idCodeProduit: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${idCodeProduit}`);
  }

  // Update product code
  updateProductCode(codeProduit: CodeProduit): Observable<CodeProduit> {
    return this.http.put<CodeProduit>(`${this.apiUrl}/update`, codeProduit);
  }

  // Get all product codes
  getAllProductCodes(): Observable<CodeProduit[]> {
    return this.http.get<CodeProduit[]>(`${this.apiUrl}/getAllCodeProduits`);
  }

  // Check if product code exists
  checkProductCodeExists(code: string): Observable<boolean> {
    return this.getAllProductCodes().pipe(
      map(codes => codes.some(c => c.code.toLowerCase() === code.toLowerCase()))
    );
  }
}
