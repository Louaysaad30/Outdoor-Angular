import { Component, OnInit, ViewChild } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
  import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
  import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';
  import { PageChangedEvent, PaginationModule } from 'ngx-bootstrap/pagination';
  import { RouterLink } from '@angular/router';
  import { SharedModule } from '../../../../shared/shared.module';
  import { EventService } from '../../services/event.service';
  import { TicketService } from '../../services/ticket.service';
  import { Ticket, TicketType } from '../../models/ticket.model';
  import { Event } from '../../models/event.model';
import {ReservationService} from "../../services/reservation.service";
import { TicketReservation } from '../../models/ticketReservation.model';
import Swal from "sweetalert2";
  @Component({
    selector: 'app-ticket-list',
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      BsDropdownModule,
      ModalModule,
      PaginationModule,
      RouterLink,
      SharedModule
    ],
    templateUrl: './ticket-list.component.html',
    styleUrl: './ticket-list.component.scss'
  })
  export class TicketListComponent implements OnInit {
    // Breadcrumb items
    breadCrumbItems: Array<{}> = [
      { label: 'Events', active: true },
      { label: 'Ticket Management', active: true }
    ];

    // Tickets data
    allTickets: Ticket[] = [];
    displayedTickets: Ticket[] = [];
    term: string = '';
    viewMode: string = 'card';
    currentPage: number = 1;
    itemsPerPage: number = 8;
    ticketTypes = Object.values(TicketType);
    events: Event[] = [];
    event: Event | undefined;
    selectedTicketType: string = '';


    // Form handling
    ticketForm!: UntypedFormGroup;
    isEditing: boolean = false;
    selectedTicketId: number | null = null;

    sortColumn: string = '';
    sortDirection: string = 'asc';

    @ViewChild('ticketModal', { static: false }) ticketModal?: ModalDirective;
    @ViewChild('deleteModal', { static: false }) deleteModal?: ModalDirective;
    @ViewChild('reservationsModal', { static: false }) reservationsModal?: ModalDirective;
    selectedTicket: any = null;
    ticketReservations: TicketReservation[] = [];
    loadingReservations: boolean = false;
    reservationSearchTerm: string = '';
    filteredReservations: TicketReservation[] = [];

    constructor(
      private formBuilder: UntypedFormBuilder,
      private ticketService: TicketService,
      private eventService: EventService,
      private reservationService: ReservationService
    ) { }

    ngOnInit(): void {
      // Initialize form
      this.ticketForm = this.formBuilder.group({
        eventId: [null, Validators.required],
        type: ['', Validators.required],
        price: ['', [Validators.required, Validators.min(0)]],
        availableTickets: ['', [Validators.required, Validators.min(0)]],
        purchaseLimit: [1, [Validators.required, Validators.min(1)]],
        discountCode: [''],
        discountPercentage: [0, [Validators.min(0), Validators.max(100)]]

      });

      // Load data
      this.loadEvents();
      this.loadTickets();
    }

    loadEvents(): void {
      this.eventService.getAllEvents().subscribe({
        next: (events) => {
          this.events = events;
        },
        error: (error) => console.error('Error loading events:', error)
      });
    }

    loadTickets(): void {
      document.getElementById('elmLoader')?.classList.remove('d-none');

      this.ticketService.getAllTickets().subscribe({
        next: (tickets) => {
          this.allTickets = tickets;

          // Create a map to store event titles keyed by event ID
          const eventMap = new Map<number, string>();

          // Get all unique event IDs from tickets
          const eventIds = new Set(tickets.map(ticket => ticket.event?.id).filter(id => id !== undefined));

          // For each unique event ID, fetch the full event details
          eventIds.forEach(eventId => {
            const eventTicket = tickets.find(t => t.event?.id === eventId && t.event?.title);
            if (eventTicket?.event?.title) {
              eventMap.set(eventId as number, eventTicket.event.title);
            } else {
              // If no title in tickets, get it from events array
              const eventDetails = this.events.find(e => e.id === eventId);
              if (eventDetails?.title) {
                eventMap.set(eventId as number, eventDetails.title);
              }
            }
          });

          // Apply event titles to all tickets
          this.allTickets = tickets.map(ticket => {
            if (ticket.event?.id && eventMap.has(ticket.event.id)) {
              return {
                ...ticket,
                event: {
                  ...ticket.event,
                  title: eventMap.get(ticket.event.id)
                }
              };
            }
            return ticket;
          });

          this.selectedTicketType = '';
          this.term = '';

          this.displayedTickets = this.allTickets.slice(0, this.itemsPerPage);
          document.getElementById('elmLoader')?.classList.add('d-none');
          this.updateNoResultDisplay();
        },
        error: (error) => {
          console.error('Error loading tickets:', error);
          document.getElementById('elmLoader')?.classList.add('d-none');
        }
      });
    }

    toggleViewMode(mode: string): void {
      this.viewMode = mode;
    }

    searchTickets(): void {
      if (this.term) {
        this.displayedTickets = this.allTickets.filter(ticket =>
          this.getEventName(ticket.event)?.toLowerCase().includes(this.term.toLowerCase())
        );
      } else {
        this.displayedTickets = this.allTickets.slice(0, this.itemsPerPage);
      }
      this.updateNoResultDisplay();
      this.filterTickets();
    }

    getEventName(event: any): string {
      return event?.title || 'No Event';
    }

    updateNoResultDisplay(): void {
      const noResultElement = document.getElementById('noresult');
      const paginationElement = document.getElementById('pagination-element');

      if (this.displayedTickets.length === 0) {
        if (noResultElement) noResultElement.style.display = 'block';
        if (paginationElement) paginationElement?.classList.add('d-none');
      } else {
        if (noResultElement) noResultElement.style.display = 'none';
        if (paginationElement) paginationElement?.classList.remove('d-none');
      }
    }

    openNewTicketModal(): void {
      this.isEditing = false;
      this.selectedTicketId = null;
      this.ticketModal?.show();
      this.ticketForm.reset();
    }

    editTicket(ticket: Ticket): void {
      this.isEditing = true;
      this.selectedTicketId = ticket.id!;

      // Extract discount code and percentage if available
      let discountCode = '';
      let discountPercentage = 0;

      if (ticket.discountCode && ticket.discountCode.includes(':')) {
        const parts = ticket.discountCode.split(':');
        discountCode = parts[0];
        discountPercentage = parseFloat(parts[1]);
      }

      this.ticketForm.patchValue({
        eventId: ticket.event?.id,
        type: ticket.type,
        price: ticket.price,
        availableTickets: ticket.availableTickets,
        purchaseLimit: ticket.purchaseLimit,
        discountCode: discountCode,
        discountPercentage: discountPercentage
      });

      this.ticketModal?.show();
    }

    saveTicket(): void {
      if (this.ticketForm.invalid) return;

      const formData = this.ticketForm.value;
      const discountCode = formData.discountCode;
      const discountPercentage = formData.discountPercentage;

      const ticketData: Ticket = {
        type: formData.type,
        price: formData.price,
        availableTickets: formData.availableTickets,
        purchaseLimit: formData.purchaseLimit,
        discountCode: null, // We'll handle this separately
        event: {
          id: formData.eventId
        }
      };

      // Create or update the ticket first
      const saveOperation = this.isEditing && this.selectedTicketId
        ? this.ticketService.updateTicket(this.selectedTicketId, ticketData)
        : this.ticketService.createTicket(ticketData);

      saveOperation.subscribe({
        next: (ticket) => {
          // If discount code and percentage are provided, apply the discount
          if (discountCode && discountPercentage > 0) {
            this.applyDiscount(ticket.id!, discountCode, discountPercentage);
          } else {
            this.loadTickets();
            this.ticketModal?.hide();
          }
        },
        error: (error) => console.error('Error saving ticket:', error)
      });
    }

    applyDiscount(ticketId: number, code: string, percentage: number): void {
      this.ticketService.applyDiscount(ticketId, code, percentage).subscribe({
        next: () => {
          this.loadTickets();
          this.ticketModal?.hide();
        },
        error: (error) => {
          console.error('Error applying discount:', error);
          // Still close and reload, as the ticket was created/updated
          this.loadTickets();
          this.ticketModal?.hide();
        }
      });
    }


    calculateDiscountedPreview(price: number, percentage: number): number {
      if (!price || !percentage) return price || 0;
      return Number((price * (1 - percentage / 100)).toFixed(2));
    }

    removeTicket(id: number): void {
      this.selectedTicketId = id;
      this.deleteModal?.show();
    }

    confirmDelete(): void {
      if (this.selectedTicketId) {
        this.ticketService.deleteTicket(this.selectedTicketId).subscribe({
          next: () => {
            this.loadTickets();
            this.deleteModal?.hide();
          },
          error: (error) => console.error('Error deleting ticket:', error)
        });
      }
    }

    onSort(column: string) {
      // Toggle direction if same column is clicked
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }

      // Create a copy and sort it
      this.displayedTickets = [...this.displayedTickets].sort((a, b) => {
        let valA: any;
        let valB: any;

        // Handle different column types
        switch(column) {
          case 'event':
            valA = a.event?.title?.toLowerCase() || '';
            valB = b.event?.title?.toLowerCase() || '';
            break;
          case 'type':
            valA = a.type;
            valB = b.type;
            break;
          case 'price':
            valA = a.price;
            valB = b.price;
            break;
          case 'availableTickets':
            valA = a.availableTickets;
            valB = b.availableTickets;
            break;
          case 'purchaseLimit':
            valA = a.purchaseLimit;
            valB = b.purchaseLimit;
            break;
          default:
            valA = a[column as keyof Ticket];
            valB = b[column as keyof Ticket];
        }

        // Compare and sort
        const result = valA < valB ? -1 : valA > valB ? 1 : 0;
        return this.sortDirection === 'asc' ? result : -result;
      });
    }

pageChanged(event: PageChangedEvent): void {
  const startItem = (event.page - 1) * this.itemsPerPage;
  const endItem = event.page * this.itemsPerPage;

  // Apply filters to get the current working dataset
  let filtered = this.allTickets;
  if (this.selectedTicketType) {
    filtered = filtered.filter(ticket => ticket.type === this.selectedTicketType);
  }
  if (this.term) {
    filtered = filtered.filter(ticket =>
      (ticket.event?.title?.toLowerCase().includes(this.term.toLowerCase())) ||
      ticket.type.toLowerCase().includes(this.term.toLowerCase())
    );
  }

  // Use the filtered dataset for pagination
  this.displayedTickets = filtered.slice(startItem, endItem);
}

    filterTickets(): void {
      let filtered = this.allTickets;

      // Apply type filter if selected
      if (this.selectedTicketType) {
        filtered = filtered.filter(ticket => ticket.type === this.selectedTicketType);
      }

      // Apply search term filter if present
      if (this.term) {
        filtered = filtered.filter(ticket =>
          (ticket.event?.title?.toLowerCase().includes(this.term.toLowerCase())) ||
          ticket.type.toLowerCase().includes(this.term.toLowerCase())
        );
      }

      // Update displayedTickets with filtered results
      this.currentPage = 1; // Reset to first page when filtering
      this.displayedTickets = filtered.slice(0, this.itemsPerPage);
      this.updateNoResultDisplay();
    }


    getColorClass(ticketType: TicketType): string {
      switch (ticketType) {
        case TicketType.VIP: return 'danger';
        case TicketType.PREMIUM: return 'success';
        case TicketType.REGULAR: return 'secondary';
        case TicketType.STUDENT: return 'info';
        default: return 'secondary';
      }
    }


showTicketReservations(ticket: any) {
  this.selectedTicket = ticket;
  this.loadingReservations = true;
  this.ticketReservations = [];
  this.filteredReservations = [];
  this.reservationSearchTerm = '';

  this.reservationsModal?.show();

  this.reservationService.getTicketReservations(ticket.id).subscribe({
    next: (data: any[]) => {
      // Process the enhanced response structure
      this.ticketReservations = data.map(item => {
        // Combine reservation data with user data
        return {
          ...item.reservation,
          user: item.user
        };
      });
      this.filteredReservations = this.ticketReservations;
      this.loadingReservations = false;
    },
    error: (error) => {
      console.error('Error loading ticket reservations:', error);
      this.loadingReservations = false;
    }
  });
}


filterReservations() {
  if (!this.reservationSearchTerm.trim()) {
    this.filteredReservations = this.ticketReservations;
    return;
  }

  const term = this.reservationSearchTerm.toLowerCase().trim();

  this.filteredReservations = this.ticketReservations.filter(r => {
    // Get user fields, safely handling undefined values
    const firstName = (r.user?.prenom || '').toLowerCase();
    const lastName = (r.user?.nom || '').toLowerCase();
    const email = (r.user?.email || '').toLowerCase();
    const userId = r.userId?.toString() || '';
    const reservationCode = (r.reservationCode || '').toLowerCase();

    // Create full name combinations for better searching
    const fullName = `${firstName} ${lastName}`.trim();
    const reversedFullName = `${lastName} ${firstName}`.trim();

    // Check if search term is in any of the fields
    return userId.includes(term) ||
           reservationCode.includes(term) ||
           firstName.includes(term) ||
           lastName.includes(term) ||
           email.includes(term) ||
           fullName.includes(term) ||
           reversedFullName.includes(term);
  });
}
exportReservationsList() {
  if (!this.ticketReservations.length) return;

  const csvContent = [
    // Enhanced header row with user details
    ['User ID', 'User Name', 'Email', 'Reservation Code', 'Final Price', 'Discount Applied'].join(','),
    // Data rows with user details
    ...this.ticketReservations.map(r => [
      r.userId,
      `${r.user?.prenom || ''} ${r.user?.nom || ''}`.trim() || 'Unknown',
      r.user?.email || 'N/A',
      r.reservationCode || 'N/A',
      r.finalPrice || 'N/A',
      r.appliedDiscountCode || 'None'
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', `reservations-ticket-${this.selectedTicket?.id}-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


confirmCancelReservation(reservation: TicketReservation) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You want to cancel this reservation?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, cancel it!',
    cancelButtonText: 'No, keep it'
  }).then((result: { isConfirmed: boolean }) => {
    if (result.isConfirmed && reservation.id) {
      // Call the service to cancel the reservation
      this.reservationService.deleteReservation(reservation.id).subscribe({
        next: () => {
          // Remove the cancelled reservation from the list
          this.ticketReservations = this.ticketReservations.filter(
            r => r.id !== reservation.id
          );
          this.filterReservations(); // Refresh the filtered list
          Swal.fire('Cancelled!', 'The reservation has been cancelled.', 'success');
        },
        error: (error) => {
          console.error('Error cancelling reservation:', error);
          Swal.fire('Error', 'Failed to cancel reservation.', 'error');
        }
      });
    }
  });
}
cancelReservation(reservationId: number) {
  this.reservationService.deleteReservation(reservationId).subscribe({
    next: () => {
      // Update the ticket data (available tickets count)
      this.selectedTicket.availableTickets++;

      // Remove from displayed lists
      this.ticketReservations = this.ticketReservations.filter(r => r.id !== reservationId);
      this.filteredReservations = this.filteredReservations.filter(r => r.id !== reservationId);

      Swal.fire('Cancelled!', 'The reservation has been cancelled.', 'success');
    },
    error: (error) => {
      console.error('Error cancelling reservation:', error);
      Swal.fire('Error', 'Failed to cancel reservation.', 'error');
    }
  });
}

sortReservations(column: string) {
  // Toggle direction if same column is clicked
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  // Create a copy and sort it
  this.filteredReservations = [...this.filteredReservations].sort((a, b) => {
    let valA: any;
    let valB: any;

    // Handle different column types
    switch(column) {
      case 'userId':
        valA = a.userId || 0;
        valB = b.userId || 0;
        break;
      case 'email':
        valA = a.user?.email?.toLowerCase() || '';
        valB = b.user?.email?.toLowerCase() || '';
        break;
      case 'reservationCode':
        valA = a.reservationCode?.toLowerCase() || '';
        valB = b.reservationCode?.toLowerCase() || '';
        break;
      case 'finalPrice':
        valA = a.finalPrice || 0;
        valB = b.finalPrice || 0;
        break;
      case 'appliedDiscountCode':
        valA = a.appliedDiscountCode?.toLowerCase() || '';
        valB = b.appliedDiscountCode?.toLowerCase() || '';
        break;
      default:
        valA = a[column as keyof TicketReservation] || '';
        valB = b[column as keyof TicketReservation] || '';
    }

    // Compare and sort
    const result = valA < valB ? -1 : valA > valB ? 1 : 0;
    return this.sortDirection === 'asc' ? result : -result;
  });
}


  }
