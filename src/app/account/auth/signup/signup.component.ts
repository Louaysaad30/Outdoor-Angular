import { Component } from '@angular/core';
import {  FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegistrationRequest } from '../models/RegistrationRequest';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})

// Signup Component
export class SignupComponent {
onFileSelected($event: Event) {
throw new Error('Method not implemented.');
}
  // set the currenr year
  year: number = new Date().getFullYear();
  fieldTextType!: boolean;
  registrationForm: FormGroup;  
  register!:RegistrationRequest;
  constructor() {
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
      const formData: RegistrationRequest = this.registrationForm.value;
      this.register = formData;
      console.log('Registration Data:', this.register);
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
