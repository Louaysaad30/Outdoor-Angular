import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { ReservationService } from '../../services/reservation.service';
import { TicketReservation } from '../../models/ticketReservation.model';
import {PaginationModule} from "ngx-bootstrap/pagination";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-user-reservations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SharedModule,
    FormsModule,
    PaginationModule
  ],
  templateUrl: './user-reservations.component.html',
  styleUrl: './user-reservations.component.scss'
})
export class UserReservationsComponent implements OnInit {
  userReservations: TicketReservation[] = [];
  loading: boolean = true;
  userId: number | null = null;

  // Toast properties
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'warning' | 'danger' | 'primary' = 'primary';

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 12;
  displayedReservations: TicketReservation[] = [];

  constructor(private reservationService: ReservationService) { }

  ngOnInit(): void {
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user')!);
    this.userId = currentUser ? currentUser.id : null;

    if (this.userId) {
      this.loadUserReservations();
    } else {
      this.loading = false;
      this.showToastNotification('Please log in to view your reservations', 'warning');
    }
  }

  loadUserReservations(): void {
    if (!this.userId) return;

    this.reservationService.getReservationsByUserId(this.userId).subscribe({
      next: (reservations) => {
        this.userReservations = reservations;
        this.updateDisplayedReservations();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reservations:', error);
        this.showToastNotification('Failed to load your reservations', 'danger');
        this.loading = false;
      }
    });
  }

  getColorClass(ticketType: string): string {
    switch (ticketType) {
      case 'VIP':
        return 'primary';
      case 'PREMIUM':
        return 'warning';
      case 'STUDENT':
        return 'info';
      case 'REGULAR':
      default:
        return 'success';
    }
  }

  cancelReservation(reservationId: number): void {
    this.reservationService.deleteReservation(reservationId).subscribe({
      next: () => {
        this.userReservations = this.userReservations.filter(r => r.id !== reservationId);
        this.updateDisplayedReservations();
        this.showToastNotification('Reservation cancelled successfully', 'success');
      },
      error: (error) => {
        console.error('Error cancelling reservation:', error);
        this.showToastNotification('Failed to cancel reservation', 'danger');
      }
    });
  }

  showToastNotification(message: string, type: 'success' | 'warning' | 'danger' | 'primary'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  closeToast(): void {
    this.showToast = false;
  }

  // Pagination methods
  updateDisplayedReservations(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    const endItem = this.currentPage * this.itemsPerPage;
    this.displayedReservations = this.userReservations.slice(startItem, endItem);
  }

  pageChanged(event: any): void {
    this.currentPage = event.page;
    this.updateDisplayedReservations();
  }
}
