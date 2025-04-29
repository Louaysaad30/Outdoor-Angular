import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';
import Swal from 'sweetalert2';
import { UserServiceService } from '../services/user-service.service';
@Component({
  selector: 'app-pass-reset',
  templateUrl: './pass-reset.component.html',
  styleUrls: ['./pass-reset.component.scss']
})

// Password Reset 
export class PassResetComponent {
  // set the currenr year
  year: number = new Date().getFullYear();
 
  resetForm: FormGroup;
  submitted = false;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private auth: AuthServiceService,private userService:UserServiceService) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    this.submitted = true;
  
    // Check if the form is invalid
    if (this.resetForm.invalid) {
      return;
    }
  
    const email = this.resetForm.value.email;
  
    // First, check if the user exists by email
    this.userService.getUserByEmail(email).subscribe({
      next: (response) => {
        // If user is found, proceed with sending the reset link
        this.auth.sendResetLink(email).subscribe({
          next: (response: any) => {
            // Handle success response
            Swal.fire({
              title: 'Success!',
              text: response?.message || 'Password reset link sent to your email',
              icon: 'success',
              confirmButtonText: 'OK'
            });
            this.resetForm.reset();
            this.submitted = false;
          },
          error: (error: any) => {
            // Handle error while sending reset link
            console.log('Full error response:', error);
  
            Swal.fire({
              title: 'Error!',
              text: 'An error occurred.',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      },
      error: (error: any) => {
        // Handle error when checking user existence
        console.log('Full error response:', error);
  
        Swal.fire({
          title: 'Error!',
          text: 'An error occurred while checking the user the user/email is not found. Please try again later.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }
  
       
   
}
