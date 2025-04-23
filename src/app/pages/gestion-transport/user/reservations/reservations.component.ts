import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { Router } from '@angular/router';
import { Reservation } from '../../models/reservation.model';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  currentUser: any;
  errorMessage: string = '';
  isLoading: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // Filters
  searchText: string = '';
  statusFilter: string = '';
  
  // Sorting
  sortColumn: string = 'debutLocation';
  sortDirection: 'asc' | 'desc' = 'desc';
Math: any;

  constructor(private reservationService: ReservationService , 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    this.getReservations();
  }

  getReservations(): void {
    this.isLoading = true;
    this.reservationService.getReservationsByUserId(this.currentUser.id).subscribe({
      next: (data) => {
        this.reservations = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de la récupération des réservations';
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let result = this.reservations;
    
    // Apply search filter
    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      result = result.filter(res => 
        (res.vehicule?.modele?.toLowerCase().includes(searchLower) ||
        (res.vehicule?.type?.toLowerCase().includes(searchLower)) ||
        res.pickupLocation.toLowerCase().includes(searchLower)
      ));
    }
    
    // Apply status filter
    if (this.statusFilter) {
      result = result.filter(res => res.statut === this.statusFilter);
    }
    
    // Apply sorting
    result = this.sortData(result);
    
    this.filteredReservations = result;
    this.updatePagination();
  }

  sortData(data: Reservation[]): Reservation[] {
    return [...data].sort((a, b) => {
      const valA = this.getSortValue(a, this.sortColumn);
      const valB = this.getSortValue(b, this.sortColumn);
      
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortValue(res: any, column: string): any {
    if (column.includes('.')) {
      const [parent, child] = column.split('.');
      return res[parent]?.[child];
    }
    return res[column];
  }

  sortReservations(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredReservations.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  get paginatedReservations(): Reservation[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredReservations.slice(start, end);
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  getStatusText(status: string): string {
    const statusMap: {[key: string]: string} = {
      'EN_ATTENTE': 'En attente',
      'APPROUVÉE': 'Approuvée',
      'REJETÉE': 'Rejetée'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return {
      'EN_ATTENTE': 'bg-warning text-dark',
      'APPROUVÉE': 'bg-success',
      'REJETÉE': 'bg-danger'
    }[status] || 'bg-secondary';
  }

  viewInvoice(reservation: Reservation): void {
    this.router.navigate(['/transportfront/user/invoice', reservation.id]);
  }

 
}