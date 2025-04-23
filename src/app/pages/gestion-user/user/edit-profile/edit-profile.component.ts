import { Component } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BsDatepickerModule ,BsDatepickerConfig} from 'ngx-bootstrap/datepicker';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { SharedModule } from 'src/app/shared/shared.module';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserServiceService } from 'src/app/account/auth/services/user-service.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthServiceService } from 'src/app/account/auth/services/auth-service.service';



@Component({
  selector: 'app-edit-profile',
 standalone: true,
 imports: [
    TabsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    ProgressbarModule,
    BsDatepickerModule,
    NgSelectModule,
    SharedModule,
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent {
  currentUser: any;
  userForm!: FormGroup;
  changePasswordForm!: FormGroup;
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  fieldTextType!: boolean;
  fieldTextType1!: boolean;
  fieldTextType2!: boolean;
  bsConfig?: Partial<BsDatepickerConfig>;
  formGroups: FormGroup[] = [];
  educationForm!: FormGroup;
  currentTab = 'personalDetails';
  selectedFile: File | null = null;

  constructor(private formBuilder: FormBuilder,private fb: FormBuilder, private userService: UserServiceService, private router: Router,private authService:AuthServiceService) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    this.changePasswordForm = this.fb.group(
      {
        oldPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMismatch }
    );
    
    this.userForm = this.fb.group({
      nom: new FormControl(this.currentUser.nom, [Validators.required]),
      prenom: new FormControl(this.currentUser.prenom, [Validators.required]),
      tel: new FormControl(this.currentUser.tel, [
        Validators.required,
        Validators.pattern('^[0-9]{8}$') // Ensures exactly 8 digits
      ]),
      email: new FormControl(this.currentUser.email, [
        Validators.required,
        Validators.email
      ]),
      dateNaissance: new FormControl(this.currentUser.dateNaissance, [
        Validators.required,
        this.dateInThePastValidator() // Custom validator to ensure the date is in the past
      ]),
      location: new FormControl(this.currentUser.location, []), // Optional, adjust as needed
      // You can add additional fields if needed
      // If the backend expects specific attributes, ensure these names match exactly.
    //  image: new FormControl(this.currentUser.image || '', []), // Optional, assuming image is handled elsewhere
      // Add other fields as necessary (for example, 'motDePasse' for password, if required)
    });

    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: 'Pages', active: true },
      { label: 'Profile Settings', active: true }
    ];

    this.educationForm = this.formBuilder.group({
      degree: [''],
      name: [''],
      year: [''],
      to: [''],
      description: ['']
    });
    this.formGroups.push(this.educationForm);
}
onSubmit(): void {
  
  if (this.userForm.valid) {
    const formData = new FormData();

    // Append each field individually
    formData.append('nom', this.userForm.value.nom);
    formData.append('prenom', this.userForm.value.prenom);
    formData.append('tel', this.userForm.value.tel);
    formData.append('dateNaissance', this.userForm.value.dateNaissance);
    formData.append('email', this.userForm.value.email);
    formData.append('location', this.userForm.value?.location);
    // Append image file if selected
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    this.userService.updateUser(this.currentUser.id, formData).subscribe({
      next: (res) => {
        alert('Profile updated successfully!');
        localStorage.setItem('user', JSON.stringify(res));
        this.authService.notifyUserUpdated(); // tell other components to reload user data

        this.router.navigate(['/userfront/user/profile']);
      },
      error: (err) => {
        const errorMessage = err || 'Profile update failed. Please try again.';
        console.error('Update failed', err);
        alert(errorMessage);
      }
    });
  } else {
    alert('Form is invalid. Please check the inputs.');
  }
}
isAgence(): boolean {
  return this.currentUser?.authorities?.[0]?.authority === 'AGENCE';
}

  fileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Preview image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentUser.image = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  passwordMismatch(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }
  
  onSubmitChangePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      
      if (this.changePasswordForm.hasError('passwordMismatch')) {
        Swal.fire('Error!', 'New password and confirmation do not match.', 'error');
      } else {
        Swal.fire('Error!', 'Please fill all required fields correctly.', 'error');
      }
      return;
    }
  
    const formValues = this.changePasswordForm.value;
    const data = {
      userId: this.currentUser.id,
      oldPassword: formValues.oldPassword,
      newPassword: formValues.newPassword,
    };
  
    this.authService.changePassword(data).subscribe({
      next: (response: any) => {
        Swal.fire('Success!', response.message || 'Password changed successfully.', 'success');
        this.changePasswordForm.reset();
      },
      error: (error) => {
        console.log('Error:', error); // see the full object structure
      
        Swal.fire('Error!', error, 'error');
      }
      
    });
  }

  onDeleteAccount(): void {
    const enteredPassword = (document.getElementById('passwordInput') as HTMLInputElement).value;
    console.log('Entered Password:', enteredPassword); // Log entered password for debugging
    console.log(this.currentUser.id)
    // Send the password to the backend for verification
    this.authService.verifyPassword(this.currentUser.id, enteredPassword).subscribe(
      (res) => {
        console.log(res)
        // Check if the password verification response is correct
        if (res.message === 'Password is correct') {
          // Show the confirmation dialog if password is correct
          Swal.fire({
            title: 'Are you sure?',
            text: 'Once deleted, your account cannot be recovered!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete my account!',
          }).then((result) => {
              // Proceed to delete the user account
              this.userService.deleteUser(this.currentUser.id).subscribe(
                (deleteRes) => {
                  Swal.fire('Deleted!', 'Your account has been deleted.', 'success');
                  // Optionally, navigate away or log the user out after deletion
                  this.router.navigate(['/']);
                },
                (err) => {
                  console.error('Delete failed', err);
                  Swal.fire('Error!', 'There was an issue deleting your account. Please try again.', 'error');
                }
              );
            }
          );
        } else {
          // If password is incorrect, show an error message
          Swal.fire('Error!', 'Incorrect password. Please try again.', 'error');
        }
      },
      (err) => {
        console.log(err)
        if (err === 'Incorrect password'){  
            Swal.fire('Error!', 'Incorrect password. Please try again.', 'error');}
        else{

        // Handle any error from the backend (e.g., connection issues)
        console.error('Password verification failed:', err);
        Swal.fire('Error!', 'There was an issue verifying the password. Please try again.', 'error');
      }}
    );
  }

  dateInThePastValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const date = new Date(control.value);
      const today = new Date();
      return date < today ? null : { dateInThePast: true };
    };
  }

  onCancel(): void {
    this.userForm.reset(this.currentUser);
  }


  /**
  * Default Select2
  */
  selectedAccount = 'This is a placeholder';
  Skills = [
    { name: 'Illustrator' },
    { name: 'Photoshop' },
    { name: 'CSS' },
    { name: 'HTML' },
    { name: 'Javascript' },
    { name: 'Python' },
    { name: 'PHP' },
  ];

  // Change Tab Content
  changeTab(tab: string) {
    this.currentTab = tab;
  }


  /**
  * Password Hide/Show
  */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
  toggleFieldTextType1() {
    this.fieldTextType1 = !this.fieldTextType1
  }
  toggleFieldTextType2() {
    this.fieldTextType2 = !this.fieldTextType2;
  }

   // add Form
   addForm() {
    const formGroupClone = this.formBuilder.group(this.educationForm.value);
    this.formGroups.push(formGroupClone);
  }

  // Delete Form
  deleteForm(id: any) {
    this.formGroups.splice(id, 1)
  }

}
