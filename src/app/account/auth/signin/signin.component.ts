import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthServiceService } from '../services/auth-service.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

import {AuthenticationRequest} from '../models/AuthenticationRequest';
import { User } from '../models/User';
import { JSONParser } from '@amcharts/amcharts5';
import { WebsocketService } from 'src/app/pages/gestion-user/services/websocket.service';
import { UserServiceService } from '../services/user-service.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})

// Signin Component
export class SigninComponent {
  // set the currenr year
  year: number = new Date().getFullYear();
  fieldTextType!: boolean;
  loginuser!:AuthenticationRequest;
  loginForm: FormGroup;
  errorLoginMessage = '';

  currentUser: any | null = null;

  constructor(private authService: AuthServiceService,private router:Router,
    private websocketService: WebsocketService,
    private userService:UserServiceService) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]), // Added email validator
      motDePasse: new FormControl('', [Validators.required]), // Keep password required
      rememberMe: new FormControl(false),
    });
  }

  onSubmit() {
    this.errorLoginMessage = '';
  
    if (this.loginForm.valid) {
      const loginUser = {
        email: this.loginForm.get('email')?.value,
        motDePasse: this.loginForm.get('motDePasse')?.value
      };
  
      this.authService.authenticate(loginUser).subscribe(
        (response: any) => {
          // Wait for user data before continuing
          this.authService.handleLoginSuccess(response).subscribe(
            (user: User) => {
              this.currentUser = user;
              const authority = this.currentUser.authorities[0]?.authority;
              this.websocketService.connect(localStorage.getItem('authToken')); // pass userId too
              Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: 'You are now logged in!',
              }).then(() => {
                if (authority === 'ADMIN') {
                  this.router.navigate(['/userback']);
                } else if (authority === 'USER') {
                  this.router.navigate(['/userfront']);
                } else if (authority === 'AGENCE') {
                  this.router.navigate(['/transportback']);
                } else if (authority === 'OWNER') {
                  this.router.navigate(['/campingback']);
                } else if (authority === 'FORMATEUR') {
                  this.router.navigate(['/formationback']);
                } else if (authority === 'EVENT_MANAGER') {
                  this.router.navigate(['/eventback']);
                } else {
                  this.router.navigate(['/auth/signin']);
                }
              });
            },
            (error) => {
              console.error('Error fetching user details', error);
              Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'Could not load user data.',
              });
            }
          );
        },
        (error) => {
          console.error('Login error:', error);
          let errorMessage = 'Unknown error. Please try again.';
          if (error.status === 0) {
            errorMessage = 'Unable to connect to server. Please check your backend.';
          } else {
            errorMessage = error || 'Login failed. Please check your credentials.';
          }
  
          this.errorLoginMessage = errorMessage;
  
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: errorMessage
          });
        }
      );
    }
  }
  
  
  // Toggle the visibility of the password
  toggleFieldTextType(): void {
    this.fieldTextType = !this.fieldTextType;
  }

 
}
