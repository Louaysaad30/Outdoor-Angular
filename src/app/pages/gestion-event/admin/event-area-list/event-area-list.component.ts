import {Component, OnInit, ViewChild} from '@angular/core';
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {DropzoneConfigInterface, DropzoneModule} from "ngx-dropzone-wrapper";
import {FlatpickrModule} from "angularx-flatpickr";
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {ModalDirective, ModalModule} from "ngx-bootstrap/modal";
import {PageChangedEvent, PaginationModule} from "ngx-bootstrap/pagination";
import {ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {RouterLink} from "@angular/router";
import {SharedModule} from "../../../../shared/shared.module";
import {UiSwitchModule} from "ngx-ui-switch";
import {Store} from "@ngrx/store";

import {
  fetchlistingGridData,
} from "../../../../store/App-realestate/apprealestate.action";
import {icon, latLng, marker, tileLayer} from "leaflet";
import {EventAreaService} from "../../services/event-area.service";
import {EventArea} from "../../models/event-area.model";
import {ReverseGeocodingService} from "../../services/reverse-geocoding.service";

@Component({
  selector: 'app-event-area-list',
  standalone: true,
  imports: [
    BsDropdownModule,
    DropzoneModule,
    FlatpickrModule,
    LeafletModule,
    ModalModule,
    PaginationModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule,
    UiSwitchModule
  ],
  templateUrl: './event-area-list.component.html',
  styleUrl: './event-area-list.component.scss'
})
export class EventAreaListComponent implements OnInit{

  breadCrumbItems!: Array<{}>;
  propertyForm!: UntypedFormGroup;
  submitted = false;
  masterSelected!: boolean;
  term: any
  bedroom: any;
  files: File[] = [];
  eventArea: any;
  allEventAreas: EventArea[] = [];
  eventAreas: EventArea[]=[];
  itemsPerPage: number = 3;
  currentPage: number = 1;

  mapMarkers: any[] = [];

  imageURL: any;
  uploadedFiles: any[] = [];
  uploadedFile: File | null = null;

  isEditMode = false;


  @ViewChild('addProperty', { static: false }) addProperty?: ModalDirective;
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;
  deleteID: any;

  constructor(private formBuilder: UntypedFormBuilder, public store: Store , private eventAreaService : EventAreaService,    private reverseGeocodingService: ReverseGeocodingService) {
  }

  ngOnInit(): void {
/**
 * BreadCrumb
 */
      this.breadCrumbItems = [
        { label: 'Dashboard', active: false },
        { label: 'Event Management', active: false },
        { label: 'Event Areas', active: true }
      ];

    /**
     * Form Validation
     */
    this.propertyForm = this.formBuilder.group({
      id: [''],
      title: ['', [Validators.required]],
      price: ['', [Validators.required]],
      location: ['', [Validators.required]],
      img: [''],
      Atitude: ['', [Validators.required]],
      Longitude: ['', [Validators.required]]
    });


    setTimeout(() => {
      this.store.dispatch(fetchlistingGridData());
      this.eventAreaService.getAllEventAreas().subscribe((data: EventArea[]) => {
        this.allEventAreas = data;
        this.allEventAreas.forEach(area => {
          this.reverseGeocodingService.reverseGeocode(area.latitude, area.longitude)
            .subscribe((address: string) => area.address = address);
        });
        this.eventAreas = this.allEventAreas.slice(0, this.itemsPerPage);
        this.updateMarkers();
      });
      document.getElementById('elmLoader')?.classList.add('d-none');
    }, 1000);

    console.log("aloooo",this.eventAreas);

  }

  updateMarkers(): void {
  this.mapMarkers = this.allEventAreas.map((area: EventArea) => {
    return marker([area.latitude, area.longitude], {
      icon: icon({
        iconSize: [25, 41],
        iconAnchor: [13, 41],
        iconUrl: '/assets/images/leaflet/marker-icon.png',
        shadowUrl: '/assets/images/leaflet/marker-shadow.png'
      })
    }).bindPopup(`<b>${area.name}</b><br/>Capacity: ${area.capacity}`);
  });
}


handleMapClick(event: any): void {
    this.isEditMode = false;
    this.propertyForm.reset();
    this.imageURL = null;
    this.uploadedFile = null;

    this.propertyForm.patchValue({
      Atitude: event.latlng.lat,
      Longitude: event.latlng.lng
    });

    this.addProperty?.show();
  }

  searchList() {
  if (this.term) {
    this.eventAreas = this.allEventAreas.filter((data: EventArea) =>
      data.name.toLowerCase().includes(this.term.toLowerCase())
    );
  } else {
    this.eventAreas = this.allEventAreas.slice(0, this.itemsPerPage);
  }
}


  selectstatus() {
    const status = (document.getElementById('idType') as HTMLInputElement).value
    if (status) {
      this.eventAreas = this.allEventAreas.filter((item: any) => { return status == item.type })
    }
  }


  options = {
  layers: [
    tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors © CARTO'
    })
  ],
  zoom: 7,
  center: latLng(34.0, 9.0)
};


editList(index: number) {
    this.isEditMode = true;
    const item = this.eventAreas[index];

    this.propertyForm.patchValue({
      id: item.id,
      title: item.name,
      price: item.capacity,
      location: item.description,
      img: item.areaImg,
      Atitude: item.latitude,
      Longitude: item.longitude
    });

    this.addProperty?.show();
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.uploadedFile = inputElement.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        // Update form control with a preview URL
        this.propertyForm.patchValue({ img: reader.result });
      };
      reader.readAsDataURL(this.uploadedFile);
    }
  }


  saveProperty() {
    if (this.propertyForm.valid) {
      if (this.propertyForm.get('id')?.value) {
        // Update existing event area
        const id = Number(this.propertyForm.get('id')?.value);
        const updatedEventArea: Omit<EventArea, 'address'> = {
          name: this.propertyForm.value.title,
          capacity: Number(this.propertyForm.value.price),
          latitude: Number(this.propertyForm.value.Atitude),
          longitude: Number(this.propertyForm.value.Longitude),
          description: this.propertyForm.value.location,
          areaImg: this.propertyForm.value.img,
          events: []
        };
        console.log('Updating event area with payload:', updatedEventArea);
        this.eventAreaService.updateEventArea(id, updatedEventArea as EventArea, this.uploadedFile || undefined).subscribe(
          (response: EventArea) => {
            // Call reverse geocoding to update the address
            this.reverseGeocodingService.reverseGeocode(response.latitude, response.longitude)
              .subscribe((address: string) => {
                response.address = address;
                this.allEventAreas = this.allEventAreas.map(area => area.id === id ? response : area);
                this.refreshPagination();
                this.propertyForm.reset();
                this.addProperty?.hide();
              });
          },
          error => {
            console.error('Error updating event area:', error);
          }
        );
      } else {
        // Create new event area
        const newEventArea: Omit<EventArea, 'address'> = {
          name: this.propertyForm.value.title,
          capacity: Number(this.propertyForm.value.price),
          latitude: Number(this.propertyForm.value.Atitude),
          longitude: Number(this.propertyForm.value.Longitude),
          description: this.propertyForm.value.location,
          areaImg: '',
          events: []
        };

        // Check if any files were uploaded
        if (!this.uploadedFile) {
          console.error('No image file selected');
          return;
        }
        // We now know the file exists, so it's safe to use it
        const imageFile = this.uploadedFile;

        console.log('Creating event area with payload:', newEventArea);
        this.eventAreaService.createEventAreaWithImage(newEventArea as EventArea, this.uploadedFile).subscribe(
          (response: EventArea) => {
            this.reverseGeocodingService.reverseGeocode(response.latitude, response.longitude)
              .subscribe((address: string) => {
                response.address = address;
                this.allEventAreas.push(response);
                this.refreshPagination();
                this.propertyForm.reset();
                this.uploadedFile = null;
                this.addProperty?.hide();
              });
          },
          error => {
            console.error('Error creating event area:', error);
          }
        );
      }
    } else {
      console.log('Form is invalid:', this.propertyForm.errors, this.propertyForm.controls);
    }
  }


  resetPropertyForm(): void {
    this.propertyForm.reset();
    this.uploadedFile = null;
    this.imageURL = null;

    // Initialize with default empty values if needed
    this.propertyForm.patchValue({
      title: '',
      Atitude: '',
      Longitude: '',
      price: '',
      location: '',
      img: ''
    });
  }


openAddPropertyModal(): void {
  this.isEditMode = false;
  this.propertyForm.reset();
  this.imageURL = null;
  this.uploadedFile = null;
  this.addProperty?.show();
}


  refreshPagination(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    const endItem = this.currentPage * this.itemsPerPage;
    this.eventAreas = this.allEventAreas.slice(startItem, endItem);
    this.updateMarkers();
  }


  removeItem(id: any) {
    this.deleteID = id
    this.deleteRecordModal?.show()
  }


  confirmDelete() {
    this.eventAreaService.deleteEventArea(this.deleteID).subscribe({
      next: () => {
        // Remove the deleted event area from the local list
        this.eventAreas = this.eventAreas.filter(area => area.id !== this.deleteID);
        this.updateMarkers();
        this.deleteRecordModal?.hide();
      },
      error: error => {
        console.error("Error deleting event area:", error);
      }
    });
  }


  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.eventAreas = this.allEventAreas.slice(startItem, endItem);
  }


  calculateTotalCapacity(): number {
    return this.allEventAreas.reduce((total, area) => total + (area.capacity || 0), 0);
  }

}
