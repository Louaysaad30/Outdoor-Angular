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
  addlistingGridData, deletelistingGridData,
  fetchlistingGridData,
  updatelistingGridData
} from "../../../../store/App-realestate/apprealestate.action";
import {selectData} from "../../../../store/App-realestate/apprealestate-selector";
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


  // bread crumb items
  breadCrumbItems!: Array<{}>;
  propertyForm!: UntypedFormGroup;
  submitted = false;
  //maps: any
  //maplist: any;
  masterSelected!: boolean;
  term: any
  bedroom: any;
  files: File[] = [];
  eventArea: any;
  allEventAreas: EventArea[] = [];
  eventAreas: EventArea[]=[];
  searchResults: any;
  itemsPerPage: number = 3;
  currentPage: number = 1;
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
      { label: 'Real Estate', active: true },
      { label: 'Listing Map', active: true }
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
  this.mapMarkers = this.eventAreas.map((area: EventArea) => {
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
  // Extract latitude and longitude from the clicked location
  const lat = event.latlng.lat;
  const lng = event.latlng.lng;

  // Update the form controls with the selected coordinates
  this.propertyForm.patchValue({
    Atitude: lat,
    Longitude: lng
  });

  // Log the coordinates and open the modal
  console.log('Map clicked at: ', event.latlng);
  this.addProperty?.show();
}

  // File Upload
  public dropzoneConfig: DropzoneConfigInterface = {
    clickable: true,
    addRemoveLinks: true,
    previewsContainer: false,
  };

  uploadedFiles: any[] = [];

  // File Upload
  imageURL: any;
  onUploadSuccess(event: any) {
    setTimeout(() => {
      this.uploadedFiles.push(event[0]);
      this.propertyForm.controls['img'].setValue(event[0].dataURL);
    }, 0);
  }

  // File Remove
  removeFile(event: any) {
    this.uploadedFiles.splice(this.uploadedFiles.indexOf(event), 1);
  }

  // filter data
  searchList() {
    if (this.term) {
      this.eventAreas = this.allEventAreas.filter((data: any) =>
        data.title.toLowerCase().includes(this.term.toLowerCase()))
    } else {
      this.eventAreas = this.allEventAreas.slice(0, 3)
    }
  }
  // select apartment type
  selectstatus() {
    const status = (document.getElementById('idType') as HTMLInputElement).value
    if (status) {
      this.eventAreas = this.allEventAreas.filter((item: any) => { return status == item.type })
    }
  }

  /**
   * Basic Maps
   */
  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      })
    ],
    zoom: 10,
    center: latLng(39.73, -104.99)
  };
  mapMarkers: any[] = [];

  GroupsLayers = [
    marker([39.61, -105.02]).bindPopup('This is Littleton, CO.'),
    marker([39.63, -105.09]).bindPopup('This is Littleton, CO.'),
    marker([39.74, -104.99]).bindPopup('This is Denver, CO.'),
    marker([39.77, -105.01]).bindPopup('This is Denver, CO.'),
    marker([39.90, -105.03]).bindPopup('This is Denver, CO.'),
    marker([39.96, -105.04]).bindPopup('This is Denver, CO.'),
    marker([39.73, -104.8]).bindPopup('This is Aurora, CO.'),
    marker([39.70, -104.9]).bindPopup('This is Aurora, CO.'),
    marker([39.77, -105.23]).bindPopup("This is Golden, CO."),
    marker([39.80, -105.01]).bindPopup("This is Golden, CO."),
    marker([39.95, -105.09]).bindPopup("This is Golden, CO.")
  ];


  // Edit Data
// File: src/app/pages/gestion-event/admin/event-area-list/event-area-list.component.ts
editList(index: number) {
  this.uploadedFiles = [];
  this.addProperty?.show();
  const modalTitle = document.querySelector('.modal-title') as HTMLElement;
  modalTitle.innerText = 'Edit Event Area';
  const modalBtn = document.getElementById('add-btn') as HTMLElement;
  modalBtn.innerText = 'Update';

  const editData = this.eventAreas[index];
  // Map the event area properties to the form control names
  const formData = {
    id: editData.id,
    title: editData.name,
    price: editData.capacity,
    location: editData.description,
    img: editData.areaImg,
    Atitude: editData.latitude,
    Longitude: editData.longitude
  };

  if (editData.areaImg) {
    this.uploadedFiles.push({ dataURL: editData.areaImg, name: editData.name, size: 1024 });
  }
  this.propertyForm.patchValue(formData);
}
  // Add EVENT AREA
// File: src/app/pages/gestion-event/admin/event-area-list/event-area-list.component.ts
saveProperty() {
  if (this.propertyForm.valid) {
    if (this.propertyForm.get('id')?.value) {
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
      this.eventAreaService.updateEventArea(id, updatedEventArea as EventArea).subscribe(
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
      const newEventArea: Omit<EventArea, 'address'> = {
        name: this.propertyForm.value.title,
        capacity: Number(this.propertyForm.value.price),
        latitude: Number(this.propertyForm.value.Atitude),
        longitude: Number(this.propertyForm.value.Longitude),
        description: this.propertyForm.value.location,
        areaImg: this.propertyForm.value.img,
        events: []
      };
      console.log('Creating event area with payload:', newEventArea);
      this.eventAreaService.createEventArea(newEventArea as EventArea).subscribe(
        (response: EventArea) => {
          // Retrieve and set the address using reverse geocoding
          this.reverseGeocodingService.reverseGeocode(response.latitude, response.longitude)
            .subscribe((address: string) => {
              response.address = address;
              this.allEventAreas.push(response);
              this.refreshPagination();
              this.propertyForm.reset();
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
  // Page Changed
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.eventAreas = this.allEventAreas.slice(startItem, endItem);
  }

}
