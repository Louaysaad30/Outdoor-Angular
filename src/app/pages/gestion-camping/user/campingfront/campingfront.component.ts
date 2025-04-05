import {Component, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {ModalDirective, ModalModule} from "ngx-bootstrap/modal";
import {NgxSliderModule} from "ngx-slider-v2";
import {PageChangedEvent, PaginationModule} from "ngx-bootstrap/pagination";
import {FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {SharedModule} from "../../../../shared/shared.module";
import {SimplebarAngularModule} from "simplebar-angular";
import {UiSwitchModule} from "ngx-ui-switch";
import {DropzoneModule} from "ngx-dropzone-wrapper";
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {CentreCamping} from "../../model/centrecamping.model";
import {Options} from "@angular-slider/ngx-slider";
import {Store} from "@ngrx/store";
import {CentreCampingService} from "../../services/centrecamping.service";
import {ReverseGeocodingService} from "../../services/reverse-geocoding.service";
import {fetchlistingGridData} from "../../../../store/App-realestate/apprealestate.action";
import {selectData} from "../../../../store/App-realestate/apprealestate-selector";
import * as L from "leaflet";
import Swal from "sweetalert2";

@Component({
  selector: 'app-campingfront',
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

    BsDropdownModule],
  templateUrl: './campingfront.component.html',
  styleUrl: './campingfront.component.scss'
})
export class CampingfrontComponent {
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
  imageUrl: string = '';
  map: any;





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

  constructor(private formBuilder: UntypedFormBuilder,
              public store: Store,
              private centreCampingService: CentreCampingService,
              private reverseGeocodingService: ReverseGeocodingService) {
  }

  ngOnInit(): void {

    this.getCentreCampingList();

    this.centreCampingForm = this.formBuilder.group({
      name: ['', Validators.required],
      longitude: ['', Validators.required],
      latitude: ['', Validators.required],
      address: ['', Validators.required],
      capcite: ['', Validators.required],
      image: ['', Validators.required]
    });

    this.editCampingForm = this.formBuilder.group({
      name: ['', Validators.required],
      longitude: ['', Validators.required],
      latitude: ['', Validators.required],
      address: ['', Validators.required],
      capcite: ['', Validators.required],
      image: ['', Validators.required]

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
        this.centre = this.centrelist.slice(0, 4); // Show first 4 items initially

      });
      document.getElementById('elmLoader')?.classList.add('d-none')
    }, 1000);


  }




  getCentreCampingList(): void {
    this.centreCampingService.getVerifiedCentreCamping().subscribe((data: CentreCamping[]) => {
      this.centrelist = data; // Store all data in centrelist
      this.centre = this.centrelist.slice(0, 4); // Show first 4 items initially
      console.log(this.centrelist); // Display the list in the console


    });
  }

  onChangeImage(event: any) {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
      this.centreCampingService.uploadImage(file).subscribe(response => {
        console.log('Image uploaded successfully', response);
        this.imageUrl = response.fileUrl; // Store the image URL
        this.centreCampingForm.get('image')?.setValue(this.imageUrl);

        console.log('Image URL:', this.imageUrl);

      });
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




  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = Math.min(event.page * event.itemsPerPage, this.centrelist.length);
    this.centre = this.centrelist.slice(startItem, endItem);
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


}

