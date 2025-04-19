import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
export class UserListComponent {
  @Input() users: any[] = [];  // Users input
  @Output() userSelected = new EventEmitter<any>();  // Event emitter for selected user
  selectedUser: any;


  // Select user and emit event to parent component
  selectUser(user: any) {
    this.selectedUser = user;
    console.log('Selected user:', user);  // Log selected user
    this.userSelected.emit(user);  // Emit selected user to parent component
  }
}
