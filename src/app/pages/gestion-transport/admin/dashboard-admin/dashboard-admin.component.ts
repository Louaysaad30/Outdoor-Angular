import { Component, OnInit } from '@angular/core';
import { VehiculeService } from '../../services/vehicule.service';
import { ReservationService } from '../../services/reservation.service';
import { ReviewService } from '../../services/review.service';
import { AgenceService } from '../../services/agence.service';
import { Vehicule } from '../../models/vehicule.model';
import { Reservation } from '../../models/reservation.model';
import { Review } from '../../models/review.model';
import { Agence } from '../../models/agence.model';

type ReviewSortField = 'createdDate' | 'rating' | 'vehiculeId';

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss']
})
export class DashboardAdminComponent implements OnInit {
  breadCrumbItems = [
    { label: 'Admin' },
    { label: 'Dashboard', active: true }
  ];

  stats = {
    totalVehicles: 0,
    totalAgence: 0,
    totalReservations: 0,
    totalReviews: 0
  };

  agence: Agence[] = [];
  vehicles: Vehicule[] = [];
  AgenceMap: Map<number, Agence> = new Map();

  // Reviews variables
  allReviews: Review[] = [];
  displayedReviews: Review[] = [];
  vehicleMap: Map<number, Vehicule> = new Map();

  // Review pagination
  reviewCurrentPage = 1;
  reviewItemsPerPage = 5;
  totalReviewItems = 0;

  // Review sorting
  reviewSortOptions: Record<ReviewSortField, string> = {
    createdDate: 'Date',
    rating: 'Rating',
    vehiculeId: 'Vehicle'
  };
  reviewSortField: ReviewSortField = 'createdDate';
  reviewSortDirection = 'desc';

  Math = Math;

  constructor(
    private vehiculeService: VehiculeService,
    private reservationService: ReservationService,
    private reviewService: ReviewService,
    private agenceService: AgenceService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadAgence();
    this.loadVehicles();
    
  }

  get sortedReviewOptions(): {key: ReviewSortField, value: string}[] {
    return Object.entries(this.reviewSortOptions).map(([key, value]) => ({
      key: key as ReviewSortField,
      value
    }));
  }

  loadStats(): void {
    this.vehiculeService.getVehicules().subscribe(vehicles => {
      this.stats.totalVehicles = vehicles.length;
    });

    this.agenceService.getAllAgences().subscribe(agence => {
      this.stats.totalAgence = agence.length;
    });

    this.reservationService.getReservations().subscribe(reservations => {
      this.stats.totalReservations = reservations.length;
    });

    this.reviewService.getAllReviews().subscribe(reviews => {
      this.stats.totalReviews = reviews.length;
    });
  }

  loadAgence(): void {
    this.agenceService.getAllAgences().subscribe(agence => {
      this.agence = agence;
      agence.forEach(agency => this.AgenceMap.set(agency.id, agency));
    });
  }

  loadVehicles(): void {
    this.vehiculeService.getVehicules().subscribe(vehicles => {
      this.vehicles = vehicles;
      // Update vehicle map for reviews
      vehicles.forEach(vehicle => this.vehicleMap.set(vehicle.id, vehicle));
    });
  }

  blockAgence(agenceId: number): void {
    if (confirm('Are you sure you want to block this agency?')) {
      this.agenceService.deleteAgence(agenceId).subscribe({
        next: () => {
          this.loadAgence();
          this.loadStats();
        },
        error: (err) => {
          console.error('Error blocking agency:', err);
          alert('Failed to block agency');
        }
      });
    }
  }

  deleteVehicle(vehicleId: number): void {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      this.vehiculeService.deleteVehicule(vehicleId).subscribe({
        next: () => {
          // Remove the vehicle from the local list after deletion
          this.vehicles = this.vehicles.filter(v => v.id !== vehicleId);
          this.stats.totalVehicles--; // Update vehicle stats
        },
        error: (err) => {
          console.error('Error deleting vehicle:', err);
          alert('Failed to delete vehicle');
        }
      });
    }
  }
  
  getAgenceName(agenceId: number): string {
    return this.AgenceMap.get(agenceId)?.nom || 'Unknown';
  }

  getVehicleStatusClass(vehicle: Vehicule): string {
    if (!vehicle.disponible) return 'bg-danger-subtle text-danger';
    if (vehicle.statut === 'MAINTENANCE') return 'bg-warning-subtle text-warning';
    return 'bg-success-subtle text-success';
  }

  getVehicleStatusText(vehicle: Vehicule): string {
    if (!vehicle.disponible) return 'Rented';
    if (vehicle.statut === 'MAINTENANCE') return 'In Maintenance';
    return 'Available';
  }

  
}