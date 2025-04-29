import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { Reservation, StatutReservation } from '../../models/reservation.model';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ModalModule } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    ModalModule,
    FormsModule
  ],
  templateUrl: './reservations-list.component.html',
  styleUrls: ['./reservations-list.component.scss']
})
export class ReservationListComponent implements OnInit {

  breadCrumbItems!: Array<{ label: string, link?: string, active?: boolean }>;
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  searchTerm: string = '';

  stats = [
    { title: 'Total Réservations', count: 0, icon: 'bi bi-book', iconColor: 'primary', border: 'primary', percent: '0' },
    { title: 'Confirmées', count: 0, icon: 'bi bi-check2-circle', iconColor: 'success', border: 'success', percent: '0' },
    { title: 'Annulées', count: 0, icon: 'bi bi-x-circle', iconColor: 'danger', border: 'danger', percent: '0' }
  ];
  
  constructor(
    private reservationService: ReservationService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Home', link: '/' },
      { label: 'Réservations', active: true }
    ];
    this.loadReservations();
  }

  loadReservations(): void {
    this.reservationService.getAllReservations().subscribe({
      next: (data) => {
        this.reservations = data;
        this.filteredReservations = [...data];
        this.updateStats();
      },
      error: (err) => {
        console.error('Erreur chargement réservations', err);
        this.toast.error('Erreur de chargement des réservations ❌');
      }
    });
  }

  updateStats(): void {
    const total = this.reservations.length;
    const confirmed = this.reservations.filter(r => r.statut === StatutReservation.CONFIRME).length;
    const cancelled = this.reservations.filter(r => r.statut === StatutReservation.ANNULE).length;

    this.stats[0].count = total;
    this.stats[0].percent = total > 0 ? '100' : '0';

    this.stats[1].count = confirmed;
    this.stats[1].percent = total ? ((confirmed / total) * 100).toFixed(1) : '0';

    this.stats[2].count = cancelled;
    this.stats[2].percent = total ? ((cancelled / total) * 100).toFixed(1) : '0';
  }

  filterData(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredReservations = this.reservations.filter(r =>
      (r.formationTitre?.toLowerCase().includes(term) ||
       r.participantNom?.toLowerCase().includes(term) ||
       r.participantPrenom?.toLowerCase().includes(term))
    );
  }

  confirmReservation(id: number): void {
    if (confirm('Confirmer cette réservation ?')) {
      this.reservationService.confirmReservation(id).subscribe({
        next: () => {
          this.toast.success('Réservation confirmée avec succès ✅');
          this.loadReservations();
        },
        error: (err) => {
          console.error('Erreur confirmation', err);
          this.toast.error('Erreur lors de la confirmation.');
        }
      });
    }
  }

  cancelReservation(id: number): void {
    if (confirm('Annuler cette réservation ?')) {
      this.reservationService.cancelReservation(id).subscribe({
        next: () => {
          this.toast.warning('Réservation annulée 🚫');
          this.loadReservations();
        },
        error: (err) => {
          console.error('Erreur annulation', err);
          this.toast.error('Erreur lors de l\'annulation.');
        }
      });
    }
  }

}
