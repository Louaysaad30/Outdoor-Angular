  import { Component, OnInit, ViewChild } from '@angular/core';
  import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
  import { ModalDirective } from 'ngx-bootstrap/modal';
  import { FormationListService } from '../../services/formation-list.service';
  import { FormationRequest } from '../../models/formation-request.model';
  import { HttpClient } from '@angular/common/http';
  import * as L from 'leaflet';

  @Component({
    selector: 'app-formation-list',
    templateUrl: './formation-list.component.html',
    styleUrls: ['./formation-list.component.scss']
  })
  export class FormationListComponent implements OnInit {
    @ViewChild('addFormationModal', { static: false }) addFormationModal?: ModalDirective;
    @ViewChild('mapModal', { static: false }) mapModal?: ModalDirective;
    @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

    breadCrumbItems!: Array<{}>;
    formationForm!: UntypedFormGroup;
    listData: any[] = [];
    gridlist: any[] = [];
    term: string = '';
    modeFilter: string = '';
    categories: any[] = [];
    sponsors: any[] = [];
    formateurs: any[] = []; // ✅ Formateurs disponibles

    isPresentiel = true;
    isOnline = false;
    isImproving = false;
    previewedDescription = '';
    selectedFile?: File;
    submitted = false;
    deleteID: number | null = null;
    private map!: L.Map;
    private marker!: L.Marker;
    private editingFormationId: number | null = null;

    constructor(
      private fb: UntypedFormBuilder,
      private formationService: FormationListService,
      private http: HttpClient
    ) {}

    ngOnInit(): void {
      this.breadCrumbItems = [
        { label: 'Home', link: '/' },
        { label: 'Formation', link: '/formationback' },
        { label: 'Formation List', active: true }
      ];

      this.initForm();
      this.loadFormations();
      this.loadCategories();
      this.loadSponsors();
      this.loadFormateurs(); 
      this.onModeChange();
    }

    initForm() {
      this.formationForm = this.fb.group({
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
        formateurId: ['', Validators.required] 
      });
    }

    loadFormations() {
      this.formationService.getFormations().subscribe(data => {
        this.listData = data.map((f: any) => ({
          id: f.id,
          name: f.titre,
          description: f.description,
          price: f.prix,
          img: f.imageUrl,
          category: f.categorie?.nom || 'N/A',
          dateDebut: f.dateDebut,
          dateFin: f.dateFin,
          instructor: (f.formateurNom && f.formateurPrenom) ? `${f.formateurNom} ${f.formateurPrenom}` : 'Aucun formateur',
          profile: f.formateurImage || 'assets/images/users/default-avatar.png',
          mode: f.enLigne ? 'enligne' : 'presentiel',
          meetLink: f.meetLink,
          lieu: f.lieu,
          titrePause: f.titrePause,
          dureePauseMinutes: f.dureePauseMinutes,
          besoinSponsor: f.besoinSponsor,
          sponsorId: f.sponsorId,
          categorieId: f.categorieId,
          formateurId: f.formateurId
        }));
        this.gridlist = [...this.listData];
      });
    }
  

    loadCategories() {
      this.formationService.getCategories().subscribe(data => this.categories = data);
    }

    loadSponsors() {
      this.formationService.getSponsors().subscribe(data => this.sponsors = data);
    }

    loadFormateurs() {
      this.formationService.getAllUsers().subscribe(users => {
        this.formateurs = users.filter(user => 
          user.authorities?.some((auth: any) => auth.authority === 'FORMATEUR')
        );
      });
    }
    
    saveFormation() {
      if (!this.formationForm) return;
      const values = this.formationForm.value;
  
      if (this.editingFormationId) {
        const formData = new FormData();
        if (values.name) formData.append('name', values.name);
        if (values.description) formData.append('description', values.description);
        if (values.price != null) formData.append('price', values.price.toString());
        if (values.publicationDate) formData.append('publicationDate', values.publicationDate);
        if (values.dateDebut) formData.append('dateDebut', values.dateDebut);
        if (values.dateFin) formData.append('dateFin', values.dateFin);
        if (values.mode) formData.append('mode', values.mode);
        if (values.lieu) formData.append('lieu', values.lieu);
        if (values.meetLink) formData.append('meetLink', values.meetLink);
        if (values.formateurId != null && values.formateurId !== '') {
          formData.append('formateurId', values.formateurId.toString());
        } else {
          formData.append('formateurId', '');
        }
                if (values.categorieId != null) formData.append('categorieId', values.categorieId.toString());
        if (values.titrePause) formData.append('titrePause', values.titrePause);
        if (values.dureePauseMinutes != null) formData.append('dureePauseMinutes', values.dureePauseMinutes.toString());
        if (values.besoinSponsor != null) formData.append('besoinSponsor', values.besoinSponsor.toString());
        if (values.sponsorId != null) formData.append('sponsorId', values.sponsorId.toString());
        if (this.selectedFile) formData.append('image', this.selectedFile);
  
        this.formationService.updateFormationWithImage(formData, this.editingFormationId).subscribe({
          next: () => {
            console.log('Formation mise à jour avec succès ✅');
            this.loadFormations();
            this.addFormationModal?.hide();
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour ❌:', err);
          }
        });
      } else {
        if (this.formationForm.invalid) {
          console.error('Formulaire invalide pour la création ❌');
          return;
        }
        const formationRequest: FormationRequest = {
          titre: values.name,
          description: values.description,
          prix: values.price,
          formateurId: values.formateurId || null,
          mode: values.mode,
          dateDebut: values.dateDebut,
          dateFin: values.dateFin,
          categorieId: values.categorieId,
          lieu: values.mode === 'presentiel' ? values.lieu : '',
          pauseTitle: values.mode === 'presentiel' ? values.titrePause : '',
          pauseDuration: values.mode === 'presentiel' ? values.dureePauseMinutes : 0,
          pauseSponsorRequired: values.mode === 'presentiel' && values.besoinSponsor,
          sponsorId: values.mode === 'presentiel' && values.besoinSponsor ? values.sponsorId : null,
          meetLink: values.mode === 'enligne' ? values.meetLink : null
        };
  
        const createFormData = new FormData();
        createFormData.append('request', new Blob([JSON.stringify(formationRequest)], { type: 'application/json' }));
        if (this.selectedFile) createFormData.append('image', this.selectedFile);
  
        this.formationService.createFormationWithImage(createFormData).subscribe({
          next: () => {
            console.log('Formation créée avec succès ✅');
            this.loadFormations();
            this.addFormationModal?.hide();
          },
          error: (err) => {
            console.error('Erreur lors de la création ❌:', err);
          }
        });
      }
    }        
    openAddFormationModal() {
      this.editingFormationId = null;
      this.formationForm.reset();
      this.formationForm.get('mode')?.setValue('presentiel');
      this.selectedFile = undefined;
      this.onModeChange();
      this.addFormationModal?.show();
    }

    editFormation(id: number) {
      const data = this.listData.find(f => f.id === id);
      if (!data) return;
      this.editingFormationId = data.id;
      this.formationForm.patchValue({
        name: data.name,
        description: data.description,
        price: data.price,
        publicationDate: data.dateDebut,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        mode: data.mode,
        lieu: data.lieu,
        titrePause: data.titrePause,
        dureePauseMinutes: data.dureePauseMinutes,
        besoinSponsor: data.besoinSponsor,
        sponsorId: data.sponsorId,
        meetLink: data.meetLink,
        categorieId: data.categorieId,
        formateurId: data.formateurId 
      });
          this.onModeChange();
      this.addFormationModal?.show();
    }

    removeItem(id: number) {
      this.deleteID = id;
      this.deleteRecordModal?.show();
    }

    confirmDelete() {
      if (this.deleteID != null) {
        this.formationService.deleteFormation(this.deleteID).subscribe(() => {
          this.loadFormations();
          this.deleteID = null;
          this.deleteRecordModal?.hide();
        });
      }
    }

    onModeChange() {
      const mode = this.formationForm.get('mode')?.value;
      this.isPresentiel = mode === 'presentiel';
      this.isOnline = mode === 'enligne';
    }

    onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) this.selectedFile = file;
    }

    filterdata() {
      this.listData = this.gridlist.filter(f => {
        const matchesTitle = f.name?.toLowerCase().includes(this.term.toLowerCase());
        const matchesMode = !this.modeFilter || f.mode === this.modeFilter;
        return matchesTitle && matchesMode;
      });
    }

    openGoogleMeet() {
      window.open("https://meet.google.com/new", "_blank");
    }

    onImproveDescription() {
      const description = this.formationForm.get('description')?.value;
      if (!description || description.trim() === '') {
        alert('Veuillez entrer une description.');
        return;
      }
      this.isImproving = true;
      const body = { text: `Rédige une description professionnelle en français pour une formation : ${description}` };
      this.http.post('http://localhost:9094/Formation-Service/api/formations/improve-description', body, { responseType: 'text' })
        .subscribe({
          next: (res: string) => {
            this.previewedDescription = res;
            this.isImproving = false;
          },
          error: (err) => {
            console.error('Erreur HuggingFace:', err);
            this.isImproving = false;
          }
        });
    }

    onSuggestSponsor() {
      const description = this.formationForm.get('description')?.value;
      const prix = this.formationForm.get('price')?.value;

      if (!description || !prix) {
        alert("Merci de remplir la description et le prix avant de suggérer un sponsor.");
        return;
      }

      const body = {
        description: description,
        prix: prix,
        mode: this.formationForm.get('mode')?.value,
        lieu: this.formationForm.get('lieu')?.value || ''
      };

      this.http.post<any>('http://localhost:9094/Formation-Service/api/formations/suggest-sponsor', body)
        .subscribe({
          next: (res) => {
            if (res.sponsorId) {
              this.formationForm.get('sponsorId')?.setValue(res.sponsorId);
            }
          },
          error: (err) => {
            console.error('Erreur suggestion:', err);
          }
        });
    }

    openMapModal() {
      this.mapModal?.show();
      setTimeout(() => {
        if (!this.map) {
          this.map = L.map('map').setView([36.8065, 10.1815], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(this.map);
        }
        this.map.on('click', (e: L.LeafletMouseEvent) => {
          const latlng = e.latlng;
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`)
            .then(res => res.json())
            .then(data => {
              if (this.marker) this.marker.remove();
              const address = data.display_name;
              this.marker = L.marker(latlng).addTo(this.map).bindPopup(address).openPopup();
              this.formationForm.get('lieu')?.setValue(address);
            });
        });
      }, 300);
    }
    onSponsorChange() {
      if (!this.formationForm.get('besoinSponsor')?.value) {
        this.formationForm.get('sponsorId')?.setValue(null);
      }
    }
    onSearchEnter() {
      const input = document.getElementById('searchBox') as HTMLInputElement;
      if (input?.value.trim()) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input.value)}&countrycodes=tn&limit=5`)
          .then(res => res.json())
          .then((data: any[]) => {
            if (data.length > 0) {
              const result = data[0];
              const latlng = L.latLng(parseFloat(result.lat), parseFloat(result.lon));
              if (this.marker) this.marker.remove();
              this.marker = L.marker(latlng, {
                icon: L.icon({ 
                  iconUrl: 'assets/images/marker-icon.png', 
                  iconSize: [25, 41], 
                  iconAnchor: [12, 41] 
                })
              }).addTo(this.map).bindPopup(result.display_name).openPopup();
              this.map.setView(latlng, 14);
              this.formationForm.get('lieu')?.setValue(result.display_name);
    
              const suggestionBox = document.getElementById('suggestions');
              if (suggestionBox) suggestionBox.innerHTML = '';
            }
          })
          .catch(error => {
            console.error('Erreur lors de la recherche d\'adresse:', error);
          });
      }
    }
    

  }
