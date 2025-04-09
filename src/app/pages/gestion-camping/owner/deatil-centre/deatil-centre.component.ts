import {Component, ViewChild} from '@angular/core';
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

@Component({
  selector: 'app-deatil-centre',
  standalone: true,
  imports: [CommonModule, BsDropdownModule, FormsModule, LeafletModule, PaginationModule, RouterLink, SharedModule, ReactiveFormsModule, ModalModule],
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



  breadCrumbItems!: Array<{}>;
  currentTab: any = 'property';

  centre: CentreCamping | undefined;
  logments: Logement[] = [];
  logementForm!: FormGroup;
  editCampingForm!: FormGroup;
  editLogementForm!: UntypedFormGroup;
  logementToEdit: any;
  deleteID: any;
  logementTypes = Object.values(TypeLogement);
  imageUrl: string = '';
  map: any;
  materiels: Materiel[] = [];
  materielForm!: FormGroup;






  constructor(
    private route: ActivatedRoute,
    private centreCampingService: CentreCampingService,
    private logementService: LogementService,
    private reverseGeocodingService: ReverseGeocodingService,
    private router: Router,
    private formBuilder: UntypedFormBuilder,
    private materielService: MaterielService,
    private fb: FormBuilder



  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Centre Camping' }, { label: 'Overview', active: true }];

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.centreCampingService.getCentreCamping(+id).subscribe((data) => {
        this.centre = data;
        this.fetchLogments(+id);
        this.fetchMateriels(+id);
        console.log(this.centre);
        console.log(this.materiels);

      });
    }

    this.editLogementForm = this.formBuilder.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      quantity: ['', Validators.required],
      price: ['', Validators.required],
      image: ['', Validators.required]
    });

    this.logementForm = this.fb.group({
      image: [null, Validators.required],
      name: ['', Validators.required],
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
      prixJr: [0, Validators.required] // Add this line

    });

    this.materielForm = this.fb.group({
      image: ["", Validators.required],
      name: ['', Validators.required],
      quantity: [0, Validators.required],
      price: [0, Validators.required]
    });
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
          this.materielForm.get('image')?.setValue(imageUrl);
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
    }

    try {
      this.map = L.map(mapId).setView([34.0, 9.0], 7);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.editCampingForm.patchValue({ latitude: lat, longitude: lng });
        this.getAddress(lat, lng);
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

}
