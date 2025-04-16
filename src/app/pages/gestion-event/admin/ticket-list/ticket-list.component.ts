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

    // Modal references
    @ViewChild('ticketModal', { static: false }) ticketModal?: ModalDirective;
    @ViewChild('deleteModal', { static: false }) deleteModal?: ModalDirective;

    constructor(
      private formBuilder: UntypedFormBuilder,
      private ticketService: TicketService,
      private eventService: EventService
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
  }
