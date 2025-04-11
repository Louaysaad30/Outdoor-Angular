import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthServiceService } from '../services/auth-service.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

import {AuthenticationRequest} from '../models/AuthenticationRequest';

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

  constructor(private authService: AuthServiceService,private router:Router) {
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
          console.log('Login successful:', response);
          Swal.fire({
            icon: 'success',
            title: 'Login Successful',
            text: 'You are now logged in!',
          });
  
          this.authService.handleLoginSuccess(response);
          
        //  this.router.navigate(['/userfront']);
          this.currentUser = this.authService.getSessionUser();
          console.log('Current user:', this.currentUser);
          localStorage.setItem('user', JSON.stringify(this.currentUser));
          const authority = this.currentUser.authorities[0]?.authority;


          // Navigation selon le rôle
          if (authority === 'ADMIN') {
            this.router.navigate(['/userback']);
          } else if (authority === 'USER') {
            this.router.navigate(['/userfront']);
          } else {
            // fallback (si aucun rôle reconnu)
            this.router.navigate(['/auth/signin']);
          }
          // case 'OWNER':
          //   this.router.navigate(['/campingback']);
          //   break;
          // case 'FORMATEUR':
          //   this.router.navigate(['/formationback']);
          //   break;
          // case 'EVENT_MANAGER':
          //   this.router.navigate(['/eventback']);
      
        },
        (error) => {
          console.error('Login error:', error);
  
          let errorMessage = 'Unknown error. Please try again.';
  
          if (error.status === 0) {
            // No connection / backend is offline
            errorMessage = 'Unable to connect to server. Please check your backend.';
          } else {
            // Directly access the error object and use it
            errorMessage = error || 'Login failed. Please check your credentials.';
          }
  
          // Store the error message for HTML display
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
