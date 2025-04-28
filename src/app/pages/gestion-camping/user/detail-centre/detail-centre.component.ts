import {ChangeDetectorRef, Component, NgZone, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {CentreCampingService} from "../../services/centrecamping.service";
import {CentreCamping} from "../../model/centrecamping.model";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {
  FormBuilder, FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from "@angular/forms";
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import * as L from 'leaflet';

import {PaginationModule} from "ngx-bootstrap/pagination";
import {SharedModule} from "../../../../shared/shared.module";
import {Logement} from "../../model/logments.model";
import {LogementService} from "../../services/logements.service";
import {TypeLogement} from "../../model/typeLogment.model";
import { ModalDirective } from "ngx-bootstrap/modal";
import { ModalModule } from "ngx-bootstrap/modal";

import {ReverseGeocodingService} from "../../services/reverse-geocoding.service";
import Swal from "sweetalert2";
import {Materiel} from "../../model/materiel.model";
import {MaterielService} from "../../services/materiel.service";
import {circle, icon, latLng, marker, polygon, tileLayer} from "leaflet";

import { FullCalendarModule } from '@fullcalendar/angular';
import {ReservationService} from "../../services/reservation.service";
import { catchError, finalize, map } from 'rxjs/operators';
import {of} from "rxjs";
import {UserDto} from "../../model/userDTO.model";
import {SimplebarAngularModule} from "simplebar-angular";
import {ReviewService} from "../../services/review.service";



@Component({
  selector: 'app-detail-centre',
  standalone: true,
  imports: [CommonModule,
    BsDropdownModule,
    LeafletModule,
    ReactiveFormsModule,
    SharedModule,
    FullCalendarModule, FormsModule, SimplebarAngularModule,
    ModalModule
// Add this
  ],
  templateUrl: './detail-centre.component.html',
  styleUrl: './detail-centre.component.scss'
})
export class DetailCentreComponent {




  breadCrumbItems!: Array<{}>;
  currentTab: any = 'Materiels';

  centre: CentreCamping | undefined;
  logments: Logement[] = [];
  logementForm!: FormGroup;
  editCampingForm!: FormGroup;
  editLogementForm!: UntypedFormGroup;
  logementToEdit: any;
  materielToEdit: any;
  deleteID: any;
  logementTypes = Object.values(TypeLogement);
  imageUrl: string = '';
  map: any;
  materiels: Materiel[] = [];
  materielForm!: FormGroup;
  editMaterielForm!: FormGroup;
  marker: any;
  centerMapOptions: any;
  priceRange: { min: number, max: number } = { min: 0, max: 0 };





// Add these properties to your class
  showReservationCalendar: boolean = false;
  selectedItems: any[] = [];
  currentBookingTab: string = 'logements';
  startDate: string = '';
  endDate: string = '';
  daysDifference: number = 0;
  centreFee: number = 0;
  itemsTotal: number = 0;
  totalPrice: number = 0;
  // Add these properties for tracking quantities
  logementQuantities: Map<number, number> = new Map();
  materielQuantities: Map<number, number> = new Map();
  numberOfPersons: number = 1;
  isCheckingAvailability: boolean = false;
  availabilityErrors: string[] = [];
  currentUser: any;

  ownerCentre: UserDto | null = null;

  reviewsWithDetails: Array<{
    review: any;
    user: UserDto | null;
    sentiment: {label: string, score: number} | null;
    isAnalyzing: boolean;
  }> = [];
  isLoadingReviews: boolean = false;

  @ViewChild('reviewModal', { static: false }) reviewModal?: ModalDirective;
  reviewForm: FormGroup = new FormGroup({
    text: new FormControl('', [Validators.required, Validators.minLength(3)])
  });



  constructor(
    private route: ActivatedRoute,
    private centreCampingService: CentreCampingService,
    private logementService: LogementService,
    private materielService: MaterielService,
    private reverseGeocodingService: ReverseGeocodingService,
    private router: Router,
    private formBuilder: UntypedFormBuilder,
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private reviewService: ReviewService,





  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Camping Centre' }, { label: 'Overview', active: true }];
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    console.log(this.currentUser);


    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.centreCampingService.getCentreCamping(+id).subscribe((data) => {
        this.centre = data;
        this.initializeCenterMap(); // Initialize map after data loads

        if (this.centre?.idOwner !== undefined) {
          this.reservationService.getUserById(this.centre.idOwner).subscribe({
            next: (data) => {
              console.log('Owner data received:', data);
              this.ownerCentre = data; // Store the data in the component property
            },
            error: (error) => {
              console.error('Error fetching owner details:', error);
              this.ownerCentre = null; // Set to null on error to prevent template issues
            }
          });
        }


        this.fetchLogments(+id);
        this.fetchMateriels(+id);
        this.fetchReviews();
        this.calculatePriceRange();


        console.log(this.centre);
        console.log(this.materiels);

      });
    }
  }

  fetchReviews(): void {
    if (!this.centre?.idCentre) {
      console.error('Cannot fetch reviews: Centre ID is undefined');
      return;
    }

    this.isLoadingReviews = true;
    this.reviewsWithDetails = [];

    this.reviewService.getReviewsByCenterId(this.centre.idCentre).subscribe({
      next: (reviews) => {
        console.log('Fetched reviews:', reviews);

        // Initialize reviewsWithDetails with empty user data
        this.reviewsWithDetails = reviews.map(review => ({
          review,
          user: null,
          sentiment: null,
          isAnalyzing: true
        }));

        // Load user details and analyze sentiment for each review
        this.reviewsWithDetails.forEach(reviewData => {
          // Fetch user data
          if (reviewData.review.userId) {
            this.reservationService.getUserById(reviewData.review.userId).subscribe({
              next: (userData) => {
                reviewData.user = userData;
              },
              error: (error) => {
                console.error(`Error fetching user ${reviewData.review.userId}:`, error);
                reviewData.user = null;
              }
            });
          }

          // Analyze sentiment
          if (reviewData.review.text) {
            this.centreCampingService.analyzeText(reviewData.review.text).subscribe({
              next: (response) => {
                if (response && response[0] && response[0][0]) {
                  reviewData.sentiment = {
                    label: response[0][0].label,
                    score: response[0][0].score
                  };
                }
                reviewData.isAnalyzing = false;
              },
              error: (error) => {
                console.error('Error analyzing review text:', error);
                reviewData.isAnalyzing = false;
              }
            });
          } else {
            reviewData.isAnalyzing = false;
          }
        });
      },
      error: (error) => {
        console.error('Error fetching reviews:', error);
        this.reviewsWithDetails = [];
      },
      complete: () => {
        this.isLoadingReviews = false;
      }
    });
  }

// Method to manually refresh reviews
  refreshReviews(): void {
    this.fetchReviews();
  }


  initializeCenterMap(): void {
    if (!this.centre?.latitude || !this.centre?.longitude) {
      console.warn('Center location data not available');
      return;
    }

    // Default Leaflet icon
    const defaultIcon = icon({
      iconSize: [25, 41],
      iconAnchor: [13, 41],
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
    });

    this.centerMapOptions = {
      layers: [
        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }),
        marker([this.centre.latitude, this.centre.longitude], {
          icon: defaultIcon
        })
      ],
      zoom: 13,
      center: latLng(this.centre.latitude, this.centre.longitude)
    };
  }

  fetchMateriels(centreId: number): void {
    this.materielService.getMaterielsByCentre(centreId).subscribe((materiels) => {
      this.materiels = materiels;
      console.log(this.materiels);
    });
  }

  initializeMap(mapId: string): void {
    const mapElement = document.getElementById(mapId);
    if (!mapElement) {
      console.error(`Map element with id '${mapId}' not found in DOM`);
      return;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;

    }

    try {
      this.map = L.map(mapId).setView([36.8044,10.1693], 9);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      this.map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.editCampingForm.patchValue({ latitude: lat, longitude: lng });
        this.getAddress(lat, lng);

        if (this.marker) {
          this.map.removeLayer(this.marker);
        }

        // Add new marker at clicked position
        this.marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(this.map)

      });

      setTimeout(() => {
        this.map.invalidateSize();
      }, 300);
    } catch (error) {
      console.error(`Error initializing map with id '${mapId}':`, error);
    }
  }

  getAddress(lat: number, lng: number): void {
    this.reverseGeocodingService.reverseGeocode(lat, lng).subscribe(response => {
      const address = response.results[0]?.formatted || 'Address not found';
      this.editCampingForm.patchValue({ address });
    });
  }

  fetchLogments(centreId: number): void {
    this.logementService.getLogementsByCentre(centreId).subscribe((logments) => {
      this.logments = logments;
      console.log(this.logments);
    });
  }

  changeTab(tab: string) {
    this.currentTab = tab;
  }

  getTotalLogementQuantity(): number {
    return this.logments.reduce((total, logement) => {
      return total + (logement.quantity || 0);
    }, 0);
  }

  getTotalMaterielQuantity(): number {
    return this.materiels.reduce((total, materiel) => {
      return total + (materiel.quantity || 0);
    }, 0);
  }

  async calculatePriceRange(): Promise<void> {
    console.log('--- Starting price calculation ---');

    // Ensure all data is loaded first
    await this.loadAllData();

    const prices: number[] = [];

    // 1. Add center price
    if (this.centre?.prixJr !== undefined) {
      const price = Number(this.centre.prixJr);
      if (!isNaN(price)) prices.push(price);
    }

    // 2. Add logement prices (check both 'price' and 'prix' properties)
    if (this.logments?.length) {
      this.logments.forEach(logement => {
        const priceValue = logement.price ;
        if (priceValue !== undefined) {
          const price = Number(priceValue);
          if (!isNaN(price)) prices.push(price);
        }
      });
    }

    // 3. Add materiel prices (check both 'price' and 'prix' properties)
    if (this.materiels?.length) {
      this.materiels.forEach(materiel => {
        const priceValue = materiel.price ;
        if (priceValue !== undefined) {
          const price = Number(priceValue);
          if (!isNaN(price)) prices.push(price);
        }
      });
    }

    console.log('All collected prices:', prices);

    if (prices.length > 0) {
      this.priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    } else {
      this.priceRange = { min: 0, max: 0 };
    }

    console.log('Final price range:', this.priceRange);
  }

  async loadAllData(): Promise<void> {
    try {
      // Example - replace with your actual data loading methods
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) return;

      const [centre, logements, materiels] = await Promise.all([
        this.centreCampingService.getCentreCamping(+id).toPromise(),
        this.logementService.getLogementsByCentre(+id).toPromise(),
        this.materielService.getMaterielsByCentre(+id).toPromise()
      ]);

      this.centre = centre;
      this.logments = logements || [];
      this.materiels = materiels || [];

    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  toggleReservationView(): void {
    this.showReservationCalendar = !this.showReservationCalendar;

    if (this.showReservationCalendar) {
      // Initialize dates to today and tomorrow
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      this.startDate = this.formatDateForInput(today);
      this.endDate = this.formatDateForInput(tomorrow);
      this.calculateDaysDifference();

      // Initialize quantity maps instead of modifying original objects
      this.logementQuantities = new Map(this.logments.map(l => [l.idLogement, 1]));
      this.materielQuantities = new Map(this.materiels.map(m => [m.idMateriel, 1]));

      // Reset selected items
      this.selectedItems = [];

      // Set centre fee if available
      this.centreFee = this.centre?.prixJr || 0;
      this.calculateTotalPrice();
    }
  }

  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  calculateDaysDifference(): void {
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      const timeDiff = Math.abs(end.getTime() - start.getTime());
      this.daysDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Recalculate total price when days change
      this.calculateTotalPrice();
    }
  }

  updateQuantity(item: any, change: number): void {
    // Initialize selectedQuantity if it doesn't exist
    if (!item.selectedQuantity) {
      item.selectedQuantity = 1;
    }

    // Apply change within limits
    const newQuantity = item.selectedQuantity + change;
    if (newQuantity >= 1 && newQuantity <= item.quantity) {
      item.selectedQuantity = newQuantity;
    }
  }

  addToCart(item: any, itemType: string): void {
    // Check if item already has selectedQuantity, if not initialize it
    if (!item.selectedQuantity) {
      item.selectedQuantity = 1;
    }

    // Find the correct ID property based on item type
    const itemId = itemType === 'logement' ? item.idLogement : item.idMateriel;

    // Check if the item is already in the cart
    const existingItemIndex = this.selectedItems.findIndex(
      cartItem => {
        const cartItemId = cartItem.itemType === 'logement'
          ? cartItem.item.idLogement
          : cartItem.item.idMateriel;
        return cartItemId === itemId && cartItem.itemType === itemType;
      }
    );

    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      this.selectedItems[existingItemIndex].selectedQuantity = item.selectedQuantity;
    } else {
      // Add new item to cart
      this.selectedItems.push({
        item: item,
        itemType: itemType,
        selectedQuantity: item.selectedQuantity
      });
    }

    // Calculate total price
    this.calculateTotalPrice();


    // Show success message
    Swal.fire({
      title: 'Added!',
      text: 'Item added to your reservation',
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  }

  updateCartQuantity(index: number, change: number): void {
    const item = this.selectedItems[index];
    console.log(item);
    const newQuantity = item.selectedQuantity + change;

    // Check boundaries
    if (newQuantity >= 1 && newQuantity <= item.item.quantity) {
      item.selectedQuantity = newQuantity;
      this.calculateTotalPrice();
    }
  }
  removeFromCart(index: number): void {
    this.selectedItems.splice(index, 1);
    this.calculateTotalPrice();
  }

  calculateTotalPrice(): void {
    // Calculate items total
    this.itemsTotal = this.selectedItems.reduce((total, item) => {
      return total + (item.item.price * item.selectedQuantity * this.daysDifference);
    }, 0);

    // Calculate centre fee for the duration
    this.centreFee = (this.centre?.prixJr || 0) * this.daysDifference * this.numberOfPersons;

    // Calculate total price
    this.totalPrice = this.centreFee + this.itemsTotal;
  }

  checkAvailability(): Promise<boolean> {
    this.isCheckingAvailability = true;
    this.availabilityErrors = [];

    if (!this.centre || !this.startDate || !this.endDate) {
      this.availabilityErrors.push('Missing reservation details');
      this.isCheckingAvailability = false;
      return Promise.resolve(false);
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    // Format dates for display
    const formatDate = (date: Date) => date.toLocaleDateString();
    const dateRange = `${formatDate(start)} to ${formatDate(end)}`;

    return new Promise<boolean>((resolve) => {
      // Get all reservations for this center
      this.reservationService.getConfirmedReservationsByCentreId(this.centre!.idCentre).pipe(
        map(reservations => {
          let isAvailable = true;

          // 1. Check center capacity
          const overlappingReservations = reservations.filter(r => {
            const rStart = new Date(r.dateDebut);
            const rEnd = new Date(r.dateFin);
            return rEnd >= start && rStart <= end;
          });

          const bookedCapacity = overlappingReservations.reduce((sum, r) => sum + r.nbrPersonnes, 0);
          const availableCapacity = this.centre!.capcite - bookedCapacity;

          if (this.numberOfPersons > availableCapacity) {
            isAvailable = false;
            this.availabilityErrors.push(`Center can only accommodate ${availableCapacity} people for ${dateRange}`);
            console.log(`${availableCapacity} `);
          }

          // 2. Check item availability
          for (const selectedItem of this.selectedItems) {
            const item = selectedItem.item;
            const itemType = selectedItem.itemType;
            const requestedQuantity = selectedItem.selectedQuantity;

            // Find overlapping reservations for this item
            const bookedItems = overlappingReservations.flatMap(r =>
              r.lignesReservation?.filter(ligne => {
                if (itemType === 'logement' && ligne.logement) {
                  return ligne.logement.idLogement === item.idLogement;
                } else if (itemType === 'materiel' && ligne.materiel) {
                  return ligne.materiel.idMateriel === item.idMateriel;
                }
                return false;
              }) || []
            );

            const bookedQuantity = bookedItems.reduce((sum, ligne) => sum + ligne.quantite, 0);
            const availableQuantity = item.quantity - bookedQuantity;

            if (requestedQuantity > availableQuantity) {
              isAvailable = false;
              this.availabilityErrors.push(`${item.name} is not available in requested quantity for ${dateRange} (only ${availableQuantity} available)`);
            }
          }

          return isAvailable;
        }),
        catchError(error => {
          console.error('Error fetching reservations:', error);
          this.availabilityErrors.push('An error occurred while checking availability');
          return of(false);
        }),
        finalize(() => this.isCheckingAvailability = false)
      ).subscribe(result => {
        resolve(result);
      });
    });
  }

  async confirmBooking(): Promise<void> {
    if (this.selectedItems.length === 0 || this.daysDifference === 0 || !this.centre) {
      return;
    }

    // First check availability
    const isAvailable = await this.checkAvailability();

    if (!isAvailable) {
      // Show errors in alert
      Swal.fire({
        title: 'Availability Issues',
        html: this.availabilityErrors.map(err => `• ${err}`).join('<br>'),
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    // Create reservation object
    const reservation = {
      idClient: this.currentUser.id,
      confirmed: false,
      dateDebut: start,
      dateFin: end,
      nbrPersonnes: this.numberOfPersons,
      prixCamping: this.centreFee,
      prixLigne: this.itemsTotal,
      prixTotal: this.totalPrice,
      centre: this.centre,
      lignesReservation: this.selectedItems.map(item => ({
        dateDebut: start,
        dateFin: end,
        quantite: item.selectedQuantity,
        prix: item.item.price * item.selectedQuantity * this.daysDifference,
        logement: item.itemType === 'logement' ? item.item : null,
        materiel: item.itemType === 'materiel' ? item.item : null
      }))
    };

    console.log('Sending reservation:', reservation);

    this.reservationService.addReservation(reservation).subscribe({
      next: (response) => {
        console.log('Reservation success response:', response);
        Swal.fire({
          title: 'Success!',
          text: 'Your reservation has been created successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          this.selectedItems = [];
          this.showReservationCalendar = false;
        });
      },
      error: (error) => {
        // Error handling code unchanged
        if (error === 'OK' || (error && error.status === 200)) {
          Swal.fire({
            title: 'Success!',
            text: 'Your reservation has been created successfully.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.selectedItems = [];
            this.showReservationCalendar = false;
          });
        } else {
          console.error('Reservation error details:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Failed to create reservation. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      }
    });
  }

  openReviewModal() {
    this.reviewForm.reset();
    if (this.reviewModal) {
      this.reviewModal.show();
    }
  }

  saveReview() {
    if (this.reviewForm.invalid) {
      return;
    }

    const reviewText = this.reviewForm.controls['text'].value;

    if (!reviewText || !this.centre?.idCentre) {
      return;
    }

    const reviewData = {
      text: reviewText,
      userId: this.currentUser.id,
      centerId: this.centre.idCentre
    };

    this.reviewService.addReview(reviewData).subscribe({
      next: () => {
        this.reviewModal?.hide();
        this.reviewForm.reset();
        this.fetchReviews();
        Swal.fire({
          title: 'Success',
          text: 'Review added successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error saving review:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to save your review',
          icon: 'error'
        });
      }
    });
  }

  deleteReview(reviewId: number) {
    Swal.fire({
      title: 'Delete Review',
      text: 'Are you sure you want to delete this review?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reviewService.deleteReview(reviewId).subscribe({
          next: () => {
            this.fetchReviews();
            Swal.fire({
              title: 'Deleted!',
              text: 'Your review has been deleted.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error deleting review:', error);
            Swal.fire({
              title: 'Error',
              text: 'Failed to delete review.',
              icon: 'error'
            });
          }
        });
      }
    });
  }
}
