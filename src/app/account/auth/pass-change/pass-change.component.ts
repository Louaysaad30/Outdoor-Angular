import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthServiceService } from '../services/auth-service.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-pass-change',
  templateUrl: './pass-change.component.html',
  styleUrls: ['./pass-change.component.scss']
})
export class PassChangeComponent implements OnInit {
  year: number = new Date().getFullYear();
  fieldTextType = false;
  fieldTextType1 = false;
  resetForm!: FormGroup;
  token!: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthServiceService,
    private router: Router

  ) {}

  ngOnInit(): void {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });

    // Extract the token from URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
    });
  }

  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  toggleFieldTextType1() {
    this.fieldTextType1 = !this.fieldTextType1;
  }

  onResetPassword() {
    if (this.resetForm.invalid) return;
  
    const { password, confirmPassword } = this.resetForm.value;
  
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Passwords do not match!'
      });
      return;
    }
  
    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Password reset successful!'
        }).then(() => {
          this.router.navigate(['/auth/signin']);
        });
      },
      error: err => {
        console.error(err);
        if (err.status === 403) {
          Swal.fire({
            icon: 'error',
            title: 'Token Error',
            text: 'Token is invalid or has expired.'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err || 'Something went wrong!'
          });
        }
      }
    });
  }
  
  
}
