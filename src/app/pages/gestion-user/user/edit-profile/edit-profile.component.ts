import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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

  dateInThePastValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const date = new Date(control.value);
      const today = new Date();
      return date < today ? null : { dateInThePast: true };
    };
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
            if (result.isConfirmed) {
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
          });
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
  
  
  
  
  onSubmit(): void {
    if (this.userForm.valid) {
      const updatedUser = this.userForm.value;
  console.log('Updated User:', updatedUser); // Log the updated user object for debugging
  console.log('Current User:', this.currentUser.id); // Log the current user object for debugging
      this.userService.updateUser(this.currentUser.id, updatedUser).subscribe({
        next: (res) => {
          alert('Profile updated successfully!');
          localStorage.setItem('user', JSON.stringify(res));
          this.router.navigate(['/userfront/user/profile']);
        },
        error: (err) => {
          // Improved error handling
          const errorMessage = err?.error?.message || 'Profile update failed. Please try again.'; // Use optional chaining and fallback message
          console.error('Update failed', err);
          alert(errorMessage); // Show the appropriate error message to the user
        }
      });
    } else {
      alert('Form is invalid. Please check the inputs.');
    }
  }
  
  
  onCancel(): void {
    this.userForm.reset(this.currentUser);
  }
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  fieldTextType!: boolean;
  fieldTextType1!: boolean;
  fieldTextType2!: boolean;
  bsConfig?: Partial<BsDatepickerConfig>;

  formGroups: FormGroup[] = [];
  educationForm!: FormGroup;
  currentTab = 'personalDetails';

  constructor(private formBuilder: FormBuilder,private fb: FormBuilder, private userService: UserServiceService, private router: Router,private authService:AuthServiceService) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);

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

  // File Upload
  imageURL: any;
  fileChange(event: any, id: any) {
    let fileList: any = (event.target as HTMLInputElement);
    let file: File = fileList.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imageURL = reader.result as string;
      if (id == '0') {
        document.querySelectorAll('#cover-img').forEach((element: any) => {
          element.src = this.imageURL;
        });
      }
      if (id == '1') {
        document.querySelectorAll('#user-img').forEach((element: any) => {
          element.src = this.imageURL;
        });
      }
    }

    reader.readAsDataURL(file)
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
