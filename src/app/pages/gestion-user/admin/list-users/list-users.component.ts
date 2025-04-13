import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { NgxMasonryOptions } from 'ngx-masonry';
import { UserServiceService } from 'src/app/account/auth/services/user-service.service';
import { SharedModule } from 'src/app/shared/shared.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-list-users',
   standalone: true,
  imports: [
     TabsModule,
     SharedModule,
     CommonModule,
     FormsModule 
   ],
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.scss'
})
export class ListUsersComponent {
  constructor(private userService: UserServiceService) {}
// bread crum items
  breadCrumbItems!: Array<{}>;

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'User List', active: true  }];
    this.loadUsers();
    this.getUsers();
  }
  users: any[] = [];
filteredUsers: any[] = [];
searchTerm: string = '';
verifyUser(user: any) {
  this.userService.verifyUser(user.id).subscribe(
    (res) => {
      user.status = 1; // or update from server response
      Swal.fire('Verified!', 'User has been verified successfully.', 'success');
      this.loadUsers(); // Reload users to reflect changes
    },
    (err) => {
      console.error('Verification failed', err);
      Swal.fire('Error!', 'Failed to verify user.', 'error');
    }
  );
}

loadUsers() {
  this.userService.getAllUsers().subscribe((res: any) => {
    this.users = res;
    this.filteredUsers = res;
  });
}



filter = {
  accountLocked: '',
  enabled: '',
  status: ''
};

applyFilters() {
  this.filteredUsers = this.users.filter(user => {
    const matchAccountLocked = this.filter.accountLocked === '' || user.accountLocked === this.filter.accountLocked;
    const matchEnabled = this.filter.enabled === '' || user.enabled === this.filter.enabled;
    const matchStatus = this.filter.status === '' || user.status == this.filter.status;

    return matchAccountLocked && matchEnabled && matchStatus &&
      (user.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.prenom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.searchTerm.toLowerCase()));
  });
}

searchUsers() {
  this.applyFilters(); // Combine search with filters
}

// Call `applyFilters()` once after fetching users
getUsers() {
  this.userService.getAllUsers().subscribe((res) => {
    this.users = res;
    this.applyFilters();
  },
  (error) => {
    console.error('Failed to load users', error);
  });
}

deleteUser(userId: number) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'Once deleted, your account cannot be recovered!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete this account!',
  }).then((result) => {
    if (result.isConfirmed) {
      this.userService.deleteUser(userId).subscribe(
        (deleteRes) => {
          Swal.fire('Deleted!', 'Your account has been deleted.', 'success');
          this.getUsers();
        },
        (err) => {
          console.error('Delete failed', err);

          // Extract error message whether it's a string or an object
          let errorMsg = 'There was an issue deleting your account. Please try again.';
          if (err.error) {
            if (typeof err.error === 'string') {
              errorMsg = err.error;
            } else if (err.error.message) {
              errorMsg = err.error.message;
            }
          }

          Swal.fire('Error!', errorMsg, 'error');
        }
      );
    }
  });
}



toggleBlockUser(user: any) {
  const action = user.accountLocked ? 'unblock' : 'block';

  Swal.fire({
    title: `Are you sure you want to ${action} this user?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: `Yes, ${action} user`,
  }).then((result) => {
    if (result.isConfirmed) {
      const method = user.accountLocked ? this.userService.unblockUser : this.userService.blockUser;
      method.call(this.userService, user.id).subscribe(() => {
        Swal.fire('Success!', `User ${action}ed.`, 'success');
        this.loadUsers();
      });
    }
  });
}


  public myOptions: NgxMasonryOptions = {
    horizontalOrder: true
  };
}