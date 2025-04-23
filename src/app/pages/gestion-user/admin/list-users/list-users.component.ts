import { any } from '@amcharts/amcharts5/.internal/core/util/Array';
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

  breadCrumbItems!: Array<{}>;
  predictionMessage: string = '';
  userPrediction: number = 0;
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 6; // Adjust as needed
  totalPages: number = 0;
  currentUserId?: number ;

  filter = {
    accountLocked: '',
    enabled: '',
    status: '',
    role: ''
  };
  get paginatedUsers(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsers.slice(start, end);
  }
  
  public myOptions: NgxMasonryOptions = {
    horizontalOrder: true
  };

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'User List', active: true }];

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = currentUser.id;

    this.loadUsers();
    this.getUsers();
  }

  verifyUser(user: any) {
    this.userService.verifyUser(user.id).subscribe(
      (res) => {
        user.status = 1;
        Swal.fire('Verified!', 'User has been verified successfully.', 'success');
        this.loadUsers();
      },
      (err) => {
        console.error('Verification failed', err);
        Swal.fire('Error!', 'Failed to verify user.', 'error');
      }
    );
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe((res: any[]) => {
      this.users = res.filter(user => user.id !== this.currentUserId);
      this.filteredUsers = this.users;
    });
  }

  getUsers() {
    this.userService.getAllUsers().subscribe(
      (res: any[]) => {
        this.users = res.filter(user => user.id !== this.currentUserId);
        this.applyFilters();
      },
      (error) => {
        console.error('Failed to load users', error);
      }
    );
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      const matchAccountLocked = this.filter.accountLocked === '' || user.accountLocked === this.filter.accountLocked;
      const matchEnabled = this.filter.enabled === '' || user.enabled === this.filter.enabled;
      const matchStatus = this.filter.status === '' || user.status == this.filter.status;
  
      const userRoles = user.authorities?.map((auth: any) => auth.authority) || [];
      const matchRole = this.filter.role === '' || userRoles.includes(this.filter.role);
  
      const matchSearch =
        user.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.prenom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
  
      return matchAccountLocked && matchEnabled && matchStatus && matchRole && matchSearch;
    });
  
    // Reset to page 1 and update total pages
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }
  searchUsers() {
    this.applyFilters();
  }
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
 // Méthode pour obtenir la prédiction pour un utilisateur spécifique
getChurnPrediction(userId: number) {
  this.userService.predictChurn(userId).subscribe(
    (response) => {
      const user = this.paginatedUsers.find(u => u.id === userId); // Trouver l'utilisateur
      if (user) {
        user.churnResult = response.message; // Ajouter le résultat de la prédiction à l'utilisateur
      }
    },
    (error) => {
      console.error('Error fetching churn prediction:', error);
    }
  );
}


  // Call this method when a user card or relevant UI is clicked to get the prediction
  onUserCardClick(userId: number) {
    this.getChurnPrediction(userId);
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
          () => {
            Swal.fire('Deleted!', 'Your account has been deleted.', 'success');
            this.getUsers();
          },
          (err) => {
            console.error('Delete failed', err);
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
}
