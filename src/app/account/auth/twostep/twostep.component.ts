import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';

@Component({
  selector: 'app-twostep',
  templateUrl: './twostep.component.html',
  styleUrls: ['./twostep.component.scss']
})
  
// Two step component
export class TwostepComponent {
  email: string = '';
  otpCode: string = '';

  constructor(   private route: ActivatedRoute,
    private router: Router,
    private authService: AuthServiceService) {}
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  onOtpChange(otp: string) {
    this.otpCode = otp;
  }

  confirmOtp() {
    if (this.otpCode.length !== 6) {
      alert('Please enter the full 6-digit code.');
      return;
    }

    this.authService.activateAccount(this.otpCode).subscribe({
      next: () => {
        alert('Account successfully activated!');
        this.router.navigate(['/auth/signin']);
      },
      error: err => {
        console.error('Activation failed:', err);
        alert('Invalid or expired code. Please try again.');
      }
    });
  }
  resendCode() {
    if (this.email) {
      this.authService.resendActivationToken(this.email).subscribe({
        next: (res) => {
          alert('Activation code resent. Check your inbox!');
        },
        error: (err) => {
          alert(err || 'Error resending code.');
        }
      });
    } else {
      alert('Email is required.');
    }
  }
  
  // set the currenr year
  year: number = new Date().getFullYear();

  config = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    placeholder: '',
    inputStyles: {
      'width': '80px',
      'height': '50px'
    }
  };
  
}
