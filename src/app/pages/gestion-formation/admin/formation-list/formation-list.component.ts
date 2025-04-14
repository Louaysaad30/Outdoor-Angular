import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { FormationListService } from '../../services/formation-list.service';
import { FormationRequest } from '../../models/formation-request.model';


@Component({
  selector: 'app-formation-list',
  templateUrl: './formation-list.component.html',
  styleUrls: ['./formation-list.component.scss']
})
export class FormationListComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  formationForm!: UntypedFormGroup;
  listData: any[] = [];
  gridlist: any[] = [];
  term: string = '';
  modeFilter: string = '';
  submitted = false;
  viewMode: 'grid' | 'list' = 'grid';
  categories: any[] = [];
  sponsors: any[] = [];
  isPresentiel = true;
  isOnline = false;
  selectedFile?: File;

  @ViewChild('addFormationModal', { static: false }) addFormationModal?: ModalDirective;

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

    this.loadFormations();
    this.loadCategories();
    this.loadSponsors();
    this.onModeChange();
  }

  get form() {
    return this.formationForm.controls;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onModeChange() {
    const mode = this.formationForm.get('mode')?.value;
    this.isPresentiel = mode === 'presentiel';
    this.isOnline = mode === 'enligne';
  }

  onSponsorChange() {
    const besoinSponsor = this.formationForm.get('besoinSponsor')?.value;
    if (!besoinSponsor) {
      this.formationForm.get('sponsorId')?.setValue(null);
    }
  }

  openAddFormationModal() {
    this.formationForm.reset();
    this.formationForm.get('mode')?.setValue('presentiel');
    this.selectedFile = undefined;
    this.onModeChange();
    this.addFormationModal?.show();
  }

  saveFormation() {
    if (this.formationForm.valid && this.selectedFile) {
      const values = this.formationForm.value;
  
      // ⚙️ Mapper les valeurs du formulaire vers FormationRequest
      const formationRequest: FormationRequest = {
        titre: values.name,
        description: values.description,
        prix: values.price,
        formateurId: 1, // 👈 fixe temporaire ou mets-le depuis un select plus tard
        mode: values.mode,
        dateDebut: values.dateDebut,
        dateFin: values.dateFin,
        categorieId: values.categorieId,
        lieu: values.mode === 'presentiel' ? values.lieu : '',
        pauseTitle: values.mode === 'presentiel' ? values.titrePause : '',
        pauseDuration: values.mode === 'presentiel' ? values.dureePauseMinutes : 0,
        pauseSponsorRequired: values.mode === 'presentiel' && values.besoinSponsor,
        sponsorId: values.mode === 'presentiel' && values.besoinSponsor ? values.sponsorId : null
      };
  
      const formData = new FormData();
      formData.append('request', new Blob([JSON.stringify(formationRequest)], { type: 'application/json' }));
      formData.append('image', this.selectedFile);
  
      this.formationService.createFormationWithImage(formData).subscribe(() => {
        this.loadFormations();
        this.formationForm.reset();
        this.addFormationModal?.hide();
      });
    } else {
      this.submitted = true;
    }
  }
  
  

  filterdata() {
    this.listData = this.gridlist.filter(f => {
      const matchesTitle = f.name?.toLowerCase().includes(this.term.toLowerCase());
      const matchesMode = !this.modeFilter || f.mode === this.modeFilter;
      return matchesTitle && matchesMode;
    });
  }

  loadFormations() {
    this.formationService.getFormations().subscribe(data => {
      console.log("Réponse de l'API:", data); // Ajoutez un log pour vérifier la réponse de l'API
  
      // Assurez-vous que vous mappez correctement les données
      this.listData = data.map((f: any) => ({
        id: f.id,
        name: f.titre, // Vérifiez que 'titre' est bien défini dans la réponse
        description: f.description,
        price: f.prix, // Vérifiez que 'prix' est bien défini
        imageUrl: f.imageUrl, // Vérifiez que 'imageUrl' est bien défini
        category: f.categorie?.nom, // Vérifiez si 'categorie' et 'nom' existent
        dateDebut: f.dateDebut,
        dateFin: f.dateFin,
        duration: this.getDuration(f.dateDebut, f.dateFin),
        instructor: 'Nom Formateur', // Placeholder pour l'instructeur
        students: 0, // Placeholder pour le nombre d'élèves
        lessons: 0, // Placeholder pour le nombre de leçons
        status: 'Beginner', // Statut par défaut
        profile: 'assets/images/users/avatar-1.jpg', // Image de profil par défaut
        mode: f.mode
      }));
  
      console.log("Liste des formations après mappage:", this.listData); // Log pour vérifier les données après mappage
  
      this.gridlist = [...this.listData];
    });
  }
  
  getDuration(start: string, end: string): string {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffInMs = endTime.getTime() - startTime.getTime();
    const diffInMin = diffInMs / 60000;
    const hours = Math.floor(diffInMin / 60);
    const minutes = Math.floor(diffInMin % 60);
    return `${hours}h ${minutes}min`;
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
}
