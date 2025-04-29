import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VehiculeService } from '../../services/vehicule.service';
import { ReservationService } from '../../services/reservation.service';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-location-form',
  templateUrl: './location-form.component.html',
  styleUrls: ['./location-form.component.scss'],
})
export class LocationFormComponent implements OnInit, AfterViewInit {
  reservationForm!: FormGroup;
  vehicules: any[] = [];
  vehicleUnavailable: boolean = false;
  existingReservations: any[] = [];
  @ViewChild('pickupMap', { static: false }) pickupMapElement!: ElementRef;
  pickupMap!: L.Map;
  pickupMarker!: L.Marker;
  locationName: string = '';
  currentUser: any;
  loading: boolean = false;
  minDate: string = new Date().toISOString().slice(0, 16);
  preselectedVehicleId: string | null = null;
  formErrors = {
    fullName: '',
    phone: '',
    vehicule: '',
    debutLocation: '',
    finLocation: '',
    pickupLocation: '',
  };

  validationMessages = {
    fullName: {
      required: 'Full name is required',
      minlength: 'Full name must be at least 3 characters',
    },
    phone: {
      required: 'Phone number is required',
      pattern: 'Please enter a valid phone number (8-15 digits)',
    },
    vehicule: {
      required: 'Please select a vehicle',
    },
    debutLocation: {
      required: 'Start date is required',
      invalidDate: 'Start date must be in the future',
      unavailable: 'Vehicle is not available for selected dates',
    },
    finLocation: {
      required: 'End date is required',
      invalidDate: 'End date must be after start date',
      unavailable: 'Vehicle is not available for selected dates',
    },
    pickupLocation: {
      required: 'Please select a pickup location',
    },
  };

  constructor(
    private fb: FormBuilder,
    private vehiculeService: VehiculeService,
    private reservationService: ReservationService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.initForm();
    this.loadInitialData();
    this.setupFormListeners();
    // Get vehicle ID from route
    this.route.params.subscribe((params) => {
      const vehicleId = params['id'];
      if (vehicleId) {
        this.preselectedVehicleId = vehicleId;
        if (this.vehicules.length > 0) {
          this.selectPreselectedVehicle();
        }
      }
    });
  }
  // Add new method
  private selectPreselectedVehicle(): void {
    if (this.preselectedVehicleId) {
      const vehicleExists = this.vehicules.some(
        (v) => v.id == this.preselectedVehicleId
      );
      if (vehicleExists) {
        this.reservationForm.patchValue({
          vehicule: this.preselectedVehicleId,
        });
        // Disable the select if vehicle is preselected
        this.reservationForm.get('vehicule')?.disable();
      }
    }
  }
  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    this.cdRef.detectChanges();

    setTimeout(() => {
      if (!this.pickupMapElement?.nativeElement) {
        console.warn('Map container not found, retrying...');
        this.retryMapInitialization();
        return;
      }

      try {
        this.initMaps();
      } catch (error) {
        console.error('Map initialization error:', error);
        this.retryMapInitialization();
      }
    }, 100);
  }

  private retryMapInitialization(attempts = 0): void {
    if (attempts >= 3) {
      console.error('Failed to initialize map after multiple attempts');
      return;
    }

    setTimeout(() => {
      if (this.pickupMapElement?.nativeElement) {
        this.initMaps();
      } else {
        this.retryMapInitialization(attempts + 1);
      }
    }, 300);
  }

  private initMaps(): void {
    // Using only the marker-icon.png you have
    const customIcon = L.icon({
      iconUrl: 'assets/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
    });

    // Clear existing map if any
    if (this.pickupMap) {
      this.pickupMap.remove();
    }

    // Initialize the map
    this.pickupMap = L.map(this.pickupMapElement.nativeElement, {
      center: [36.8065, 10.1815],
      zoom: 10,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.pickupMap);

    // Add marker
    this.pickupMarker = L.marker([36.8065, 10.1815], {
      icon: customIcon,
      draggable: true,
    }).addTo(this.pickupMap);

    // Map click handler
    this.pickupMap.on('click', (e: L.LeafletMouseEvent) => {
      this.pickupMarker.setLatLng(e.latlng);
      this.updateLocationValues(e.latlng.lat, e.latlng.lng);
    });

    // Marker drag handler
    this.pickupMarker.on('dragend', () => {
      const latlng = this.pickupMarker.getLatLng();
      this.updateLocationValues(latlng.lat, latlng.lng);
    });

    // Initialize form values
    this.updateLocationValues(36.8065, 10.1815);
  }

  private updateLocationValues(lat: number, lng: number): void {
    this.reservationForm.patchValue({
      pickupLatitude: lat,
      pickupLongitude: lng,
    });
    this.getLocationName(lat, lng);
  }

  getLocationName(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.address) {
          this.locationName = `${data.address.road || ''} ${
            data.address.city || ''
          }, ${data.address.country || ''}`;
          this.reservationForm.patchValue({
            pickupLocation: this.locationName,
          });
        }
      })
      .catch((error) => {
        console.error('Reverse geocoding error:', error);
      });
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      vehicule: [null, Validators.required],
      debutLocation: [
        '',
        [Validators.required, this.futureDateValidator.bind(this)],
      ],
      finLocation: [
        '',
        [Validators.required, this.futureDateValidator.bind(this)],
      ],
      pickupLocation: ['', Validators.required],
      pickupLatitude: [null],
      pickupLongitude: [null],
      statut: ['EN_ATTENTE'],
    });
  }

  loadInitialData(): void {
    this.loading = true;
    forkJoin([
        this.vehiculeService.getVehicules(),
        this.reservationService.getReservations()
    ]).subscribe(
        ([vehicules, reservations]) => {
            console.log('Loaded vehicles:', vehicules);
            
            this.vehicules = vehicules;
            this.existingReservations = reservations;
            this.loading = false;
            
            if (this.preselectedVehicleId) {
                const vehicle = this.vehicules.find(v => v.id == this.preselectedVehicleId);
                console.log('Preselected vehicle:', vehicle);
            }
        },
        (error) => {
            console.error('Error loading data', error);
            this.loading = false;
        }
    );
}
  getSelectedVehicleDisplay(): string {
    if (!this.preselectedVehicleId) return '';
    const vehicle = this.vehicules.find(v => v.id == this.preselectedVehicleId);
    return vehicle ? 
      `${vehicle.marque} - ${vehicle.modele} (${vehicle.prixParJour } /day)` : 
      'Loading vehicle...';
  }

  setupFormListeners(): void {
    this.reservationForm.valueChanges.subscribe(() => this.validateForm());

    const availabilityFields = ['vehicule', 'debutLocation', 'finLocation'];
    availabilityFields.forEach((field) => {
      this.reservationForm.get(field)?.valueChanges.subscribe(() => {
        if (this.reservationForm.get(field)?.valid) {
          this.checkVehicleAvailability();
        }
      });
    });
  }

  futureDateValidator(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const now = new Date();
    return selectedDate <= now ? { invalidDate: true } : null;
  }

  validateForm(): void {
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        this.formErrors[field as keyof typeof this.formErrors] = '';
        const control = this.reservationForm.get(field);

        if (control && control.invalid && (control.dirty || control.touched)) {
          const messages =
            this.validationMessages[
              field as keyof typeof this.validationMessages
            ];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field as keyof typeof this.formErrors] +=
                messages[key as keyof typeof messages] + ' ';
            }
          }
        }
      }
    }

    const start = this.reservationForm.get('debutLocation')?.value;
    const end = this.reservationForm.get('finLocation')?.value;
    if (start && end && new Date(start) >= new Date(end)) {
      this.formErrors.finLocation = 'End date must be after start date';
      this.reservationForm.get('finLocation')?.setErrors({ invalidDate: true });
    }
  }

  checkVehicleAvailability(): void {
    const selectedVehicleId = this.reservationForm.get('vehicule')?.value;
    const startDate = this.reservationForm.get('debutLocation')?.value;
    const endDate = this.reservationForm.get('finLocation')?.value;

    if (!selectedVehicleId || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      this.vehicleUnavailable = true;
      return;
    }

    this.reservationService
      .checkAvailability(selectedVehicleId, startDate, endDate)
      .subscribe({
        next: (isAvailable) => {
          this.vehicleUnavailable = !isAvailable;
          if (this.vehicleUnavailable) {
            this.reservationForm
              .get('debutLocation')
              ?.setErrors({ unavailable: true });
            this.reservationForm
              .get('finLocation')
              ?.setErrors({ unavailable: true });
          } else {
            this.reservationForm.get('debutLocation')?.setErrors(null);
            this.reservationForm.get('finLocation')?.setErrors(null);
          }
        },
        error: (err) => console.error('Availability check failed:', err),
      });
  }

  onSubmit(): void {
    this.validateForm();

    if (this.reservationForm.invalid || this.vehicleUnavailable) {
      alert('Please correct form errors before submitting');
      return;
    }

    this.loading = true;
    const formValue = this.prepareSubmissionData();

    this.reservationService.createReservation(formValue).subscribe({
      next: () => {
        this.loading = false;
        alert('Reservation created successfully!');
        this.router.navigate(['/transportfront/user/reservations']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Reservation error:', error);
        alert(
          `Reservation failed: ${
            error.error?.message || error.message || 'Unknown error'
          }`
        );
      },
    });
  }

  prepareSubmissionData(): any {
    const formData = this.reservationForm.getRawValue();
    
    const vehicle = this.vehicules.find(v => v.id == formData.vehicule);
    if (!vehicle) {
        throw new Error('Selected vehicle not found');
    }

   
    return {
        ...formData,
        vehicule: { id: formData.vehicule }, 
        prixTotal: this.calculateTotalPrice(
            formData.debutLocation,
            formData.finLocation,
            vehicle.prixParJour
        ),
        userId: this.currentUser.id,
    };
}

calculateTotalPrice(start: string, end: string, dailyPrice: number): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  const total = daysDiff * dailyPrice;
  return Math.round(total * 100) / 100;
}
}
