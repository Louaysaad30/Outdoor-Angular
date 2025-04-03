import { Component, OnInit } from '@angular/core';
import { VehiculeService } from '../../../services/vehicule.service';
import { ActivatedRoute } from '@angular/router';
import { debounceTime } from 'rxjs/operators'; 
import { Vehicule } from '../../../models/vehicule.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vehicule-list',
  templateUrl: './vehicule-list.component.html',
  styleUrls: ['./vehicule-list.component.scss'],
})
export class VehiculeListComponent implements OnInit {
  vehicules: Vehicule[] = [];
  filteredVehicules: Vehicule[] = [];
  searchTerm: string = '';
  vehiculeTypes: string[] = ['SUV', 'Sedan', 'Truck', 'Van']; 
  vehiculeBrands: string[] = ['Toyota', 'Honda', 'Ford', 'BMW']; 

  pricevalue: number = 10;
  maxVal: number = 100;
  minVal: number = 0;
  isLoading: boolean = true;

  constructor(private vehiculeService: VehiculeService, private route: ActivatedRoute , private router: Router) {}

  ngOnInit(): void {
    this.getVehicules();
    this.debounceSearch();
  }

  // Fetch all vehicules from the backend
  getVehicules() {
    this.isLoading = true;
    this.vehiculeService.getVehicules().subscribe({
      next: (data) => {
        this.vehicules = data;  
        this.filteredVehicules = this.vehicules; // Initially show all vehicles
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching vehicules', err);
        this.isLoading = false;
      }
    });
  }

  // Filter vehicules based on vehicule type
  vehiculeTypeFilter(type: string) {
    this.filteredVehicules = this.vehicules.filter(vehicule => vehicule.type === type);
  }

  // Handle brand filter changes
  filterByBrand(event: any, brand: string) {
    if (event.target.checked) {
      this.filteredVehicules = this.vehicules.filter(vehicule => vehicule.agence?.nom === brand);
    } else {
      this.getVehicules(); // Reset to all vehicules
    }
  }

  // Search functionality with debounce
  performSearch() {
    this.filteredVehicules = this.vehicules.filter(vehicule => 
      vehicule.modele.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  debounceSearch() {
    const searchObservable = this.route.paramMap.pipe(debounceTime(300));
    searchObservable.subscribe(() => this.performSearch());
  }

  // Handle pagination (next/previous pages)
  pageChanged(event: any) {
    let pageIndex = event.page - 1;
    this.filteredVehicules = this.vehicules.slice(pageIndex * 12, (pageIndex + 1) * 12);
  }


  // Clear all filters
  clearAllFilters() {
    this.filteredVehicules = this.vehicules;
    this.searchTerm = '';
    this.minVal = 0;
    this.maxVal = 100;
    this.filterByPrice();
  }

  goToDetail(id: number): void {
    this.router.navigate(['/transportfront/user/detail-vehicule/${id}']);
  }

  // Handle price slider changes
  valueChange(value: number, isLow: boolean) {
    if (isLow) {
      this.minVal = value;
    } else {
      this.maxVal = value;
    }
    this.filterByPrice();
  }

  // Filter vehicules by price range
  filterByPrice() {
    this.filteredVehicules = this.vehicules.filter(vehicule => 
      vehicule.prixParJour >= this.minVal && vehicule.prixParJour <= this.maxVal
    );
  }
}
