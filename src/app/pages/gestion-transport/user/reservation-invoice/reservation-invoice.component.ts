import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { Vehicule } from '../../models/vehicule.model';

@Component({
  selector: 'app-reservation-invoice',
  templateUrl: './reservation-invoice.component.html'
})
export class ReservationInvoiceComponent implements OnInit {
  reservation: Reservation & { vehicule?: Vehicule } | null = null;
  currentDate = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReservation(Number(id));
    }
  }

  loadReservation(id: number): void {
    this.reservationService.getReservationById(id).subscribe({
      next: (res) => {
        this.reservation = res;
      },
      error: (err) => {
        console.error('Error loading reservation', err);
        this.router.navigate(['/transportfront/user/reservations']);
      }
    });
  }

  calculateRentalDays(): number {
    if (!this.reservation?.debutLocation || !this.reservation?.finLocation) {
      return 0;
    }
    const start = new Date(this.reservation.debutLocation);
    const end = new Date(this.reservation.finLocation);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateTax(): number {
    return this.reservation ? this.reservation.prixTotal * 0.07 : 0;
  }

  calculateTotalWithTax(): number {
    return this.reservation ? this.reservation.prixTotal + this.calculateTax() : 0;
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined) return '0.00 TND';
    return amount.toFixed(2) + ' TND';
  }

  printInvoice(): void {
    window.print();
  }

  downloadInvoice(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/transportfront/user/reservations']);
  }
}