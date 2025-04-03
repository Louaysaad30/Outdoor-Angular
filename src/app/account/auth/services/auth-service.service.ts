import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RegistrationRequest } from '../models/RegistrationRequest';
import { Observable } from 'rxjs';
import { AuthenticationRequest } from '../models/AuthenticationRequest ';
import { AuthenticationResponse } from '../models/AuthenticationResponse ';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  private apiUrl = `http://localhost:9096/auth`; // Backend API URL

  constructor(private http: HttpClient) {}

  register(request: RegistrationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, request);
  }

  authenticate(request: AuthenticationRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.apiUrl}/authenticate`, request);
  }

  activateAccount(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/activate-account?token=${token}`);
  }
}
