import {Component, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {CentreCampingService} from "../../services/centrecamping.service";
import {CentreCamping} from "../../model/centrecamping.model";
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {PaginationModule} from "ngx-bootstrap/pagination";
import {SharedModule} from "../../../../shared/shared.module";
import {Logement} from "../../model/logments.model";
import {LogementService} from "../../services/logements.service";
import {TypeLogement} from "../../model/typeLogment.model";
import {ModalDirective, ModalModule} from "ngx-bootstrap/modal";

@Component({
  selector: 'app-deatil-centre',
  standalone: true,
  imports: [CommonModule, BsDropdownModule, FormsModule, LeafletModule, PaginationModule, RouterLink, SharedModule, ReactiveFormsModule, ModalModule],
  templateUrl: './deatil-centre.component.html',
  styleUrl: './deatil-centre.component.scss'
})
export class DeatilCentreComponent {
  @ViewChild('addLogement') addLogement!: ModalDirective;

  breadCrumbItems!: Array<{}>;
  currentTab: any = 'property';

  centre: CentreCamping | undefined;
  logments: Logement[] = [];
  logementForm!: FormGroup;
  logementTypes = Object.values(TypeLogement);


  constructor(
    private route: ActivatedRoute,
    private centreCampingService: CentreCampingService,
    private logementService: LogementService,
    private fb: FormBuilder



  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Centre Camping' }, { label: 'Overview', active: true }];

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.centreCampingService.getCentreCamping(+id).subscribe((data) => {
        this.centre = data;
        this.fetchLogments(+id);
        console.log(this.centre);
        console.log(this.logments);

      });
    }
    this.logementForm = this.fb.group({
      image: [null, Validators.required],
      name: ['', Validators.required],
      type: ['', Validators.required],
      quantity: [0, Validators.required],
      price: [0, Validators.required]
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
