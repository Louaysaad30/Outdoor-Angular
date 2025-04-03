import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent implements OnInit {
  reservations: any[] = [];
  userId: number = 1;  
  errorMessage: string = '';

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.getReservations();
  }

  getReservations() {
    this.reservationService.getReservationsByUserId(this.userId).subscribe(
      (data) => {
        this.reservations = data;
      },
      (error) => {
        this.errorMessage = 'Erreur lors de la récupération des réservations';
        console.error(error);
      }
    );
  }
}
