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
  statusFilter: string = '';
  submitted = false;
  deleteID: any;

  categories: any[] = [];
  sponsors: any[] = [];

  mode: string = 'presentiel';
  isPresentiel = true;
  isOnline = false;

  viewMode: 'grid' | 'list' = 'grid';

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
      description: ['', Validators.required],
      price: ['', Validators.required],
      img: ['', Validators.required],
      publicationDate: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      mode: ['presentiel', Validators.required],
      lieu: [''],
      titrePause: [''],
      dureePauseMinutes: [''],
      besoinSponsor: [false],
      sponsorId: [''],
      meetLink: [''],
      categorieId: ['', Validators.required],
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
    this.mode = this.formationForm.get('mode')?.value;
    this.isPresentiel = this.mode === 'presentiel';
    this.isOnline = this.mode === 'enligne';

    if (this.isPresentiel) {
      this.formationForm.get('meetLink')?.disable();
      this.formationForm.get('lieu')?.enable();
    } else {
      this.formationForm.get('meetLink')?.enable();
      this.formationForm.get('lieu')?.disable();
    }
  }

  onSponsorChange() {
    const besoinSponsor = this.formationForm.get('besoinSponsor')?.value;
    if (besoinSponsor) {
      this.formationForm.get('sponsorId')?.enable();
    } else {
      this.formationForm.get('sponsorId')?.setValue('');
      this.formationForm.get('sponsorId')?.disable();
    }
  }

  openAddFormationModal() {
    this.uploadedFiles = [];
    this.formationForm.reset();
    this.formationForm.get('mode')?.setValue('presentiel');
    this.formationForm.get('meetLink')?.disable();
    this.formationForm.get('lieu')?.enable();
    this.formationForm.get('sponsorId')?.disable();
    this.onModeChange();
    this.addFormationModal?.show();
  }

  saveFormation() {
    if (this.formationForm.valid) {
      const formation = this.formationForm.value;
      if (formation.id) {
        this.formationService.updateFormation(formation).subscribe(() => {
          this.loadFormations();
        });
      } else {
        this.formationService.createFormation(formation).subscribe(() => {
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
    this.onSponsorChange();
    this.addFormationModal?.show();
  }

  removeFormation(index: number) {
    const id = this.listData[index].id;
    this.formationService.deleteFormation(id).subscribe(() => {
      this.loadFormations();
    });
  }

  filterdata() {
    this.listData = this.gridlist.filter(f => {
      const matchesTitle = f.name.toLowerCase().includes(this.term.toLowerCase());
      const matchesStatus = !this.statusFilter || f.status === this.statusFilter;
      return matchesTitle && matchesStatus;
    });
  }

  pageChanged(event: any) {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.listData = this.gridlist.slice(startItem, endItem);
  }
}
