import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {
  private apiUrl = 'http://localhost:9096/user'; // adjust your backend URL
  private apiUrl1 = 'http://localhost:9096/ws'; // adjust your backend URL


  constructor(private http: HttpClient) {}

  // Get all users
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  getUsersWithConversations(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl1}/all/${userId}`);
  }
  
  predictChurn(userId: number): Observable<any> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post<string>(`${this.apiUrl}/predict-churn`, params);
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

  blockUserFailByEmail(email: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/block-fail-by-email`, { email });
  }
  
  // Unblock user
  unblockUser(id: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/unblock/${id}`, {});
  }

  // user.service.ts
  incrementNavigation(userId: number) {
    return this.http.post(`${this.apiUrl}/increment-navigation?userId=${userId}`, {});
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