import {Component, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DecimalPipe } from '@angular/common';
import {FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {finalize, Observable} from 'rxjs';

// import { estateList } from './data';
import {ModalDirective, ModalModule} from 'ngx-bootstrap/modal';
import { Options } from '@angular-slider/ngx-slider';
import {DropzoneConfigInterface, DropzoneModule} from 'ngx-dropzone-wrapper';
import { Store } from '@ngrx/store';
import { addlistingGridData, deletelistingGridData, fetchlistingGridData, updatelistingGridData } from 'src/app/store/App-realestate/apprealestate.action';
import { selectData } from 'src/app/store/App-realestate/apprealestate-selector';
import {PageChangedEvent, PaginationModule} from 'ngx-bootstrap/pagination';
import {SimplebarAngularModule} from "simplebar-angular";
import {SharedModule} from "../../../../shared/shared.module";
import {NgxSliderModule} from "ngx-slider-v2";
import {CentreCampingService} from "../../services/centrecamping.service";
import {CentreCamping} from "../../model/centrecamping.model";
import {AngularFireStorage} from "@angular/fire/compat/storage";
import Swal from "sweetalert2";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {image} from "ngx-editor/schema/nodes";
import * as L from 'leaflet';
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {ReverseGeocodingService} from "../../services/reverse-geocoding.service";
import {RouterLink, RouterModule} from "@angular/router";


@Component({
  selector: 'app-camping',
  standalone: true,
  imports: [CommonModule,
    SimplebarAngularModule,
    SharedModule,
    FormsModule,
    NgxSliderModule,
    PaginationModule,
    ReactiveFormsModule,
    DropzoneModule,
    ModalModule,
    LeafletModule,
    RouterModule,

    BsDropdownModule],
  templateUrl: './camping.component.html',
  styleUrl: './camping.component.scss'
})
export class CampingComponent {
  files: File[] = [];
  page: number = 1
  selectedPropertyType: string = "Villa"
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  productslist: any
  propertyForm!: UntypedFormGroup;


  centreCampingForm!: UntypedFormGroup;
  editCampingForm!: UntypedFormGroup;

  centre: CentreCamping[] = [];
  centrelist: CentreCamping[] = [];
  filteredCentreList: CentreCamping[] = [];
  imageUrl: string = '';
  map: any;
  marker: any;

  submitted = false;
  products: any;
  endItem: any
  // price: any = [500, 3800];

  bedroom: any;

  // Price Slider
  pricevalue: number = 100;
  minValue = 500;
  maxValue = 3800;
  options: Options = {
    floor: 0,
    ceil: 5000,
    translate: (value: number): string => {
      return '$' + value;
    },
  };

  @ViewChild('addProperty', { static: false }) addProperty?: ModalDirective;
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;
  @ViewChild('successContent', { static: false }) successContent?: ModalDirective;
  @ViewChild('editProperty', { static: false }) editProperty?: ModalDirective;



  deleteID: any;
  editData: any;
  currentUser: any;
  constructor(private formBuilder: UntypedFormBuilder,
              public store: Store,
              private centreCampingService: CentreCampingService,
              private reverseGeocodingService: ReverseGeocodingService) {
  }

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);

    this.getCentreCampingList();

    this.centreCampingForm = this.formBuilder.group({
      name: ['', Validators.required],
      longitude: ['', Validators.required],
      latitude: ['', Validators.required],
      address: ['', Validators.required],
      capcite: ['', Validators.required],
      image: ['', Validators.required],
      prixJr: ['', Validators.required] ,
      numTel: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]] // Add numTel with validation


    });

    this.editCampingForm = this.formBuilder.group({
      name: ['', Validators.required],
      longitude: ['', Validators.required],
      latitude: ['', Validators.required],
      address: ['', Validators.required],
      capcite: ['', Validators.required],
      image: ['', Validators.required],
      prixJr: [0, Validators.required], // Add this line,
      numTel: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]] // Add numTel with validation



    });

    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: 'Centre Camping', active: true },
      { label: 'List', active: true }
    ];
    setTimeout(() => {
      this.store.dispatch(fetchlistingGridData());
      this.store.select(selectData).subscribe((data) => {
        this.products = data;
        this.productslist = data;
        this.products = this.productslist.slice(0, 8)
      });
      document.getElementById('elmLoader')?.classList.add('d-none')
    }, 1000);


  }


  ngAfterViewInit(): void {
    if (this.addProperty) {
      this.addProperty.onShown.subscribe(() => {
        setTimeout(() => {
          this.initializeMap('map');
        }, 200);
      });
    }

    if (this.editProperty) {
      this.editProperty.onShown.subscribe(() => {
        setTimeout(() => {
          this.initializeMap('edit-map');
        }, 200);
      });
    }
  }
  initializeMap(mapId: string): void {
    // Check if the map element exists in the DOM
    const mapElement = document.getElementById(mapId);
    if (!mapElement) {
      console.error(`Map element with id '${mapId}' not found in DOM`);
      return;
    }

    // If a map already exists, remove it
    if (this.map) {
      this.map.remove();
      this.map = null; // Clear the reference
      this.marker = null;
    }

    // Initialize the map with the given mapId
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
        if (mapId === 'map') {
          this.centreCampingForm.patchValue({ latitude: lat, longitude: lng });
        } else if (mapId === 'edit-map') {
          this.editCampingForm.patchValue({ latitude: lat, longitude: lng });
        }
        this.getAddress(lat, lng);
        if (this.marker) {
          this.map.removeLayer(this.marker);
        }

        // Add new marker at clicked position
        this.marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(this.map)

      });



      // Force update the dimensions
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
      this.centreCampingForm.patchValue({ address });
      this.editCampingForm.patchValue({ address });

    });
  }



  getCentreCampingList(): void {
    this.centreCampingService.getAllCentreCamping().subscribe((data: CentreCamping[]) => {
      this.centrelist = data;
      this.filteredCentreList = data; // Initialize filtered list
      this.centre = this.centrelist.slice(0, 4); // Show first 4 items initially

    });
  }






  onChangeImage(event: any) {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
      this.centreCampingService.uploadImage(file).subscribe(response => {
        console.log('Image uploaded successfully', response);
        this.imageUrl = response.fileUrl; // Store the image URL
        if (this.addProperty?.isShown) {
          this.centreCampingForm.get('image')?.setValue(this.imageUrl);
        } else if (this.editProperty?.isShown) {
          this.editCampingForm.get('image')?.setValue(this.imageUrl);
        }
        console.log('Image URL:', this.imageUrl);

      });
    }
  }

  saveCentreCamping() {
    if (this.centreCampingForm.valid) {

      const formData = this.centreCampingForm.value;
      formData.idOwner = this.currentUser.id;
      this.centreCampingService.addCentreCamping(formData).subscribe({
        next: (response) => {
          console.log('Camping center added:', response);
          this.addProperty?.hide(); // Hide the form modal
          this.successmsg() // Display the success modal
          this.getCentreCampingList(); // Refresh the list of camping centers
          this.centreCampingForm.reset(); // Reset the form
        },
        error: (error) => {
          console.error('Error adding camping center:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Error while adding camping center',
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

  successmsg() {
    Swal.fire({
      title: 'Congrats Camping center is added now!',
      text: '24h For verification !',
      icon: 'success',
      showCancelButton: true,
      confirmButtonColor: '#4b93ff',
      cancelButtonColor: '#ef476f',
      confirmButtonText: 'OK',

    });
  }

  removeItem(id: any) {
  this.deleteID = id;
  this.deleteRecordModal?.show();
  }

  confirmDelete() {
    this.centreCampingService.deleteCentreCamping(this.deleteID).subscribe({
      next: () => {
        this.getCentreCampingList(); // Refresh the list of camping centers
        this.deleteRecordModal?.hide();
        Swal.fire({
          title: 'Deleted!',
          text: 'Camping center has been deleted.',
          icon: 'success',
          confirmButtonColor: '#4b93ff',
        });
      },
      error: (error) => {
        console.error('Error deleting camping center:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Error while deleting camping center',
          icon: 'error',
          confirmButtonColor: '#ef476f',
        });
      }
    });
  }

  private editId: any; // Property to store the id

  editItem(id: any) {
    this.centreCampingService.getCentreCamping(id).subscribe({
      next: (response) => {
        this.editId = id; // Store the id
        this.editCampingForm.patchValue(response);
        console.log('Edit form data:', this.editCampingForm.value);
        this.editProperty?.show();
      },
      error: (error) => {
        console.error('Error fetching camping center:', error);
      }
    });
  }

  updateCentreCamping() {
    if (this.editCampingForm.valid) {
      this.editCampingForm.patchValue({ image: this.imageUrl });
      const formData = this.editCampingForm.value;


      this.centreCampingService.updateCentreCamping(this.editId ,formData).subscribe({
        next: (response) => {
          console.log('Camping center updated:', response);
          this.editProperty?.hide(); // Hide the edit modal
          this.editCampingForm.reset(); // Reset the form
          this.getCentreCampingList(); // Refresh the list of camping centers
          Swal.fire({
            title: 'Success!',
            text: 'Camping Center Updated Successfully!',
            icon: 'success',
            confirmButtonColor: '#4b93ff',
          });
        },
        error: (error) => {
          console.error('Error updating camping center:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Error while updating camping center',
            icon: 'error',
            confirmButtonColor: '#ef476f',
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
      console.log(this.editCampingForm.value)
    }
  }







  // Hide/Show Filter
  showFilter() {
    const filterStyle = (document.getElementById("propertyFilters") as HTMLElement).style.display;
    if (filterStyle == 'none') {
      (document.getElementById("propertyFilters") as HTMLElement).style.display = 'block'
    } else {
      (document.getElementById("propertyFilters") as HTMLElement).style.display = 'none'
    }
  }

  // Add to starr
  starredproduct(id: any, event: any, star: any) {
    event.target.classList.toggle('active')
    if (star == false) {
      this.products[id].starred = true
    } else {
      this.products[id].starred = false
    }
  }

  // filter bedroom wise
  bedroomFilter(ev: any) {
    if (ev.target.value != '') {
      if (ev.target.checked == true) {
        this.products = this.productslist.filter((el: any) => {
          return el.bedroom == ev.target.value
        })
      }
    } else {
      this.products = this.productslist
    }
  }

  // filter of bathrom wise
  bathroomFilter(ev: any) {
    if (ev.target.value != '') {
      if (ev.target.checked == true) {
        this.products = this.productslist.filter((el: any) => {
          return el.bedroom == ev.target.value
        })
      }
    } else {
      this.products = this.productslist
    }
  }

  // location wise filter
  location() {
    const location = (document.getElementById("select-location") as HTMLInputElement).value
    if (location) {
      this.products = this.productslist.filter((data: any) => {
        return data.location === location
      })
    } else {
      this.products = this.productslist
    }
    this.updateNoResultDisplay()
  }

  /**
   * Range Slider Wise Data Filter
   */
  valueChange(event: number, isMinValue: boolean) {
    if (isMinValue) {
      this.minValue = event;
    } else {
      this.maxValue = event;
    }

  }

  property() {
    this.products = this.productslist.filter((data: any) => {
      if (this.selectedPropertyType === "") {
        return true
      } else {
        return data.type === this.selectedPropertyType
      }
    })
  }

  onSearch(event: any): void {
    const searchTerm = event.target.value?.toLowerCase() || '';
    this.filteredCentreList = this.centrelist.filter(centre =>
      (centre?.name?.toLowerCase() || '').includes(searchTerm) ||
      (centre?.address?.toLowerCase() || '').includes(searchTerm)
    );
    this.centre = this.filteredCentreList.slice(0, 4); // Update displayed items
  }

  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = Math.min(event.page * event.itemsPerPage, this.filteredCentreList.length);
    this.centre = this.filteredCentreList.slice(startItem, endItem);
  }
  // no result
  updateNoResultDisplay() {
    const noResultElement = document.getElementById('noresult') as HTMLElement;
    const paginationElement = document.getElementById('pagination-element') as HTMLElement;

    if (this.products.length === 0) {
      noResultElement.style.display = 'block';
      paginationElement.classList.add('d-none')
    } else {
      noResultElement.style.display = 'none';
      paginationElement.classList.remove('d-none')
    }
  }

  getTotalMaterielQuantity(centre: any): number {
    if (!centre.materiels || !Array.isArray(centre.materiels)) {
      return 0;
    }
    return centre.materiels.reduce((total: number, materiel: any) => {
      return total + (materiel.quantity || 0);
    }, 0);
  }

  getTotalLogementQuantity(centre: any): number {
    if (!centre.logements || !Array.isArray(centre.logements)) {
      return 0;
    }
    return centre.logements.reduce((total: number, logement: any) => {
      return total + (logement.quantity || 0);
    }, 0);
  }


}
