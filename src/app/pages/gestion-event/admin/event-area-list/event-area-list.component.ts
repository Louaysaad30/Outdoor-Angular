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



  uploadedFiles: any[] = [];
  uploadedFile: File | null = null;

  // File Upload
  imageURL: any;

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
// File: src/app/pages/gestion-event/admin/event-area-list/event-area-list.component.ts
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
  mapMarkers: any[] = [];



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
