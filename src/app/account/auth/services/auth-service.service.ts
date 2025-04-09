import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RegistrationRequest } from '../models/RegistrationRequest';
import {  Observable, BehaviorSubject  } from 'rxjs';
import { AuthenticationRequest } from '../models/AuthenticationRequest';
import { User } from '../models/User';
import { jwtDecode } from 'jwt-decode';
import { UserServiceService } from './user-service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private apiUrl = `http://localhost:9096/auth`; // Backend API URL
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient, private userService: UserServiceService) {}

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
    this.currentUserSubject.next(user); // Update the BehaviorSubject
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

  // Handle login response and store user and token
  handleLoginSuccess(response: any): void {
    // Save the token
    localStorage.setItem('authToken', response.token);

    // Decode token to get the user's email
    const decodedToken: any = jwtDecode(response.token);
    const email = decodedToken.sub;

    // Fetch the user details by email
    this.getUserByEmail(email).subscribe(
      (user: User) => {
        this.setCurrentUser(user); // Store user in session
        console.log('User data:', user);
      },
      (error) => {
        console.error('Error fetching user details', error);
      }
    );
  }

  // Register a user
  register(request: RegistrationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request);
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
  
  logout() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null); // Clear BehaviorSubject
  }
  verifyPassword(userId: number, password: string): Observable<any> {
    const body = { userId, password };
    return this.http.post(`${this.apiUrl}/verify-password`, body); // Ensure the URL matches the backend
  }
}