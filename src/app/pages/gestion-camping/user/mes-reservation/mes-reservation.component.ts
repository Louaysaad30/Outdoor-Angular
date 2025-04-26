import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../model/reservation.model';
import {ModalDirective, ModalModule} from 'ngx-bootstrap/modal';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LigneReservationService} from "../../services/ligne-reservation.service";
import {StripeCardElementChangeEvent, StripeCardElementOptions, StripeElementsOptions} from '@stripe/stripe-js';
import { FormBuilder, FormGroup, Validators, } from '@angular/forms';

@Component({
  selector: 'app-mes-reservation',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule, ModalModule, ReactiveFormsModule],
  templateUrl: './mes-reservation.component.html',
  styleUrl: './mes-reservation.component.scss'
})
export class MesReservationComponent implements OnInit {
  reservations: Reservation[] = [];
  calendarEvents: EventInput[] = [];
  isLoading = false;
  currentUser: any;
  selectedReservation: any = null;
  colorClasses = [
    'bg-primary-subtle',
    'bg-success-subtle',
    'bg-danger-subtle',
    'bg-warning-subtle',
    'bg-info-subtle',
    'bg-dark-subtle'
  ];

  elements: any;
  card: any;
  paymentForm!: FormGroup;
  isProcessingPayment = false;
  paymentError: string | null = null;
  paymentSuccess = false;
  @ViewChild('reservationModal', { static: false }) reservationModal?: ModalDirective;
  @ViewChild('paymentSuccessModal', { static: false }) paymentSuccessModal?: ModalDirective;


  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, listPlugin, interactionPlugin, timeGridPlugin],
    headerToolbar: {
      right: 'dayGridMonth,dayGridWeek,listWeek',
      center: 'title',
      left: 'prev,next today'
    },
    initialView: 'dayGridMonth',
    themeSystem: "bootstrap",
    timeZone: 'local',
    editable: false,
    selectable: false,
    navLinks: true,
    eventClick: this.handleEventClick.bind(this),
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: 'short'
    }
  };

  paymentFormVisible = false; // Added property


  constructor(
    private reservationService: ReservationService,
    private ligneReservationService: LigneReservationService,
  private fb: FormBuilder

) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    this.loadUserReservations();
    this.initPaymentForm();

  }



  loadUserReservations(): void {
    this.isLoading = true;

    if (this.currentUser?.id) {
      this.reservationService.getReservationsByClientId(this.currentUser.id).subscribe({
        next: (data) => {
          this.reservations = data;
          this.prepareCalendarEvents();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching reservations:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
      console.error('User not logged in or user ID not available');
    }
  }

  prepareCalendarEvents(): void {
    this.calendarEvents = this.reservations.map((reservation, index) => {
      // Assign colors in rotation
      const colorClass = this.colorClasses[index % this.colorClasses.length];

      return {
        id: reservation.idReservation?.toString(),
        title: `${reservation.centre.name} (${reservation.nbrPersonnes} guests)`,
        start: new Date(reservation.dateDebut),
        end: new Date(reservation.dateFin),
        classNames: [colorClass],
        extendedProps: {
          totalPrice: reservation.prixTotal,
          location: reservation.centre.address || 'No address provided',
          description: `${reservation.lignesReservation?.length || 0} reserved items`,
          reservation: reservation
        }
      };
    });

    // Update calendar with events
    this.calendarOptions.events = this.calendarEvents;
  }

  handleEventClick(info: any): void {
    // Show reservation details in modal
    this.selectedReservation = info.event.extendedProps.reservation;
    this.reservationModal?.show();
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleDateString();
  }


  cancelReservation(reservationId: number): void {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      this.reservationService.deleteReservation(reservationId).subscribe({
        next: () => {
          this.closeModal();
          this.loadUserReservations();
          // Show success message
          this.showSuccessNotification('Reservation cancelled successfully');
        },
        error: (error) => {
          // Check if this is actually a success response (some APIs return "OK" as text)
          if (error && (error.status === 200 || error.statusText === 'OK')) {
            this.closeModal();
            this.loadUserReservations();
            this.showSuccessNotification('Reservation cancelled successfully');
          } else {
            console.error('Error cancelling reservation:', error);
            this.showErrorNotification('Failed to cancel reservation');
          }
        }
      });
    }
  }

  showSuccessNotification(message: string): void {

    alert(message);
  }

  showErrorNotification(message: string): void {
    alert(message);
  }

  calculateDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  initPaymentForm(): void {
    this.paymentForm = this.fb.group({
      cardholderName: ['', [Validators.required]]
    });
  }

  showPaymentSection(): void {
    console.log('showPaymentSection called');
    this.initPaymentForm();
    this.paymentSuccess = false;
    this.paymentError = null;
    this.paymentFormVisible = true; // Show payment form

    setTimeout(() => {
      console.log('Initializing payment form');
      this.initPayment();
    }, 1000);
  }

  async initPayment(): Promise<void> {
    console.log('Started initPayment');
    try {
      const elementContainer = document.getElementById('card-element');
      if (!elementContainer) {
        console.error('Card element container not found');
        return;
      }

      const stripe = await this.reservationService.getStripe();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      this.card = stripe.elements().create('card', {
        style: {
          base: {
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': { color: '#aab7c4' }
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        }
      });

      this.card.mount('#card-element');
      console.log('Card element mounted successfully');

      this.card.on('change', (event: StripeCardElementChangeEvent) => {
        const displayError = document.getElementById('card-errors');
        if (displayError) {
          displayError.textContent = event.error ? event.error.message : '';
        }
      });
    } catch (error) {
      console.error('Error initializing payment:', error);
      this.paymentError = 'Failed to initialize payment system. Please try again.';
    }
  }

  processPayment(): void {
    if (this.paymentForm.invalid || !this.selectedReservation) {
      this.paymentError = 'Invalid payment form or no reservation selected.';
      return;
    }

    this.isProcessingPayment = true;
    this.paymentError = null;

    // Call the backend payment processing endpoint which will also confirm the reservation
    this.reservationService.processPayment(
      this.selectedReservation.idReservation,
      this.selectedReservation.prixTotal*100
    ).subscribe({
      next: (response) => {
        console.log('Payment successful:', response);
        this.paymentSuccess = true;
        this.isProcessingPayment = false;

        // Update the local reservation status
        this.selectedReservation.confirmed = true;

        // Close the current modal and show success modal
        this.reservationModal?.hide();
        this.paymentSuccessModal?.show();

        // Reload reservations to reflect the updated status
        setTimeout(() => {
          this.loadUserReservations();
        }, 1000);
      },
      error: (error) => {
        console.error('Payment processing error:', error);
        this.paymentError = 'Payment failed. Please try again.';
        this.isProcessingPayment = false;
      }
    });
  }  closeModal(): void {
    if (this.card) {
      this.card.unmount();
      this.card = null;
    }
    this.paymentSuccess = false;
    this.paymentError = null;
    this.paymentFormVisible = false; // Hide payment form
    this.reservationModal?.hide();
  }

  closeSuccessModal(): void {
    this.paymentSuccessModal?.hide();
  }
}
