import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthServiceService } from '../services/auth-service.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { NgxCaptchaModule } from 'ngx-captcha';
import {AuthenticationRequest} from '../models/AuthenticationRequest';
import { User } from '../models/User';
import { WebsocketService } from 'src/app/pages/gestion-user/services/websocket.service';
import { UserServiceService } from '../services/user-service.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})

// Signin Component
export class SigninComponent {
  failedAttempts = 0;
maxAttempts = 3;

  // set the currenr year
  year: number = new Date().getFullYear();
  fieldTextType!: boolean;
  loginuser!:AuthenticationRequest;
  loginForm: FormGroup;
  errorLoginMessage = '';
  siteKey: string = '6LewnB4rAAAAAFWY26OgfY1IAx8-v9f5Z_zSVG31';
  currentUser: any | null = null;

  constructor(private authService: AuthServiceService,private router:Router,
    private websocketService: WebsocketService,
    private userService:UserServiceService) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]), // Added email validator
      motDePasse: new FormControl('', [Validators.required]), // Keep password required
      rememberMe: new FormControl(false),
      recaptcha: new FormControl('', Validators.required)
    });
  }
  
  onSubmit() {
    this.errorLoginMessage = '';
  
    if (this.loginForm.valid) {
      const loginUser = {
        email: this.loginForm.get('email')?.value,
        motDePasse: this.loginForm.get('motDePasse')?.value,
        recaptchaToken: this.loginForm.get('recaptcha')?.value
      };
  
      this.authService.authenticate(loginUser).subscribe(
        (response: any) => {
          // Reset failed attempts on success
          this.failedAttempts = 0;
  
          // Wait for user data before continuing
          this.authService.handleLoginSuccess(response).subscribe(
            (user: User) => {
              this.currentUser = user;
              const authority = this.currentUser.authorities[0]?.authority;
  
              this.websocketService.connect(localStorage.getItem('authToken'), this.currentUser.id); // pass userId too
  
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
            errorMessage = error?.error?.message || 'Login failed. Please check your credentials.';
          }
  
          this.failedAttempts++;
  
          if (this.failedAttempts >= this.maxAttempts) {
            // Block user after 3 failed attempts
            this.userService.blockUserFailByEmail(this.loginForm.get('email')?.value).subscribe(() => {
              Swal.fire({
                icon: 'error',
                title: 'Account Blocked',
                text: 'Your account has been blocked due to 3 failed login attempts.',
              });
  
              // Disable form after blocking
              this.loginForm.disable();
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Login Failed',
              text: errorMessage + ` (${this.maxAttempts - this.failedAttempts} attempts left)`,
            });
          }
  
          this.errorLoginMessage = errorMessage;
        }
      );
    }
  }
  
  

  
  // Toggle the visibility of the password
  toggleFieldTextType(): void {
    this.fieldTextType = !this.fieldTextType;
  }

 
}
