import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormationListService } from '../../services/formation-list.service';
import { ReservationService } from '../../services/reservation.service';
import { ReviewService } from '../../services/review.service';
import { Formation } from '../../models/formation.model';
import { Review } from '../../models/review.model';
import { ReservationRequest } from '../../models/reservation-request.model';
import { SharedModule } from '../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalModule, ModalDirective } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import * as L from 'leaflet';

@Component({
  selector: 'app-formation-details',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    ModalModule,
  ],
  templateUrl: './formation-details.component.html',
  styleUrls: ['./formation-details.component.scss']
})
export class FormationDetailsComponent implements OnInit {
  @ViewChild('reservationModal') reservationModal!: ModalDirective;
  @ViewChild('addReviewModal') addReviewModal!: ModalDirective; // 🔥 pour ton modal Ajout Avis

  formation!: Formation;
  formateur: any = null;
  videoUrl!: SafeResourceUrl | null;
  reservationForm!: FormGroup;
  reviewForm!: FormGroup; // 🔥 Formulaire Ajout Review
  isAlreadyReserved = false;
  canReserve = true;
  loading = true;
  status = '';
  duree = '';
  formationId!: number;

  // Partie Reviews
  reviews: Review[] = [];
  averageRating: number = 0;
  connectedUserId!: number; // <- indique que tu vas l'initialiser avant usage
  editingReview: Review | null = null;
  selectedReviewToDelete?: Review;
  showDeleteConfirmModal: boolean = false;
  
  breadCrumbItems = [
    { label: 'Formations', link: '/user/formation' },
    { label: 'Détail', active: true }
  ];

  constructor(
    private route: ActivatedRoute,
    private formationService: FormationListService,
    private reservationService: ReservationService,
    private reviewService: ReviewService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadFormation(+id);
    }
    this.initReservationForm();
    this.initReviewForm();
    const user = JSON.parse(localStorage.getItem('user')!);
    this.connectedUserId = user?.id;
  
  }
  getFloor(value: number): number {
    return Math.floor(value);
  }
  
  editReview(review: Review) {
    this.reviewForm.patchValue(review);
    this.openAddReviewModal(); // réutilise le modal existant
    this.editingReview = review;
  }
  
  deleteReview(id: number) {
    if (confirm('Confirmer la suppression ?')) {
      this.reviewService.deleteReview(id).subscribe(() => {
        this.fetchReviews();
      });
    }
  }
  onDeleteReview(review: Review): void {
    if (review.id) {
      this.deleteReview(review.id);
    } else {
      console.error('Impossible de supprimer un avis sans ID.');
    }
  }
  

  initReservationForm(): void {
    this.reservationForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [
        Validators.required,
        Validators.pattern(/^\+\d{1,4}\d{7,14}$/)
      ]],
      message: ['']
    });
  }

  initReviewForm(): void {
    this.reviewForm = this.fb.group({
      rating: [5, Validators.required],
      title: ['', Validators.required],
      comment: ['', Validators.required],
    });
  }

  loadFormation(id: number): void {
    this.formationService.getFormationById(id).subscribe({
      next: (data: Formation) => {
        this.formation = data;
        this.formationId = data.id!;
        this.loadYoutubeVideo(data.titre);
        this.computeStatusAndDuration();
        this.canReserve = this.status !== 'Déjà terminée';
        this.checkReservationStatus();
        this.fetchReviews(); // ⭐ Charger les reviews directement

        if (!this.formation.enLigne && this.formation.lieu) {
          this.geocodeAndInitMap(this.formation.lieu);
        }

        if (this.formation.formateurId) {
          this.loadFormateur(this.formation.formateurId);
        }
      },
      error: (err) => console.error('Erreur chargement formation', err)
    });
  }

  loadFormateur(id: number): void {
    this.formationService.getUserById(id).subscribe({
      next: (data) => this.formateur = data,
      error: (err) => {
        console.error('Erreur chargement formateur', err);
        this.formateur = null;
      }
    });
  }

  loadYoutubeVideo(title: string): void {
    this.formationService.getYoutubeVideo(title).subscribe({
      next: (videoId: string) => {
        const url = `https://www.youtube.com/embed/${videoId}`;
        this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement vidéo', err);
        this.videoUrl = null;
        this.loading = false;
      }
    });
  }

  computeStatusAndDuration(): void {
    const now = new Date();
    const start = new Date(this.formation.dateDebut);
    const end = new Date(this.formation.dateFin);

    if (now > end) {
      this.status = 'Déjà terminée';
    } else if (now >= start && now <= end) {
      this.status = 'Déjà commencée';
    } else {
      const diffMs = start.getTime() - now.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.status = `Commence dans ${days}j ${hours}h`;
    }

    const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    if (diffMinutes >= 60) {
      const h = Math.floor(diffMinutes / 60);
      const m = diffMinutes % 60;
      this.duree = m > 0 ? `${h}h ${m}min` : `${h}h`;
    } else {
      this.duree = `${diffMinutes} minutes`;
    }
  }

  openReservationModal(): void {
    this.reservationModal?.show();
  }

  closeReservationModal(): void {
    this.reservationModal?.hide();
  }

  submitReservation(): void {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    const userString = localStorage.getItem('user');
    if (!userString) {
      this.toastr.error('Veuillez vous connecter pour réserver.');
      return;
    }

    const user = JSON.parse(userString);
    const payload: ReservationRequest = {
      formationId: this.formation.id!,
      ...this.reservationForm.value
    };

    this.reservationService.createReservation(payload, user.id).subscribe({
      next: () => {
        this.toastr.success('Votre réservation a été prise en compte 🎉');
        this.closeReservationModal();
        this.isAlreadyReserved = true;
        this.canReserve = false;
      },
      error: (err) => {
        if (err.error?.message?.includes('déjà réservé')) {
          this.toastr.error('Vous avez déjà réservé cette formation ❌');
        } else {
          this.toastr.error('Erreur lors de la réservation.');
        }
      }
    });
  }

  checkReservationStatus(): void {
    const userString = localStorage.getItem('user');
    if (!userString) return;

    const user = JSON.parse(userString);
    this.reservationService.getReservationsForUser(user.id).subscribe({
      next: (reservations) => {
        this.isAlreadyReserved = reservations.some(r =>
          r.formation?.titre === this.formation?.titre
        );
        if (this.isAlreadyReserved) {
          this.canReserve = false;
        }
      },
      error: (err) => console.error('Error fetching user reservations', err)
    });
  }

  geocodeAndInitMap(address: string) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          this.initMap(lat, lon);
        }
      })
      .catch(error => console.error('Erreur géocodage', error));
  }

  initMap(lat: number, lon: number) {
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    const map = L.map('map').setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    const marker = L.marker([lat, lon]).addTo(map);

    marker.bindTooltip(`Lieu : ${this.formation?.lieu || 'Non spécifié'}`, {
      permanent: false,
      direction: 'top',
      offset: [0, -10],
      opacity: 0.8
    });

    marker.bindPopup(`
      <div style="text-align: center;">
        <h6>${this.formation?.titre || 'Formation'}</h6>
        <p>${this.formation?.lieu || 'Lieu inconnu'}</p>
      </div>
    `, {
      closeButton: true,
      autoClose: true,
      className: 'custom-popup'
    });
  }

  /** 🔥 Partie Review */
  fetchReviews(): void {
    if (!this.formationId) return;
    this.reviewService.getReviewsByFormation(this.formationId).subscribe({
      next: (data: Review[]) => {
        this.reviews = data;
        this.computeAverageRating();
      },
      error: (err) => console.error('Erreur chargement reviews', err)
    });
  }

  computeAverageRating(): void {
    if (this.reviews.length === 0) {
      this.averageRating = 0;
      return;
    }
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = total / this.reviews.length;
  }

  openAddReviewModal(): void {
    this.addReviewModal?.show();
  }

  closeAddReviewModal(): void {
    this.addReviewModal?.hide();
  }
  getUserName(userId: number): string {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.id === userId) {
        return `${user.nom} ${user.prenom}`;
      }
    }
    return 'Utilisateur';
  }
    

  submitReview(): void {
    if (this.reviewForm.invalid) return;
  
    const formValue = this.reviewForm.value;
    const user = JSON.parse(localStorage.getItem('user')!);
  
    const reviewPayload = {
      id: this.editingReview?.id, // Si c'est une mise à jour
      title: formValue.title,
      comment: formValue.comment,
      rating: formValue.rating,
      formationId: this.formation.id,
      userId: user.id
    };
  
    const request$ = this.editingReview
      ? this.reviewService.updateReview(this.editingReview.id!, reviewPayload)
      : this.reviewService.addReview(reviewPayload);
  
    request$.subscribe({
      next: (savedReview) => {
        if (this.editingReview) {
          const index = this.reviews.findIndex(r => r.id === savedReview.id);
          if (index !== -1) this.reviews[index] = savedReview;
        } else {
          this.reviews.push(savedReview);
        }
  
        this.reviewForm.reset();
        this.editingReview = null;
        this.closeAddReviewModal();
      },
      error: (err) => {
        console.error('Erreur lors de la soumission de l’avis :', err);
      }
    });
  }
  
  generateFakeReview(): void {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    if (!user || !this.formation) return;
  
    this.reviewService.generateAIReview(this.formation.id!, this.formation.titre, 5, user.id).subscribe({
      next: (review) => {
        this.reviews.unshift(review);
        this.computeAverageRating();
        this.toastr.success("Avis IA généré 🎉");
      },
      error: () => this.toastr.error("Erreur génération IA")
    });
  }
  confirmDeleteReview(): void {
    if (this.selectedReviewToDelete?.id) {
      this.reviewService.deleteReview(this.selectedReviewToDelete.id).subscribe({
        next: () => {
          console.log('Avis supprimé avec succès');
          this.fetchReviews(); // Recharge les avis
          this.showDeleteConfirmModal = false; // Ferme le modal
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de l\'avis', err);
        }
      });
    } else {
      console.error('ID de review introuvable pour suppression');
    }
  }
  cancelDeleteReview(): void {
    this.showDeleteConfirmModal = false;
  }
  
  openConfirmDeleteModal(review: Review): void {
    this.selectedReviewToDelete = review;
    this.showDeleteConfirmModal = true;
  }
  
  
}
