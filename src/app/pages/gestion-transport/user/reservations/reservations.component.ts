import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent implements OnInit {
  reservations: any[] = [];
  
  currentUser: any ;  
  errorMessage: string = '';

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    this.getReservations();
  }

  getReservations() {
    this.reservationService.getReservationsByUserId(this.currentUser.id).subscribe(
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
