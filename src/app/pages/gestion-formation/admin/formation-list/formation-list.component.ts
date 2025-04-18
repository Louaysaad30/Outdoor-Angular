import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { FormationListService } from '../../services/formation-list.service';
import { FormationRequest } from '../../models/formation-request.model';
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

  deleteID: number | null = null;
  
  formationForm!: UntypedFormGroup;
  isPresentiel = true;
  isOnline = false;
  selectedFile?: File;
  breadCrumbItems!: Array<{}>;
  listData: any[] = [];
  gridlist: any[] = [];
  term: string = '';
  modeFilter: string = '';
  categories: any[] = [];
  sponsors: any[] = [];
  submitted = false;

  private map!: L.Map;
  private marker!: L.Marker;
  private editingFormationId: number | null = null;

  constructor(private fb: UntypedFormBuilder, private formationService: FormationListService) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Home', link: '/' },
      { label: 'Formation', link: '/formationback' },
      { label: 'Formation List', active: true }
    ];

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
    });

    this.loadFormations();
    this.loadCategories();
    this.loadSponsors();
    this.onModeChange();
  }

  onSearchEnter() {
    const input = document.getElementById('searchBox') as HTMLInputElement;
    if (input?.value.trim()) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${input.value}&countrycodes=tn&limit=5`)
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            const result = data[0];
            const latlng = L.latLng(parseFloat(result.lat), parseFloat(result.lon));
            if (this.marker) this.marker.remove();
            this.marker = L.marker(latlng, {
              icon: L.icon({ iconUrl: 'assets/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })
            }).addTo(this.map).bindPopup(result.display_name).openPopup();
            this.map.setView(latlng, 14);
            this.formationForm.get('lieu')?.setValue(result.display_name);

            const suggestionBox = document.getElementById('suggestions');
            if (suggestionBox) suggestionBox.innerHTML = '';
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
      categorieId: data.categorieId
    });
    this.onModeChange();
    this.addFormationModal?.show();
  }
  removeItem(id: number) {
    this.deleteID = id;
    this.deleteRecordModal?.show(); // Ouvre le modal Bootstrap
  }
  
  confirmDelete() {
    if (this.deleteID != null) {
      this.formationService.deleteFormation(this.deleteID).subscribe(() => {
        this.loadFormations();
        this.deleteID = null;
        this.deleteRecordModal?.hide(); // Ferme le modal après suppression
      });
    }
  }

  saveFormation() {
    if (this.formationForm.valid && this.selectedFile) {
      const values = this.formationForm.value;
      const formationRequest: FormationRequest = {
        titre: values.name,
        description: values.description,
        prix: values.price,
        formateurId: 1,
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

      const formData = new FormData();
      formData.append('request', new Blob([JSON.stringify(formationRequest)], { type: 'application/json' }));
      formData.append('image', this.selectedFile);

      if (this.editingFormationId) {
        this.formationService.updateFormationWithImage(formData, this.editingFormationId).subscribe(() => {
          this.loadFormations();
          this.addFormationModal?.hide();
        });
      } else {
        this.formationService.createFormationWithImage(formData).subscribe(() => {
          this.loadFormations();
          this.addFormationModal?.hide();
        });
      }
    }
  }

  onModeChange() {
    const mode = this.formationForm.get('mode')?.value;
    this.isPresentiel = mode === 'presentiel';
    this.isOnline = mode === 'enligne';
  }

  onSponsorChange() {
    if (!this.formationForm.get('besoinSponsor')?.value) {
      this.formationForm.get('sponsorId')?.setValue(null);
    }
  }

  openGoogleMeet() {
    window.open("https://meet.google.com/new", "_blank");
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  openMapModal(): void {
    this.mapModal?.show();
    setTimeout(() => {
      if (!this.map) {
        this.map = L.map('map').setView([36.8065, 10.1815], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
      }

      const searchInput = document.getElementById('searchBox') as HTMLInputElement;
      if (searchInput) {
        searchInput.addEventListener('input', (e: Event) => {
          const value = (e.target as HTMLInputElement).value;
          const suggestionBox = document.getElementById('suggestions')!;
          suggestionBox.innerHTML = '';

          if (value.length > 2) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${value}&countrycodes=tn&limit=5`)
              .then(res => res.json())
              .then(data => {
                data.forEach((place: any) => {
                  const li = document.createElement('li');
                  li.className = 'list-group-item list-group-item-action';
                  li.textContent = place.display_name;
                  li.addEventListener('click', () => {
                    const latlng = L.latLng(parseFloat(place.lat), parseFloat(place.lon));
                    if (this.marker) this.marker.remove();
                    this.marker = L.marker(latlng, {
                      icon: L.icon({ iconUrl: 'assets/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })
                    }).addTo(this.map).bindPopup(place.display_name).openPopup();
                    this.map.setView(latlng, 14);
                    this.formationForm.get('lieu')?.setValue(place.display_name);
                    suggestionBox.innerHTML = '';
                  });
                  suggestionBox.appendChild(li);
                });
              });
          }
        });
      }

      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const latlng = e.latlng;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`)
          .then(res => res.json())
          .then(data => {
            const address = data.display_name;
            if (this.marker) this.marker.remove();
            this.marker = L.marker(latlng, {
              icon: L.icon({ iconUrl: 'assets/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })
            }).addTo(this.map).bindPopup(address).openPopup();
            this.formationForm.get('lieu')?.setValue(address);
          });
      });
    }, 300);
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
      this.listData = data.map((f: any) => ({
        id: f.id,
        name: f.titre,
        description: f.description,
        price: f.prix,
        img: f.imageUrl,
        category: f.categorie?.nom,
        dateDebut: f.dateDebut,
        dateFin: f.dateFin,
        instructor: 'Nom Formateur',
        profile: 'assets/images/users/avatar-1.jpg',
        mode: f.enLigne ? 'enligne' : 'presentiel',
        meetLink: f.meetLink,
        lieu: f.lieu,
        titrePause: f.titrePause,
        dureePauseMinutes: f.dureePauseMinutes,
        besoinSponsor: f.besoinSponsor,
        sponsorId: f.sponsor?.id,
        categorieId: f.categorie?.id
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
}
