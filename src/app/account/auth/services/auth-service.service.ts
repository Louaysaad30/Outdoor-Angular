import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RegistrationRequest } from '../models/RegistrationRequest';
import {  Observable, BehaviorSubject, tap  } from 'rxjs';
import { AuthenticationRequest } from '../models/AuthenticationRequest';
import { User } from '../models/User';
import { jwtDecode } from 'jwt-decode';
import { UserServiceService } from './user-service.service';
import { WebsocketService } from 'src/app/pages/gestion-user/services/websocket.service';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private apiUrl = `http://localhost:9096/auth`; // Backend API URL
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private userUpdatedSubject = new BehaviorSubject<void>(undefined);
  public userUpdated$ = this.userUpdatedSubject.asObservable();

  constructor(private http: HttpClient, private userService: UserServiceService,private websocketService:WebsocketService) {}
  // Get token from local storage
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Get current user info from the JWT token
  getCurrentUser(): any | null {
    const token = this.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return decoded; // This gives the user info from the decoded token
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  // Fetch user by email from the backend using UserService
  getUserByEmail(email: string): Observable<User> {
    return this.userService.getUserByEmail(email);
  }

  // Set current user in session
  setCurrentUser(user: User): void {
    sessionStorage.setItem('currentUser', JSON.stringify(user)); // Store user in session storage
    localStorage.setItem('user', JSON.stringify(user)); // Store user in local storage
    this.currentUserSubject.next(user); // Update the BehaviorSubject
  }


  notifyUserUpdated(): void {
    this.userUpdatedSubject.next();
  }

  // Get current user from session
  getSessionUser(): User | null {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  // Authenticate user and fetch user data
  authenticate(request: AuthenticationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/authenticate`, request);
  }
  handleLoginSuccess(response: any): Observable<User> {
    localStorage.setItem('authToken', response.token);
    const decodedToken: any = jwtDecode(response.token);
    const email = decodedToken.sub;
  
    return this.getUserByEmail(email).pipe(
      tap((user: User) => {
        this.setCurrentUser(user);
        console.log('User data:', user);
      })
    );
  }
  
  // Register a user
  register(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl+'/register', formData);
  }
  

  // Activate the account
  activateAccount(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/activate-account?token=${token}`);
  }
  resendActivationToken(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-token`, null, {
      params: { email },
    });
  }
  
// In your auth service or component
logout() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // First disconnect WebSocket
  this.websocketService.disconnect(user.id);
  
  // Then clear storage after a small delay
  setTimeout(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('currentUser');
      this.currentUserSubject.next(null);
  }, 500);
  
}
  verifyPassword(userId: number, password: string): Observable<any> {
    const body = { userId, password };
    return this.http.post(`${this.apiUrl}/verify-password`, body); // Ensure the URL matches the backend
  }
  changePassword(data: { userId: string; oldPassword: string; newPassword: string }) {
    return this.http.put(`${this.apiUrl}/change-password`, data);
  }
  sendResetLink(email: string) {
    // Send as {email: string} to match backend @RequestBody
    return this.http.post(`${this.apiUrl}/forgot-password`, { email },{ responseType: 'text' });
  }
  resetPassword(token: string, newPassword: string): Observable<any> {
    const params = new HttpParams().set('token', token);
    return this.http.post(`${this.apiUrl}/reset-password`, { newPassword }, { params });
  }
}