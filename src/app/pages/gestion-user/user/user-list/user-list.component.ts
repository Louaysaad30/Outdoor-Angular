// user-list.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SimplebarAngularModule } from 'simplebar-angular';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [  
    CommonModule,
    SimplebarAngularModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnChanges {
  @Input() users: any[] = [];  // Users input
  @Output() userSelected = new EventEmitter<any>();  // Event emitter for selected user
  selectedUser: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users']) {
      console.log('Users list updated:', this.users);
    }
  }

  selectUser(user: any) {
    this.selectedUser = user;
    console.log('Selected user:', user);
    this.userSelected.emit(user);
  }
}