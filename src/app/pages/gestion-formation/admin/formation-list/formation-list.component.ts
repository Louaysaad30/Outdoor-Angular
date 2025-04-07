import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { FormationListService } from '../../services/formation-list.service';

@Component({
  selector: 'app-formation-list',
  templateUrl: './formation-list.component.html',
  styleUrls: ['./formation-list.component.scss']
})
export class FormationListComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  formationForm!: UntypedFormGroup;
  uploadedFiles: any[] = [];
  listData: any[] = [];
  gridlist: any[] = [];
  term: string = '';
  submitted = false;
  deleteID: any;

  isPresentiel = true;
  isOnline = false;

  categories: any[] = [];
  sponsors: any[] = [];

  @ViewChild('addFormationModal', { static: false }) addFormationModal?: ModalDirective;
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

  public dropzoneConfig: DropzoneConfigInterface = {
    clickable: true,
    addRemoveLinks: true,
    previewsContainer: false,
  };

  constructor(private fb: UntypedFormBuilder, private formationService: FormationListService) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Home', link: '/' },
      { label: 'Formation', link: '/formationback' },
      { label: 'Formation List', active: true }
    ];

    this.formationForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      img: [''],
      description: ['', Validators.required],
      price: ['', Validators.required],
      publicationDate: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      mode: ['presentiel', Validators.required],
      lieu: [{ value: '', disabled: false }],
      titrePause: [{ value: '', disabled: false }],
      dureePauseMinutes: [{ value: '', disabled: false }],
      besoinSponsor: [{ value: false, disabled: false }],
      sponsorId: [{ value: '', disabled: false }],
      meetLink: [{ value: '', disabled: false }],
      categorieId: ['', Validators.required]
    });

    this.onModeChange();
    this.loadFormations();
    this.loadCategories();
    this.loadSponsors();
  }

  get form() {
    return this.formationForm.controls;
  }

  loadFormations() {
    this.formationService.getFormations().subscribe(data => {
      this.listData = data;
      this.gridlist = [...data];
    });
  }

  loadCategories() {
    this.formationService.getCategories().subscribe(data => {
      this.categories = data;
    });
  }

  loadSponsors() {
    this.formationService.getSponsors().subscribe(data => {
      this.sponsors = data;
    });
  }

  onUploadSuccess(event: any) {
    setTimeout(() => {
      this.uploadedFiles.push(event[0]);
      this.formationForm.controls['img'].setValue(event[0].dataURL);
    }, 0);
  }

  removeFile(event: any) {
    this.uploadedFiles.splice(this.uploadedFiles.indexOf(event), 1);
  }

  onModeChange() {
    const mode = this.formationForm.get('mode')?.value;
    this.isPresentiel = mode === 'presentiel';
    this.isOnline = mode === 'enligne';

    const lieu = this.formationForm.get('lieu');
    const titrePause = this.formationForm.get('titrePause');
    const dureePause = this.formationForm.get('dureePauseMinutes');
    const besoinSponsor = this.formationForm.get('besoinSponsor');
    const sponsorId = this.formationForm.get('sponsorId');
    const meetLink = this.formationForm.get('meetLink');

    if (this.isPresentiel) {
      lieu?.enable();
      titrePause?.enable();
      dureePause?.enable();
      besoinSponsor?.enable();
      sponsorId?.enable();
      meetLink?.disable();
    } else {
      lieu?.disable();
      titrePause?.disable();
      dureePause?.disable();
      besoinSponsor?.disable();
      sponsorId?.disable();
      meetLink?.enable();
    }
  }

  onSponsorChange() {
    const sponsorId = this.formationForm.get('sponsorId');
    const besoin = this.formationForm.get('besoinSponsor')?.value;
    if (besoin) {
      sponsorId?.enable();
    } else {
      sponsorId?.disable();
      sponsorId?.reset();
    }
  }

  openAddFormationModal() {
    this.uploadedFiles = [];
    this.formationForm.reset();
    this.formationForm.get('mode')?.setValue('presentiel');
    this.onModeChange();
    this.addFormationModal?.show();
  }

  saveFormation() {
    if (this.formationForm.valid) {
      if (this.formationForm.get('id')?.value) {
        this.formationService.updateFormation(this.formationForm.value).subscribe(() => {
          this.loadFormations();
        });
      } else {
        this.formationService.createFormation(this.formationForm.value).subscribe(() => {
          this.loadFormations();
        });
      }

      this.formationForm.reset();
      this.addFormationModal?.hide();
    } else {
      this.submitted = true;
    }
  }

  editFormation(index: number) {
    const data = this.listData[index];
    this.formationForm.patchValue(data);
    this.uploadedFiles = [{ dataURL: data.img, name: 'image', size: 1024 }];
    this.onModeChange();
    this.addFormationModal?.show();
  }

  removeFormation(index: number) {
    const id = this.listData[index].id;
    this.formationService.deleteFormation(id).subscribe(() => {
      this.loadFormations();
    });
  }

  filterdata() {
    if (this.term) {
      this.listData = this.gridlist.filter(f => f.name?.toLowerCase().includes(this.term.toLowerCase()));
    } else {
      this.listData = this.gridlist.slice(0, 10);
    }
  }

  pageChanged(event: any) {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.listData = this.gridlist.slice(startItem, endItem);
  }
}
