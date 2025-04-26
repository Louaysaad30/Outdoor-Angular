import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormationListService } from '../../services/formation-list.service';
import { ReservationService } from '../../services/reservation.service';
import { Formation } from '../../models/formation.model';
import { ReservationRequest } from '../../models/reservation-request.model';
import { SharedModule } from '../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalModule, ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-formation-details',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    ModalModule
  ],
  templateUrl: './formation-details.component.html',
  styleUrls: ['./formation-details.component.scss']
})
export class FormationDetailsComponent implements OnInit {
  @ViewChild('reservationModal') reservationModal!: ModalDirective; // ✅

  formation!: Formation;
  videoUrl!: SafeResourceUrl | null;
  reservationForm!: FormGroup;

  loading = true;
  status: string = '';
  duree: string = '';

  breadCrumbItems = [
    { label: 'Formations', link: '/user/formation' },
    { label: 'Détail', active: true }
  ];

  constructor(
    private route: ActivatedRoute,
    private formationService: FormationListService,
    private reservationService: ReservationService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadFormation(+id);
    }
    this.initReservationForm();
  }

  // ✅ Initialiser le formulaire de réservation
  initReservationForm(): void {
    this.reservationForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [
        Validators.required,
        Validators.pattern(/^\+\d{1,4}\d{7,14}$/) // Format téléphone international : +216xxxxxxxx
      ]],
      message: ['']
    });
  }

  // ✅ Charger la formation
  loadFormation(id: number): void {
    this.formationService.getFormationById(id).subscribe({
      next: (data: Formation) => {
        this.formation = data;
        this.loadYoutubeVideo(data.titre);
        this.computeStatusAndDuration();
      },
      error: (err) => console.error('Erreur chargement formation', err)
    });
  }

  // ✅ Charger vidéo YouTube
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

  // ✅ Calculer le statut et durée de la formation
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

  // ✅ Ouvrir le modal réservation
  openReservationModal(): void {
    if (this.reservationModal) {
      this.reservationModal.show();  // ✅ proprement avec ngx-bootstrap
    }
  }

  closeReservationModal(): void {
    if (this.reservationModal) {
      this.reservationModal.hide();
    }
  }
  

  // ✅ Envoyer la réservation
  submitReservation(): void {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    const payload: ReservationRequest = {
      formationId: this.formation.id!,
      ...this.reservationForm.value
    };

    this.reservationService.createReservation(payload).subscribe({
      next: () => {
        alert('✅ Réservation effectuée avec succès.');
        // Fermer le modal
        const modalElement = document.getElementById('reservationModal');
        if (modalElement) {
          (window as any).bootstrap.Modal.getOrCreateInstance(modalElement).hide();
        }
      },
      error: (err) => {
        console.error('Erreur réservation', err);
        alert(err.error?.message || 'Erreur lors de la réservation.');
      }
    });
  }
}
