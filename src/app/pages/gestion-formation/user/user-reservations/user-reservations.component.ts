import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { UserReservation } from '../../models/UserReservation.model'; // ✅ nom corrigé
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ModalModule } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-user-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, ModalModule],
  templateUrl: './user-reservations.component.html',
  styleUrls: ['./user-reservations.component.scss']
})
export class UserReservationsComponent implements OnInit {

  reservations: UserReservation[] = [];
  filteredReservations: UserReservation[] = [];
  term: string = '';
  loading: boolean = false;
  breadCrumbItems!: Array<{ label: string, link?: string, active?: boolean }>;

  constructor(
    private reservationService: ReservationService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Home', link: '/' },
      { label: 'My Reservations', active: true }
    ];
    this.loadReservations();
  }

  loadReservations(): void {
    const userString = localStorage.getItem('user');
    if (!userString) {
      this.toast.error('Please log in first.');
      return;
    }

    const userId = JSON.parse(userString).id;
    this.loading = true;

    this.reservationService.getReservationsForUser(userId).subscribe({ // ✅ attention ici
      next: (data) => {
        this.reservations = data;
        this.filteredReservations = [...data];
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load reservations.');
        this.loading = false;
      }
    });
  }

  cancelReservation(id: number): void {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      this.reservationService.cancelReservation(id).subscribe({
        next: () => {
          this.toast.success('Reservation canceled successfully.');
          this.loadReservations();
        },
        error: () => {
          this.toast.error('Failed to cancel the reservation.');
        }
      });
    }
  }

  filterData(): void {
    const termLower = this.term.toLowerCase();
    this.filteredReservations = this.reservations.filter(res =>
      res.formation?.titre?.toLowerCase().includes(termLower)
    );
  }

  daysUntilFormation(res: UserReservation): number {
    if (!res.formation?.dateDebut) return 0;
    const now = new Date();
    const start = new Date(res.formation.dateDebut);
    return Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  trackById(index: number, item: UserReservation): number {
    return item.id;
  }
}
