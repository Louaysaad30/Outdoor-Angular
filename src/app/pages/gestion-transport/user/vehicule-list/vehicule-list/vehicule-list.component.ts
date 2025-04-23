import { Component, OnInit } from '@angular/core';
import { VehiculeService } from '../../../services/vehicule.service';
import { ActivatedRoute } from '@angular/router';
import { debounceTime } from 'rxjs/operators'; 
import { Vehicule } from '../../../models/vehicule.model';
import { Router } from '@angular/router';
import { Options } from '@angular-slider/ngx-slider';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';

@Component({
  selector: 'app-vehicule-list',
  templateUrl: './vehicule-list.component.html',
  styleUrls: ['./vehicule-list.component.scss']
})
export class VehiculeListComponent implements OnInit {
  // Vehicle data
  vehicules: Vehicule[] = [];
  filteredVehicules: Vehicule[] = [];
  isLoading: boolean = true;

  // Pagination properties
  pagedItems: any[] = [];
  itemsPerPage: number = 8; // You can adjust this number
  currentPage: number = 1;

  // Search
  searchTerm: string = '';

  // Filters
  vehiculeTypes: string[] = ['VOITURE', 'MOTO', 'VELO', 'BUS', 'MINIBUS'];
  vehiculeBrands: string[] = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Nissan', 'Chevrolet', 'Hyundai'];
  selectedBrands: string[] = [];
  activeTypeFilter: string | null = null;

  // Price Slider Configuration
  minVal: number = 0;
  maxVal: number = 1000;
  priceOptions: Options = {
    floor: 0,
    ceil: 1000,
    step: 10,
    translate: (value: number): string => {
      return value + ' TND';
    },
    combineLabels: (minValue: string, maxValue: string): string => {
      return minValue + ' - ' + maxValue;
    },
    showTicks: true,
    tickStep: 200,
    tickValueStep: 200,
    getSelectionBarColor: (minValue: number, maxValue?: number): string => {
      return '#0ab39c';
    },
    getPointerColor: (): string => {
      return '#0ab39c';
    }
  };

  constructor(
    private vehiculeService: VehiculeService, 
    private route: ActivatedRoute, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getVehicules();
    this.setupSearchDebounce();
    this.pageChanged({ itemsPerPage: this.itemsPerPage, page: 1 });
  }


  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedItems = this.filteredVehicules.slice(startItem, endItem);
    this.currentPage = event.page;
}

  // Fetch vehicles from service
  getVehicules(): void {
    this.isLoading = true;
    this.vehiculeService.getVehicules().subscribe({
      next: (data) => {
        this.vehicules = data.map(v => ({
          ...v,
          image: v.image || 'assets/images/default-vehicle.jpg',
          rating: v.rating || 0
        }));
        this.filteredVehicules = [...this.vehicules];
        this.updatePriceRange();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching vehicules', err);
        this.isLoading = false;
      }
    });
  }

  // Update price range based on actual vehicle prices
  updatePriceRange(): void {
    if (this.vehicules.length > 0) {
      const prices = this.vehicules.map(v => v.prixParJour);
      const maxPrice = Math.max(...prices);
      const roundedMax = Math.ceil(maxPrice / 100) * 100;
      
      this.priceOptions = {
        ...this.priceOptions,
        ceil: roundedMax > 1000 ? roundedMax : 1000
      };
      
      this.maxVal = roundedMax > 1000 ? roundedMax : 1000;
    } else {
      this.maxVal = 1000;
    }
  }

  // Setup search with debounce
  setupSearchDebounce(): void {
    this.route.paramMap
      .pipe(debounceTime(300))
      .subscribe(() => this.performSearch());
  }

  // Filter by vehicle type
  vehiculeTypeFilter(type: string): void {
    this.activeTypeFilter = this.activeTypeFilter === type ? null : type;
    this.applyFilters();
  }

  // Filter by brand
  filterByBrand(): void {
    this.applyFilters();
  }

  // Perform search
  performSearch(): void {
    this.applyFilters();
  }

  // Clear all filters
  clearAllFilters(): void {
    this.searchTerm = '';
    this.minVal = 0;
    this.maxVal = this.priceOptions.ceil || 1000;
    this.selectedBrands = [];
    this.activeTypeFilter = null;
    this.filteredVehicules = [...this.vehicules];
  }

  // Navigate to vehicle details
  goToDetail(id: number): void {
    this.router.navigate([`/transportfront/user/detail-vehicule/${id}`]);
  }

  // Handle price range changes
  valueChange(value: number, isLow: boolean): void {
    if (isLow) {
      this.minVal = value;
    } else {
      this.maxVal = value;
    }
    this.applyFilters();
  }

  // Apply all active filters (changed from private to public)
  applyFilters(): void {
    this.filteredVehicules = this.vehicules.filter(vehicule => {

      // Search term filter
      const matchesSearch = !this.searchTerm || 
        vehicule.modele.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (vehicule.agence?.nom && vehicule.agence.nom.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      // Type filter
      const matchesType = !this.activeTypeFilter || vehicule.type === this.activeTypeFilter;
      
      // Price filter
      const matchesPrice = vehicule.prixParJour >= this.minVal && vehicule.prixParJour <= this.maxVal;
      
      // Brand filter
      const matchesBrand = this.selectedBrands.length === 0 || 
        (vehicule.agence?.nom && this.selectedBrands.includes(vehicule.agence.nom));

      this.pageChanged({ itemsPerPage: this.itemsPerPage, page: this.currentPage });
      
      return matchesSearch && matchesType && matchesPrice && matchesBrand;

      
    });
  }
}