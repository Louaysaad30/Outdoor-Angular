import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';

@Component({
  selector: 'app-agence-reservations',
  templateUrl: './agence-reservations.component.html',
  styleUrl: './agence-reservations.component.scss'
})
export class AgenceReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  errorMessage: string = '';

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    const agenceId = 1;
    this.loadReservations(agenceId);
  }

  loadReservations(agenceId: number) {
    this.reservationService.getReservationsByAgence(agenceId).subscribe({
      next: (data) => {
        this.reservations = data;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = "Erreur lors du chargement des réservations.";
      }
    });
  }

  changerStatut(reservation: any, statut: string) {
    this.reservationService.updateStatut(reservation.id, statut).subscribe({
      next: () => {
        reservation.statut = statut; // Update reservation status directly
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = "Erreur lors de la mise à jour du statut.";
      }
    });
  }
}
