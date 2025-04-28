import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { ModalModule } from "ngx-bootstrap/modal";
import { NgxSliderModule } from "ngx-slider-v2";
import { PageChangedEvent, PaginationModule } from "ngx-bootstrap/pagination";
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { SharedModule } from "../../../../shared/shared.module";
import { SimplebarAngularModule } from "simplebar-angular";
import { UiSwitchModule } from "ngx-ui-switch";
import { DropzoneModule } from "ngx-dropzone-wrapper";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { CentreCamping } from "../../model/centrecamping.model";
import { Options } from "@angular-slider/ngx-slider";
import { Store } from "@ngrx/store";
import { CentreCampingService } from "../../services/centrecamping.service";
import { ReverseGeocodingService } from "../../services/reverse-geocoding.service";
import { fetchlistingGridData } from "../../../../store/App-realestate/apprealestate.action";
import { selectData } from "../../../../store/App-realestate/apprealestate-selector";
import { RouterLink } from "@angular/router";
import { TypeLogement } from "../../model/typeLogment.model";
import {TypeMateriel} from "../../model/typeMateriel.model";

@Component({
  selector: 'app-campingfront',
  standalone: true,
  imports: [
    CommonModule,
    SimplebarAngularModule,
    SharedModule,
    FormsModule,
    NgxSliderModule,
    PaginationModule,
    ReactiveFormsModule,
    DropzoneModule,
    ModalModule,
    LeafletModule,
    BsDropdownModule,
    RouterLink
  ],
  templateUrl: './campingfront.component.html',
  styleUrl: './campingfront.component.scss'
})
export class CampingfrontComponent {
  files: File[] = [];
  page: number = 1;
  breadCrumbItems!: Array<{}>;
  propertyForm!: UntypedFormGroup;
  centreCampingForm!: UntypedFormGroup;
  editCampingForm!: UntypedFormGroup;

  centre: CentreCamping[] = [];
  centrelist: CentreCamping[] = [];
  filteredCentres: CentreCamping[] = [];
  displayCentres: CentreCamping[] = []; // Centers to display (paginated)

  imageUrl: string = '';
  map: any;
  submitted = false;
  products: any;
  endItem: any;
  bedroom: any;

  // Filter variables
  selectedLocation: string = '';
  selectedLogementTypes: string[] = [];
  selectedMaterials: string[] = [];
  selectedMaterialTypes: string[] = [];
  typeLogement = TypeLogement;
  typeMateriel = TypeMateriel;

  // Price Slider
  pricevalue: number = 0;
  minValue = 0;
  maxValue = 250;
  options: Options = {
    floor: 0,
    ceil: 250,
    translate: (value: number): string => {
      return 'TND ' + value;
    },
  };

  deleteID: any;
  editData: any;
  loading: boolean = false;
  itemsPerPage: number = 4; // Items per page

  constructor(
    private formBuilder: UntypedFormBuilder,
    public store: Store,
    private centreCampingService: CentreCampingService,
    private reverseGeocodingService: ReverseGeocodingService
  ) {}

  ngOnInit(): void {
    this.getCentreCampingList();
    this.breadCrumbItems = [
      { label: 'Camping Centre', active: true },
      { label: 'List', active: true }
    ];

    setTimeout(() => {
      this.store.dispatch(fetchlistingGridData());
      this.store.select(selectData).subscribe((data) => {
        this.products = data;
      });
      document.getElementById('elmLoader')?.classList.add('d-none');
    }, 1000);
  }

  getCentreCampingList(): void {
    this.centreCampingService.getVerifiedCentreCamping().subscribe((data: CentreCamping[]) => {
      this.centrelist = data;
      this.filteredCentres = [...data]; // Initialize with all data
      this.displayCentres = this.filteredCentres.slice(0, this.itemsPerPage); // First page
      console.log('Centre list loaded:', this.centrelist);
    });
  }

  showFilter(): void {
    const propertyFilters = document.getElementById('propertyFilters');
    if (propertyFilters) {
      propertyFilters.classList.toggle('d-none');
    }
  }

  location(): void {
    const selectElement = document.getElementById('select-location') as HTMLSelectElement;
    if (selectElement) {
      this.selectedLocation = selectElement.value;
      this.applyFilters();
    }
  }

  logementTypeFilter(event: any): void {
    const target = event.target;
    const value = target.value;

    if (target.id === 'allselectLogementType') {
      const checkboxes = document.querySelectorAll('#logement-type-filter input[type="checkbox"]');
      checkboxes.forEach((checkbox: any) => {
        if (checkbox.id !== 'allselectLogementType') {
          checkbox.checked = target.checked;
          const typeValue = checkbox.value;
          if (target.checked) {
            if (!this.selectedLogementTypes.includes(typeValue)) {
              this.selectedLogementTypes.push(typeValue);
            }
          } else {
            this.selectedLogementTypes = [];
          }
        }
      });
    } else {
      if (target.checked) {
        if (!this.selectedLogementTypes.includes(value)) {
          this.selectedLogementTypes.push(value);
        }
      } else {
        this.selectedLogementTypes = this.selectedLogementTypes.filter(item => item !== value);
      }

      const allCheckbox = document.getElementById('allselectLogementType') as HTMLInputElement;
      if (allCheckbox) {
        const checkboxes = document.querySelectorAll('#logement-type-filter input[type="checkbox"]:not(#allselectLogementType)');
        const allChecked = Array.from(checkboxes).every((checkbox: any) => checkbox.checked);
        allCheckbox.checked = allChecked;
      }
    }
    this.applyFilters();
  }

  materialTypeFilter(event: any): void {
    const target = event.target;
    const value = target.value;

    if (target.id === 'allselectMaterialType') {
      const checkboxes = document.querySelectorAll('#material-type-filter input[type="checkbox"]');
      checkboxes.forEach((checkbox: any) => {
        if (checkbox.id !== 'allselectMaterialType') {
          checkbox.checked = target.checked;
          const typeValue = checkbox.value;
          if (target.checked) {
            if (!this.selectedMaterialTypes.includes(typeValue)) {
              this.selectedMaterialTypes.push(typeValue);
            }
          } else {
            this.selectedMaterialTypes = [];
          }
        }
      });
    } else {
      if (target.checked) {
        if (!this.selectedMaterialTypes.includes(value)) {
          this.selectedMaterialTypes.push(value);
        }
      } else {
        this.selectedMaterialTypes = this.selectedMaterialTypes.filter(item => item !== value);
      }

      const allCheckbox = document.getElementById('allselectMaterialType') as HTMLInputElement;
      if (allCheckbox) {
        const checkboxes = document.querySelectorAll('#material-type-filter input[type="checkbox"]:not(#allselectMaterialType)');
        const allChecked = Array.from(checkboxes).every((checkbox: any) => checkbox.checked);
        allCheckbox.checked = allChecked;
      }
    }
    this.applyFilters();
  }

  valueChange(event: any, isMinValue: boolean): void {
    if (isMinValue) {
      this.minValue = event;
    } else {
      this.maxValue = event;
    }
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.centrelist];

    // Location filter
    if (this.selectedLocation) {
      filtered = filtered.filter(centre =>
        centre.address?.toLowerCase().includes(this.selectedLocation.toLowerCase())
      );
    }

    // Logement type filter
    if (this.selectedLogementTypes.length > 0) {
      filtered = filtered.filter(centre =>
        centre.logements?.some(logement =>
          this.selectedLogementTypes.includes(logement.type)
        ));
    }

    // Material filter
    if (this.selectedMaterialTypes.length > 0) {
      filtered = filtered.filter(centre =>
        centre.materiels?.some(materiel =>
          this.selectedMaterialTypes.includes(materiel.type)
        ));
    }

    // Price filter - checks ALL prices (center, lodgings, materials)
    filtered = filtered.filter(centre => {
      // Check center price
      const centrePrix = centre.prixJr || 0;
      if (centrePrix < this.minValue || centrePrix > this.maxValue) {
        return false;
      }

      // Check all lodging prices
      if (centre.logements && centre.logements.length > 0) {
        for (const logement of centre.logements) {
          const logementPrice = logement.price || 0;
          if (logementPrice < this.minValue || logementPrice > this.maxValue) {
            return false;
          }
        }
      }

      // Check all material prices
      if (centre.materiels && centre.materiels.length > 0) {
        for (const materiel of centre.materiels) {
          const materielPrice = materiel.price || 0;
          if (materielPrice < this.minValue || materielPrice > this.maxValue) {
            return false;
          }
        }
      }

      // If we get here, all prices are within range
      return true;
    });

    this.filteredCentres = filtered;
    this.displayCentres = this.filteredCentres.slice(0, this.itemsPerPage); // Reset to first page
    this.page = 1; // Reset to first page
    this.updateNoResultDisplay();
  }

  loadMore(): void {
    this.loading = true;
    setTimeout(() => {
      const currentLength = this.displayCentres.length;
      const nextItems = this.filteredCentres.slice(currentLength, currentLength + this.itemsPerPage);
      this.displayCentres = [...this.displayCentres, ...nextItems];
      this.loading = false;
    }, 500);
  }

  resetFilters(): void {
    this.selectedLocation = '';
    this.selectedLogementTypes = [];
    this.selectedMaterials = [];
    this.minValue = 0;
    this.maxValue = 3800;
    this.pricevalue = 0;

    // Reset UI elements
    const locationSelect = document.getElementById('select-location') as HTMLSelectElement;
    if (locationSelect) locationSelect.selectedIndex = 0;

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox: any) => {
      checkbox.checked = false;
    });

    this.filteredCentres = [...this.centrelist];
    this.displayCentres = this.filteredCentres.slice(0, this.itemsPerPage);
    this.page = 1;
    this.updateNoResultDisplay();
  }

  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.displayCentres = this.filteredCentres.slice(startItem, endItem);
  }

  updateNoResultDisplay(): void {
    const noResultElement = document.getElementById('noresult');
    const paginationElement = document.getElementById('pagination-element-1');

    if (this.filteredCentres.length === 0) {
      if (noResultElement) noResultElement.style.display = 'block';
      if (paginationElement) paginationElement.classList.add('d-none');
    } else {
      if (noResultElement) noResultElement.style.display = 'none';
      if (paginationElement) paginationElement.classList.remove('d-none');
    }
  }

  onChangeImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.centreCampingService.uploadImage(file).subscribe(response => {
        this.imageUrl = response.fileUrl;
        this.centreCampingForm.get('image')?.setValue(this.imageUrl);
      });
    }
  }
}
