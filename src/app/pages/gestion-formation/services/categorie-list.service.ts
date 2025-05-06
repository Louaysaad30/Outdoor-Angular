import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categorie } from '../models/categorie.model'; // adapte le chemin si besoin
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategorieService {
  private baseUrl = 'http://localhost:9094/Formation-Service/api/categories';

  constructor(private http: HttpClient) {}

  // 🔹 GET: All categories
  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(this.baseUrl);
  }

  // 🔹 GET: Category by ID
  getCategoryById(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${this.baseUrl}/${id}`);
  }

  // 🔹 POST: Add new category with image
  addCategory(formData: FormData): Observable<Categorie> {
    return this.http.post<Categorie>(this.baseUrl, formData).pipe(
      catchError(error => {
        console.error('Upload error:', error);
        return throwError(() => new Error('Erreur lors de l\'ajout de la catégorie.'));
      })
    );
  }
  
  // 🔹 DELETE: Delete category by ID
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  updateCategory(id: number, formData: FormData): Observable<Categorie> {
    return this.http.put<Categorie>(`${this.baseUrl}/${id}`, formData);
  }
  
}
