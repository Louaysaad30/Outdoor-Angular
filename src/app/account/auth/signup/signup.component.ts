import { Component } from '@angular/core';
import {  FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegistrationRequest } from '../models/RegistrationRequest';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})

// Signup Component
export class SignupComponent {

  // set the currenr year
  year: number = new Date().getFullYear();
  fieldTextType!: boolean;
  emailError: string | null = null;
  registrationForm: FormGroup;  
  register!:RegistrationRequest;

  constructor(private authService: AuthServiceService, private router: Router) 
  {
    this.registrationForm = new FormGroup({
      nom: new FormControl('', [Validators.required]),
      prenom: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      motDePasse: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}')
      ]),
      image: new FormControl(''),
      tel: new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]{8}$') // Ensures exactly 8 digits
      ]),
      dateNaissance: new FormControl('', [this.dateInThePastValidator()]),
    });
    
  }

  dateInThePastValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const date = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to midnight to compare dates without time component
  
      if (date >= today) {
        return { dateInThePast: 'Date of birth must be in the past' };
      }
      return null;
    };
  }

  onSubmit() {
    if (this.registrationForm.valid) {
      this.register=this.registrationForm.value;
      this.emailError = null; // Reset l'erreur avant de soumettre
      this.authService.register(this.register).subscribe(
        () => {
          Swal.fire({
            icon: 'success',
            title: 'Registration successful',
            text: 'You have been successfully registered.',
          });
          this.router.navigate(['/auth/signin']);
        },
        (error) => {
          console.error('Registration failed', error);
  
          // Vérifier si la réponse contient un message d'erreur JSON
          if (error) {
            if (error.includes('Email')) {
              this.emailError = error; // Stocker l'erreur pour affichage dans l'HTML
            }
          }
  
          Swal.fire({
            icon: 'error',
            title: 'Registration failed',
            text: this.emailError || 'Something went wrong. Please try again.',
          });
        }
      );
    } else {
      this.registrationForm.markAllAsTouched();
    }
  }
    /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

}
