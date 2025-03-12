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
  maps: any
  maplist: any;
  masterSelected!: boolean;
  term: any
  bedroom: any;
  files: File[] = [];
  eventArea: any;
  eventAreas: EventArea[]=[];
  searchResults: any
  @ViewChild('addProperty', { static: false }) addProperty?: ModalDirective;
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;
  deleteID: any;

  constructor(private formBuilder: UntypedFormBuilder, public store: Store , private eventAreaService : EventAreaService) {
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
      // Fetch Data
      this.store.dispatch(fetchlistingGridData());
      this.eventAreaService.getAllEventAreas().subscribe((data: any) => {
        this.eventAreas = data;
        this.updateMarkers();

      });
      console.log("aloooo",this.eventAreas);
      document.getElementById('elmLoader')?.classList.add('d-none')
    }, 1000)

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
      this.maps = this.maplist.filter((data: any) =>
        data.title.toLowerCase().includes(this.term.toLowerCase()))
    } else {
      this.maps = this.maplist.slice(0, 3)
    }
  }
  // select apartment type
  selectstatus() {
    const status = (document.getElementById('idType') as HTMLInputElement).value
    if (status) {
      this.maps = this.maplist.filter((item: any) => { return status == item.type })
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
  editList(id: any) {
    this.uploadedFiles = [];
    this.addProperty?.show()
    var modaltitle = document.querySelector('.modal-title') as HTMLAreaElement
    modaltitle.innerHTML = 'Edit Product'
    var modalbtn = document.getElementById('add-btn') as HTMLAreaElement
    modalbtn.innerHTML = 'Update'

    var editData = this.maps[id]
    this.uploadedFiles.push({ 'dataURL': editData.img, 'name': editData.imgalt, 'size': 1024, });
    this.propertyForm.patchValue(this.maps[id]);
  }

  // Add EVENT AREA
// TypeScript
saveProperty() {
  console.log('saveProperty called');
  if (this.propertyForm.valid) {
    if (this.propertyForm.get('id')?.value) {
      const updatedData = this.propertyForm.value;
      this.store.dispatch(updatelistingGridData({ updatedData }));
    } else {
      // Create the new event area without an id property
      const newEventArea = {
        name: this.propertyForm.value.title,
        capacity: Number(this.propertyForm.value.price),
        latitude: Number(this.propertyForm.value.Atitude),
        longitude: Number(this.propertyForm.value.Longitude),
        description: this.propertyForm.value.location,
        areaImg: null,
        events: []
      };

      this.eventAreaService.createEventArea((newEventArea as unknown) as EventArea).subscribe(
        (response: EventArea) => {
          this.eventAreas.push(response);
          this.updateMarkers();
          this.propertyForm.reset();
          this.addProperty?.hide();
        },
        error => {
          console.error('Error creating event area:', error);
        }
      );
    }
  } else if (!this.propertyForm.valid) {
    console.log('Form is invalid:', this.propertyForm.errors, this.propertyForm.controls);
  }
}
  // Delete Product
  removeItem(id: any) {
    this.deleteID = id
    this.deleteRecordModal?.show()
  }

  confirmDelete() {
    this.store.dispatch(deletelistingGridData({ id: this.deleteID.toString() }));
    this.deleteRecordModal?.hide()
  }

  // Page Changed
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.maps = this.maplist.slice(startItem, endItem);
  }

}
