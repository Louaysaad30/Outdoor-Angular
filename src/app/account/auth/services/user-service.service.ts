import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {
  private apiUrl = 'http://localhost:9096/user'; // adjust your backend URL

  constructor(private http: HttpClient) {}

  // Get all users
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/all`);
  }

  // Get user by ID
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // Get user by email
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/email/${email}`);
  }

  // Block user
  blockUser(id: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/block/${id}`, {});
  }

  // Unblock user
  unblockUser(id: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/unblock/${id}`, {});
  }


  updateUser(id: number, formData: FormData): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, formData);
  }
  
  verifyUser(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/verify/${userId}`, {});
  }
  
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  
  
}