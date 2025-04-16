import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PCategorie } from '../models/PCategorie';

@Injectable({
  providedIn: 'root'
})
export class PCategoryService {
  private apiUrl = 'http://localhost:9093/PCategorie';


  constructor(private http: HttpClient) { }



  // Get all categories
  getAllCategories(): Observable<PCategorie[]> {
    return this.http.get<PCategorie[]>(`${this.apiUrl}/getAllCategories`);
  }

  // Add new category
  addCategory(category: PCategorie): Observable<PCategorie> {
    return this.http.post<PCategorie>(`${this.apiUrl}/addCategorie`, category);
  }

  // Update category
  updateCategory(category: PCategorie): Observable<PCategorie> {
    return this.http.put<PCategorie>(`${this.apiUrl}/update`, category);
  }

  // Get category by ID
  getCategoryById(id: number): Observable<PCategorie> {
    return this.http.get<PCategorie>(`${this.apiUrl}/get/${id}`);
  }

  // Delete category
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Check if category name exists
  checkCategoryNameExists(nomCategorie: string): Observable<boolean> {
    return this.getAllCategories().pipe(
      map(categories => categories.some(cat =>
        cat.nomCategorie.toLowerCase() === nomCategorie.toLowerCase()))
    );
  }
}
