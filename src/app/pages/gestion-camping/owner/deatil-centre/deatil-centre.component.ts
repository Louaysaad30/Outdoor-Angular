import {Component, NgZone, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {CentreCampingService} from "../../services/centrecamping.service";
import {CentreCamping} from "../../model/centrecamping.model";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {
  FormBuilder,
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
import {ModalDirective, ModalModule} from "ngx-bootstrap/modal";
import {ReverseGeocodingService} from "../../services/reverse-geocoding.service";
import Swal from "sweetalert2";
import {Materiel} from "../../model/materiel.model";
import {MaterielService} from "../../services/materiel.service";
import {circle, icon, latLng, marker, polygon, tileLayer} from "leaflet";
import {TypeMateriel} from "../../model/typeMateriel.model";
import {ReservationService} from "../../services/reservation.service";
import {FullCalendarModule} from "@fullcalendar/angular";
import {CalendarOptions, EventInput} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import {catchError,map} from "rxjs/operators";
import {finalize,of} from "rxjs";
import {CountUpModule} from "ngx-countup";
import {NgApexchartsModule} from "ng-apexcharts";
import {UserDto} from "../../model/userDTO.model";
import {SimplebarAngularModule} from "simplebar-angular";
import {ReviewService} from "../../services/review.service";



@Component({
  selector: 'app-deatil-centre',
  standalone: true,
  imports: [CommonModule, BsDropdownModule, FormsModule, LeafletModule, PaginationModule, RouterLink, SharedModule, ReactiveFormsModule,
    ModalModule,
    FullCalendarModule, CountUpModule, NgApexchartsModule, SimplebarAngularModule,
  ],
  templateUrl: './deatil-centre.component.html',
  styleUrl: './deatil-centre.component.scss'
})
export class DeatilCentreComponent {
  @ViewChild('addLogement') addLogement!: ModalDirective;
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;
  @ViewChild('successContent', { static: false }) successContent?: ModalDirective;
  @ViewChild('editProperty', { static: false }) editProperty?: ModalDirective;
  @ViewChild('deleteRecordLogementModal', { static: false }) deleteRecordLogementModal?: ModalDirective;
  @ViewChild('editLogementModal', { static: false }) editLogementModal?: ModalDirective;
  @ViewChild('addMateriel') addMateriel!: ModalDirective;
  @ViewChild('editMaterielModal', { static: false }) editMaterielModal?: ModalDirective;
  @ViewChild('deleteRecordMaterielModal', { static: false }) deleteRecordMaterielModal?: ModalDirective;
  @ViewChild('reservationModal', { static: false }) reservationModal?: ModalDirective;





  breadCrumbItems!: Array<{}>;
  currentTab: any = 'Materiels';
  reservations: any[] = [];
  calendarEvents: EventInput[] = [];
  isLoading = false;
  selectedReservation: any = null;
  showCalendar: boolean = false; // Tracks whether to show the calendar or the lists
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, listPlugin, interactionPlugin, timeGridPlugin],
    headerToolbar: {
      right: 'dayGridMonth,dayGridWeek,listYear,listMonth,listWeek,listDay',
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
    },
    views: {
      listYear: {
        buttonText: 'Year List',
        listDayFormat: { month: 'long', day: 'numeric' },
        listDaySideFormat: { weekday: 'short' }
      },
      listMonth: { buttonText: 'Month List' },
      listWeek: { buttonText: 'Week List' },
      listDay: { buttonText: 'Day List' }
    }
  };  isCheckingAvailability: boolean = false;
  availabilityErrors: string[] = [];
  calendarTab: 'calendar' | 'stats' = 'calendar';

  centre: CentreCamping | undefined;
  logments: Logement[] = [];
  logementForm!: FormGroup;
  editCampingForm!: FormGroup;
  editLogementForm!: UntypedFormGroup;
  logementToEdit: any;
  materielToEdit: any;
  deleteID: any;
  logementTypes = Object.values(TypeLogement);
  typeMateriel = TypeMateriel;
  imageUrl: string = '';
  map: any;
  materiels: Materiel[] = [];
  materielForm!: FormGroup;
  editMaterielForm!: FormGroup;
  marker: any;
  centerMapOptions: any;
  priceRange: { min: number, max: number } = { min: 0, max: 0 };


  totalVisitors: number = 0;
  totalIncome: number = 0;
  centerFeeIncome: number = 0;
  lineItemsIncome: number = 0;

  revenueCharts!: any;
  monthlyStats: any = [];
  monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // New properties for year navigation
  availableYears: number[] = [];
  selectedYear: number = new Date().getFullYear();
  allReservations: any[] = []; // Store all reservations for filtering



  confirmedReservationsChart: any;
  confirmedReservationsPercentage: number = 0;

  ownerCentre: UserDto | null = null;
  clientData: UserDto | null = null;
  reservationUsers: UserDto[] = [];


  reviewsWithDetails: Array<{
    review: any;
    user: UserDto | null;
    sentiment: {label: string, score: number} | null;
    isAnalyzing: boolean;
  }> = [];
  isLoadingReviews: boolean = false;





  constructor(
    private route: ActivatedRoute,
    private centreCampingService: CentreCampingService,
    private logementService: LogementService,
    private materielService: MaterielService,
    private reverseGeocodingService: ReverseGeocodingService,
    private reservationService: ReservationService,
    private router: Router,
    private formBuilder: UntypedFormBuilder,
    private fb: FormBuilder,
    private reviewService: ReviewService,



  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Camping Centre' }, { label: 'Overview', active: true }];
    this._setupRevenueCharts('["--tb-primary", "--tb-success", "--tb-warning", "--tb-info"]');


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
        this.loadReservationUsers(); // Add this line
        this.fetchReviews(); // Add this line to fetch and analyze reviews

        this.calculatePriceRange();




        console.log(this.centre);
        console.log(this.materiels);

      });
    }

    this.editLogementForm = this.formBuilder.group({
      image: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      type: ['', Validators.required],
      quantity: ['', Validators.required],
      price: ['', Validators.required]
    });

    this.logementForm = this.fb.group({
      image: [null, Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      type: ['', Validators.required],
      quantity: [0, Validators.required],
      price: [0, Validators.required]
    });

    this.editCampingForm = this.fb.group({
      name: ['', Validators.required],
      longitude: ['', Validators.required],
      latitude: ['', Validators.required],
      address: ['', Validators.required],
      capcite: ['', Validators.required],
      image: ['', Validators.required],
      prixJr: [0, Validators.required], // Add this line
      numTel: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]] // Add numTel with validation


    });

    this.materielForm = this.fb.group({
      image: ["", Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      quantity: [0, Validators.required],
      price: [0, Validators.required],
      type: ['', Validators.required] // Add this field

    });

    this.editMaterielForm = this.fb.group({
      image: ["", Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      quantity: [0, Validators.required],
      price: [0, Validators.required],
      type: ['', Validators.required] // Add this field

    });
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

  loadReservationUsers(): void {
    if (!this.centre?.idCentre) return;

    this.reservationUsers = [];

    this.reservationService.getUsersByCentreId(this.centre.idCentre).subscribe({
      next: (users) => {
        this.reservationUsers = users;
        console.log('Users with reservations:', users);
      },
      error: (error) => {
        console.error('Error loading reservation users:', error);
      }
    });
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

  saveMateriel(): void {
    if (this.materielForm.valid) {
      const newMateriel: Materiel = {
        ...this.materielForm.value,
        centre: { idCentre: this.centre!.idCentre } // Include the idCentre
      };
      this.materielService.addMateriel(newMateriel).subscribe(() => {
        this.fetchMateriels(this.centre!.idCentre);
        this.materielForm.reset();
        this.addMateriel.hide();
      });
    }
  }

  onChangeMaterielImage(event: any): void {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
      const formData: FormData = new FormData();
      formData.append('file', file);

      this.materielService.uploadImage(file).subscribe({
        next: (response) => {
          console.log('Image uploaded successfully', response);
          const imageUrl = response.fileUrl; // Store the image URL
          if (this.editMaterielModal?.isShown) {
            this.editMaterielForm.get('image')?.setValue(imageUrl);
          } else {
            this.materielForm.get('image')?.setValue(imageUrl);
          }
          console.log('Image URL:', imageUrl);
        },
        error: (error) => {
          console.error('Error uploading image:', error);
        }
      });
    }
  }

  fetchMateriels(centreId: number): void {
    this.materielService.getMaterielsByCentre(centreId).subscribe((materiels) => {
      this.materiels = materiels;
      console.log(this.materiels);
    });
  }

  editMateriel(id: number): void {
    this.materielService.getMateriel(id).subscribe((materiel) => {
      this.materielToEdit = materiel;
      this.editMaterielForm.patchValue(materiel);
      this.editMaterielModal?.show();
    });
  }
  updateMateriel(): void {
    if (this.editMaterielForm.valid) {
      const updatedMateriel: Materiel = {
        ...this.editMaterielForm.value,
        idMateriel: this.materielToEdit.idMateriel,
        centre: this.centre // Ensure the centre object is included
      };
      this.materielService.updateMateriel(updatedMateriel).subscribe({
        next: (response) => {
          console.log('Materiel updated:', response);
          this.editMaterielModal?.hide();
          this.fetchMateriels(this.centre!.idCentre); // Refresh the list of materiels
          Swal.fire({
            title: 'Success!',
            text: 'Materiel Updated Successfully!',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        },
        error: (error) => {
          console.error('Error updating materiel:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Error while updating materiel',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Warning!',
        text: 'Please fill all required fields.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
    }
  }

  removeMateriel(id: number): void {
    this.deleteID = id;
    this.deleteRecordMaterielModal?.show();
  }

  confirmDeleteMateriel(): void {
    this.materielService.deleteMateriel(this.deleteID).subscribe({
      next: () => {
        this.deleteRecordMaterielModal?.hide();
        Swal.fire({
          title: 'Deleted!',
          text: 'Materiel has been deleted.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then((result) => {
          if (result.isConfirmed) {
            this.fetchMateriels(this.centre!.idCentre); // Refresh the list of materiels
          }
        });
      },
      error: (error) => {
        console.error('Error deleting materiel:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Error while deleting materiel',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  removeLogement(id: any) {
    this.deleteID = id;
    this.deleteRecordLogementModal?.show();
    console.log(this.deleteID);
  }

  confirmDeleteLogement() {
    this.logementService.deleteLogement(this.deleteID).subscribe({
      next: () => {
        this.deleteRecordLogementModal?.hide();
        Swal.fire({
          title: 'Deleted!',
          text: 'Logement has been deleted.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then((result) => {
          if (result.isConfirmed) {
            this.ngOnInit(); // Refresh the list of logements
          }
        });
      },
      error: (error) => {
        console.error('Error deleting logement:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Error while deleting logement',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  editLogement(id: any) {
    this.logementService.getLogement(id).subscribe({
      next: (response) => {
        this.logementToEdit = response;
        this.editLogementForm.patchValue(response);
        this.editLogementModal?.show();
      },
      error: (error) => {
        console.error('Error fetching logement:', error);
      }
    });
  }

  updateLogement() {
      if (this.editLogementForm.valid) {
        const formData = {
          ...this.editLogementForm.value,
          idLogement: this.logementToEdit.idLogement,
          centre: this.centre // Ensure the centre object is included
        };
        this.logementService.updateLogement(formData).subscribe({
          next: (response) => {
            console.log('Logement updated:', response);
            this.editLogementModal?.hide();
            this.ngOnInit(); // Refresh the list of logements
            Swal.fire({
              title: 'Success!',
              text: 'Logement Updated Successfully!',
              icon: 'success',
              confirmButtonText: 'OK'
            });
          },
          error: (error) => {
            console.error('Error updating logement:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Error while updating logement',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      } else {
        Swal.fire({
          title: 'Warning!',
          text: 'Please fill all required fields.',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      }
    }

  ngAfterViewInit(): void {
    if (this.editProperty) {
      this.editProperty.onShown.subscribe(() => {
        setTimeout(() => {
          this.initializeMap('edit-map');
        }, 300);
      });
    }
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

  onChangeImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.centreCampingService.uploadImage(file).subscribe(response => {
        console.log('Image uploaded successfully', response);
        this.imageUrl = response.fileUrl;
        this.editCampingForm.get('image')?.setValue(this.imageUrl);
        this.editLogementForm.get('image')?.setValue(this.imageUrl);

        console.log('Image URL:', this.imageUrl);
      });
    }
  }

  private editId: any;
  private deleteCentreID: any;

  editItem(id: any): void {
    this.centreCampingService.getCentreCamping(id).subscribe({
      next: (response) => {
        this.centre = response;
        this.editCampingForm.patchValue(response);
        this.editProperty?.show();
        this.editId = id;
      },
      error: (error) => {
        console.error('Error fetching camping center:', error);
      }
    });
  }

  updateCentreCamping(): void {
    if (this.editCampingForm.valid) {
      this.editCampingForm.patchValue({ image: this.imageUrl });
      const formData = this.editCampingForm.value;
      this.centreCampingService.updateCentreCamping(this.editId, formData).subscribe({
        next: (response) => {
          console.log('Camping center updated:', response);
          this.editProperty?.hide();
          this.centreCampingService.getCentreCamping(this.centre!.idCentre).subscribe((data) => {
            this.centre = data;
            this.fetchLogments(this.centre!.idCentre);
          });
        },
        error: (error) => {
          console.error('Error updating camping center:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Error while updating camping center',
            icon: 'error',
            confirmButtonColor: '#ef476f',
            showCancelButton: true,
          });
        }
      });
    } else {
      Swal.fire({
        title: 'Warning!',
        text: 'Please fill all required fields.',
        icon: 'warning',
        confirmButtonColor: '#ffcc00',
        showCancelButton: true,
      });
    }
  }

  removeItem(id: any): void {
    this.deleteCentreID = id;
    this.deleteRecordModal?.show();
  }

  confirmDelete(): void {
    this.centreCampingService.deleteCentreCamping(this.deleteCentreID).subscribe({
      next: () => {
        // 1. First hide the modal
        this.deleteRecordModal?.hide();

        // 2. Show success message
        Swal.fire({
          title: 'Deleted!',
          text: 'Camping center has been deleted.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then((result) => {
          // 3. Only navigate after user acknowledges the message
          if (result.isConfirmed) {
            this.router.navigate(['/campingback/owner/camping']);
          }
        });
      },
      error: (error) => {
        console.error('Error deleting camping center:', error);
        Swal.fire('Error!', 'Failed to delete camping center', 'error');
      }
    });
  }

  fetchLogments(centreId: number): void {
    this.logementService.getLogementsByCentre(centreId).subscribe((logments) => {
      this.logments = logments;
      console.log(this.logments);
    });
  }

  saveLogement(): void {
      if (this.logementForm.valid) {
        const newLogement: Logement = {
          ...this.logementForm.value,
          centre: { idCentre: this.centre!.idCentre } // Include the idCentre
        };
        this.logementService.addLogement(newLogement).subscribe(() => {
          this.fetchLogments(this.centre!.idCentre);
          this.logementForm.reset();
          this.addLogement.hide();
        });
      }
    }

  onChangeLogementImage(event: any): void {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
      this.logementService.uploadImage(file).subscribe(response => {
        console.log('Image uploaded successfully', response);
        const imageUrl = response.fileUrl; // Store the image URL
        this.logementForm.get('image')?.setValue(imageUrl);

        console.log('Image URL:', imageUrl);
      });
    }
  }

  changeTab(tab: string) {
    this.currentTab = tab;
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



  loadReservations(): void {
    this.isLoading = true;

    if (this.centre?.idCentre) {
      this.reservationService.getReservationsByCentre(this.centre.idCentre).subscribe({
        next: (data) => {
          this.reservations = data;
          console.log(this.reservations);
          this.prepareCalendarEvents();
          this.calculateConfirmedPercentage(); // Add this line
          this.initializeConfirmedReservationsChart(); // Add this line

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching reservations:', error);
          this.isLoading = false;
        },
      });
    } else {
      console.error('Centre ID is undefined');
      this.isLoading = false;
    }
  }

  prepareCalendarEvents(): void {
    const colorClasses = [
      'bg-primary-subtle',
      'bg-success-subtle',
      'bg-danger-subtle',
      'bg-warning-subtle',
      'bg-info-subtle',
      'bg-dark-subtle'
    ];

    this.calendarEvents = this.reservations.map((reservation, index) => {
      // Assign colors in rotation
      const colorClass = colorClasses[index % colorClasses.length];

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
    this.selectedReservation = info.event.extendedProps.reservation;
    if (this.selectedReservation?.idClient) {
      this.reservationService.getUserById(this.selectedReservation.idClient).subscribe({
        next: (userData) => {
          this.clientData = userData;
          console.log('Client data loaded:', this.clientData);
          // Open the modal after client data is loaded
          this.reservationModal?.show();
        },
        error: (error) => {
          console.error('Error loading client data:', error);
          this.clientData = null;
          // Still show the modal even if client data fails to load
          this.reservationModal?.show();
        }
      });
    } else {
      // If there's no client ID, just show the modal
      this.reservationModal?.show();
    }
  }

  loadClientData(clientId: number): void {
    if (!clientId) return;

    this.reservationService.getUserById(clientId).subscribe({
      next: (data) => {
        this.clientData = data;
        console.log('Client data loaded:', data);
      },
      error: (error) => {
        console.error('Error loading client data:', error);
        this.clientData = null;
      }
    });
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleDateString();
  }

  calculateDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  closeModal(): void {
    this.reservationModal?.hide();
  }

  checkAvailability(reservation: any): Promise<boolean> {
    this.isCheckingAvailability = true;
    this.availabilityErrors = [];

    if (!this.centre) {
      this.availabilityErrors.push('Centre information not available');
      this.isCheckingAvailability = false;
      return Promise.resolve(false);
    }

    const start = new Date(reservation.dateDebut);
    const end = new Date(reservation.dateFin);

    // Format dates for display
    const formatDate = (date: Date) => date.toLocaleDateString();
    const dateRange = `${formatDate(start)} to ${formatDate(end)}`;

    return new Promise<boolean>((resolve) => {
      // Get all confirmed reservations for this center
      this.reservationService.getConfirmedReservationsByCentreId(this.centre!.idCentre).pipe(
        map(reservations => {
          let isAvailable = true;

          // 1. Check center capacity
          const overlappingReservations = reservations.filter(r => {
            const rStart = new Date(r.dateDebut);
            const rEnd = new Date(r.dateFin);
            return rEnd >= start && rStart <= end && r.idReservation !== reservation.idReservation;
          });

          const bookedCapacity = overlappingReservations.reduce((sum, r) => sum + r.nbrPersonnes, 0);
          const availableCapacity = this.centre!.capcite - bookedCapacity;

          if (reservation.nbrPersonnes > availableCapacity) {
            isAvailable = false;
            this.availabilityErrors.push(`Center can only accommodate ${availableCapacity} people for ${dateRange}`);
          }

          // 2. Check item availability
          if (reservation.lignesReservation) {
            for (const ligne of reservation.lignesReservation) {
              let item = ligne.logement || ligne.materiel;
              let itemType: 'logement' | 'materiel';
              let requestedQuantity = ligne.quantite;

              if (ligne.logement) {
                item = ligne.logement;
                itemType = 'logement';
              } else if (ligne.materiel) {
                item = ligne.materiel;
                itemType = 'materiel';
              } else {
                continue;
              }

              // Find overlapping reservations for this item
              const bookedItems = overlappingReservations.flatMap(r =>
                r.lignesReservation?.filter(l => {
                  if (itemType === 'logement' && l.logement) {
                    return l.logement.idLogement === item.idLogement;
                  } else if (itemType === 'materiel' && l.materiel) {
                    return l.materiel.idMateriel === item.idMateriel;
                  }
                  return false;
                }) || []
              );

              const bookedQuantity = bookedItems.reduce((sum, l) => sum + l.quantite, 0);

              // Get the total available quantity
              let totalQuantity = 0;
              if (itemType === 'logement') {
                totalQuantity = item.quantity || 0;
              } else if (itemType === 'materiel') {
                totalQuantity = item.quantity || 0;
              }

              const availableQuantity = totalQuantity - bookedQuantity;

              if (requestedQuantity > availableQuantity) {
                isAvailable = false;
                this.availabilityErrors.push(
                  `${item.name || item.type} is not available in requested quantity for ${dateRange} (only ${availableQuantity} available)`
                );
              }
            }
          }
          return isAvailable;
        }),
        catchError(error => {
          console.error('Error checking availability:', error);
          this.availabilityErrors.push('An error occurred while checking availability');
          return of(false);
        }),
        finalize(() => this.isCheckingAvailability = false)
      ).subscribe(result => {
        resolve(result);
      });
    });
  }

  confirmReservation(reservationId: number): void {
    if (!reservationId) return;

    this.reservationService.getReservation(reservationId).subscribe({
      next: (reservation) => {
        // First check availability
        this.checkAvailability(reservation).then(isAvailable => {
          if (!isAvailable) {
            // Show availability errors in alert
            Swal.fire({
              title: 'Availability Issues',
              html: this.availabilityErrors.map(err => `• ${err}`).join('<br>'),
              icon: 'warning',
              confirmButtonText: 'OK'
            });
            return;
          }

          // If available, show confirmation dialog
          Swal.fire({
            title: 'Confirm Reservation?',
            text: 'Are you sure you want to confirm this reservation?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, confirm it!',
            cancelButtonText: 'No, cancel',
            confirmButtonColor: '#28a745',
          }).then((result) => {
            if (result.isConfirmed) {
              this.reservationService.confirmReservation(reservationId).subscribe({
                next: () => {
                  // Update the local reservation status
                  if (this.selectedReservation && this.selectedReservation.idReservation === reservationId) {
                    this.selectedReservation.confirmed = true;
                  }

                  // Refresh the reservations list
                  this.loadReservations();

                  Swal.fire({
                    title: 'Confirmed!',
                    text: 'Reservation has been confirmed successfully.',
                    icon: 'success',
                    confirmButtonColor: '#28a745',
                  });
                },
                error: (error) => {
                  console.error('Error confirming reservation:', error);
                  Swal.fire({
                    title: 'Error!',
                    text: 'Failed to confirm reservation. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#dc3545',
                  });
                },
              });
            }
          });
        });
      },
      error: (error) => {
        console.error('Error fetching reservation details:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Unable to fetch reservation details.',
          icon: 'error',
          confirmButtonColor: '#dc3545',
        });
      }
    });
  }

  toggleView(): void {
    this.showCalendar = !this.showCalendar;

    if (this.showCalendar) {
      this.loadReservations(); // Load calendar data when toggling to calendar view
      this.calculateReservationStatistics();

    }
  }

  calculateReservationStatistics(): void {
    if (!this.centre?.idCentre) return;

    this.isLoading = true;
    this.reservationService.getConfirmedReservationsByCentreId(this.centre.idCentre)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (reservations) => {
          this.allReservations = reservations; // Store all reservations
          this.processAllReservations();
          this.updateChartForSelectedYear();
        },
        error: (error) => {
          console.error('Error calculating reservation statistics:', error);
        }
      });
  }

  private processAllReservations(): void {
    // Calculate totals across all years
    this.totalVisitors = this.allReservations.reduce((sum, res) => sum + res.nbrPersonnes, 0);
    this.totalIncome = this.allReservations.reduce((sum, res) => sum + res.prixTotal, 0);
    this.centerFeeIncome = this.allReservations.reduce((sum, res) => sum + res.prixCamping, 0);
    this.lineItemsIncome = this.totalIncome - this.centerFeeIncome;

    // Extract available years from reservations
    const years = new Set<number>();
    this.allReservations.forEach(res => {
      const date = new Date(res.dateDebut);
      years.add(date.getFullYear());
    });

    this.availableYears = Array.from(years).sort((a, b) => b - a); // Sort descending

    // Set default selected year to most recent year if not already set
    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }
  }

  updateChartForSelectedYear(): void {
    // Filter reservations for selected year
    const yearReservations = this.allReservations.filter(res => {
      const date = new Date(res.dateDebut);
      return date.getFullYear() === this.selectedYear;
    });

    this.prepareMonthlyChartData(yearReservations);
  }

  private prepareMonthlyChartData(reservations: any[]): void {
    // Initialize data for all months of the selected year
    const monthlyData: {[key: string]: any} = {};

    // Initialize all months with zero values
    this.monthNames.forEach((month, index) => {
      const monthKey = `${month} ${this.selectedYear}`;
      monthlyData[monthKey] = {
        visitors: 0,
        centerFee: 0,
        lineItems: 0,
        total: 0
      };
    });

    // Process each reservation
    reservations.forEach(res => {
      const startDate = new Date(res.dateDebut);
      const monthName = this.monthNames[startDate.getMonth()];
      const yearMonth = `${monthName} ${startDate.getFullYear()}`;

      // Only process if it's for the selected year
      if (startDate.getFullYear() === this.selectedYear) {
        const entry = monthlyData[yearMonth];
        entry.visitors += res.nbrPersonnes;
        entry.centerFee += res.prixCamping;
        entry.lineItems += (res.prixTotal - res.prixCamping);
        entry.total += res.prixTotal;
      }
    });

    // Convert to arrays for the chart
    const labels: string[] = [];
    const visitorsData: number[] = [];
    const centerFeeData: number[] = [];
    const lineItemsData: number[] = [];
    const totalData: number[] = [];

    // Add data for all months in order
    this.monthNames.forEach(month => {
      const yearMonth = `${month} ${this.selectedYear}`;
      const data = monthlyData[yearMonth];

      labels.push(yearMonth);
      visitorsData.push(data.visitors);
      centerFeeData.push(data.centerFee);
      lineItemsData.push(data.lineItems);
      totalData.push(data.total);
    });

    // Update chart series with the calculated data
    this.revenueCharts = {
      ...this.revenueCharts,
      series: [
        { name: 'Visitors', type: 'column', data: visitorsData },
        { name: 'Center Fee', type: 'area', data: centerFeeData },
        { name: 'Line Items', type: 'line', data: lineItemsData },
        { name: 'Total Revenue', type: 'line', data: totalData }
      ],
      labels: labels
    };
  }

  // Navigation methods
  selectYear(year: number): void {
    this.selectedYear = year;
    this.updateChartForSelectedYear();
  }

  previousYear(): void {
    const currentIndex = this.availableYears.indexOf(this.selectedYear);
    if (currentIndex < this.availableYears.length - 1) {
      this.selectYear(this.availableYears[currentIndex + 1]);
    }
  }

  nextYear(): void {
    const currentIndex = this.availableYears.indexOf(this.selectedYear);
    if (currentIndex > 0) {
      this.selectYear(this.availableYears[currentIndex - 1]);
    }
  }

  private getChartColorsArray(colors: any) {
    colors = JSON.parse(colors);
    return colors.map(function (value: any) {
      var newValue = value.replace(" ", "");
      if (newValue.indexOf(",") === -1) {
        var color = getComputedStyle(document.documentElement).getPropertyValue(newValue);
        if (color) {
          color = color.replace(" ", "");
          return color;
        }
        else return newValue;
      } else {
        var val = value.split(',');
        if (val.length == 2) {
          var rgbaColor = getComputedStyle(document.documentElement).getPropertyValue(val[0]);
          rgbaColor = "rgba(" + rgbaColor + "," + val[1] + ")";
          return rgbaColor;
        } else {
          return newValue;
        }
      }
    });
  }

  private _setupRevenueCharts(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.revenueCharts = {
      series: [{
        name: 'Visitors',
        type: 'column',
        data: []
      }, {
        name: 'Center Fee',
        type: 'area',
        data: []
      }, {
        name: 'Line Items',
        type: 'line',
        data: []
      }, {
        name: 'Total',
        type: 'line',
        data: []
      }],
      chart: {
        height: 400,
        type: 'line',
        stacked: false,
        toolbar: {
          show: false,
        }
      },
      stroke: {
        width: [0, 2, 3, 3],
        curve: 'smooth'
      },
      plotOptions: {
        bar: {
          columnWidth: '25%'
        }
      },
      fill: {
        opacity: [1, 0.08, 1, 1],
        gradient: {
          inverseColors: false,
          shade: 'light',
          type: "vertical",
          opacityFrom: 0.85,
          opacityTo: 0.55,
          stops: [0, 100, 100, 100]
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
      },
      labels: [], // Will be filled dynamically
      markers: {
        size: 0
      },
      xaxis: {
        type: 'category',
        labels: {
          rotate: -45,
          rotateAlways: true
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (value: any) {
            if (typeof value !== 'undefined') {
              return value.toFixed(0);
            }
            return value;
          }
        }
      },
      colors: colors
    };
  }

  private initializeConfirmedReservationsChart(): void {
    // Set up the chart configuration
    this.confirmedReservationsChart = {
      series: [this.confirmedReservationsPercentage],
      chart: {
        height: 270,
        type: 'radialBar',
      },
      plotOptions: {
        radialBar: {
          hollow: {
            margin: 15,
            size: '65%',
          },
          track: {
            strokeWidth: '100%',
            margin: 5,
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              fontSize: '30px',
              show: true,
              formatter: function (val: any) {
                return val + '%';
              }
            }
          }
        }
      },
      colors: ['var(--tb-success)'],
      labels: ['Confirmed'],
      stroke: {
        lineCap: 'round',
        dashArray: 4
      },
    };
  }

  private calculateConfirmedPercentage(): void {
    if (this.reservations && this.reservations.length > 0) {
      const confirmedCount = this.reservations.filter(res => res.confirmed).length;
      this.confirmedReservationsPercentage = Math.round((confirmedCount / this.reservations.length) * 100);

      // Update chart data
      if (this.confirmedReservationsChart) {
        this.confirmedReservationsChart.series = [this.confirmedReservationsPercentage];
      }
    }
  }

  getTotalLogmentQuantity(): number {
    if (!this.logments || !Array.isArray(this.logments)) {
      return 0;
    }
    return this.logments.reduce((total, logment) => {
      return total + (logment.quantity || 0);
    }, 0);
  }

  getTotalMaterielQuantity(): number {
    if (!this.materiels || !Array.isArray(this.materiels)) {
      return 0;
    }
    return this.materiels.reduce((total, materiel) => {
      return total + (materiel.quantity || 0);
    }, 0);
  }

}

