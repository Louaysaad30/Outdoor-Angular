import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VehiculeService } from '../../services/vehicule.service';
import { ReservationService } from '../../services/reservation.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-location-form',
  templateUrl: './location-form.component.html',
  styleUrl: './location-form.component.scss'
})
export class LocationFormComponent implements OnInit {
  reservationForm!: FormGroup;
  vehicules: any[] = [];
  vehicleUnavailable: boolean = false;
  @ViewChild('pickupMap', { static: false }) pickupMapElement!: ElementRef;
  pickupMap!: L.Map;
  pickupMarker!: L.Marker;
  locationName: string = '';

  constructor(
    private fb: FormBuilder,
    private vehiculeService: VehiculeService,
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadVehicules();
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      vehicule: [null, Validators.required], // ID of the selected vehicle
      debutLocation: ['', Validators.required],
      finLocation: ['', Validators.required],
      pickupLocation: ['', Validators.required],
      pickupLatitude: [null], // Hidden field
      pickupLongitude: [null], // Hidden field
      statut: ['EN_ATTENTE'] // Default value
    });
  }

  loadVehicules(): void {
    this.vehiculeService.getVehicules().subscribe(
      (data) => {
        this.vehicules = data;
      },
      (error) => {
        console.error('Erreur lors du chargement des véhicules', error);
      }
    );
  }
 
  ngAfterViewInit(): void {
    this.initMaps();
  }

  initMaps(): void {
    const customIcon = L.icon({
      iconUrl: 'assets/images/marker-icon.png', 
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    this.pickupMap = L.map(this.pickupMapElement.nativeElement).setView([36.8065, 10.1815], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.pickupMap);
    this.pickupMarker = L.marker([36.8065, 10.1815], { icon: customIcon, draggable: true }).addTo(this.pickupMap);

    this.pickupMap.on('click', (event: any) => {
      const latlng = event.latlng;
      if (this.pickupMarker) {
        this.pickupMap.removeLayer(this.pickupMarker);
      }
      this.pickupMarker = L.marker(latlng, { icon: customIcon, draggable: true }).addTo(this.pickupMap);

      // Update form with latitude, longitude
      this.reservationForm.patchValue({
        pickupLatitude: latlng.lat,
        pickupLongitude: latlng.lng
      });

      // Reverse geocoding to get the name of the location
      this.getLocationName(latlng.lat, latlng.lng);
    });
  }

  getLocationName(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.address) {
          this.locationName = `${data.address.road || ''} ${data.address.city || ''}, ${data.address.country || ''}`;
          this.reservationForm.patchValue({
            pickupLocation: this.locationName
          });
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la géocodification inversée', error);
      });
  }

  calculateDuration(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationInMs = endDate.getTime() - startDate.getTime(); 
    return durationInMs;
  }

  onSubmit(): void {
    if (this.reservationForm.valid && !this.vehicleUnavailable) {
      const userId = 1; // Remplacez par l'ID de l'utilisateur connecté
      const formData = this.reservationForm.value;
      const selectedVehicule = this.vehicules.find(v => v.id === Number(formData.vehicule));

      if (!selectedVehicule) {
        console.error('Véhicule non trouvé !');
        return;
      }

      const updatedFormData = {
        ...formData,
        vehicule: { id: Number(formData.vehicule) }, // Convertir en objet attendu par le backend
        prixTotal: this.calculateTotalPrice(formData.debutLocation, formData.finLocation, selectedVehicule.prixParJour), 
        userId: userId,
      };

      console.log('Données envoyées:', JSON.stringify(updatedFormData, null, 2));

      this.reservationService.createReservation(updatedFormData).subscribe(
        () => {
          alert('Réservation réussie !');
          this.router.navigate(['/transportfront/user/reservations']);
        },
        (error) => {
          console.error('Erreur lors de la réservation', error);
        }
      );
    }
  }

  calculateTotalPrice(debut: string, fin: string, prixParJour: number): number {
    const startDate = new Date(debut);
    const endDate = new Date(fin);
    const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Convertir en jours
    return durationInDays * prixParJour;
  }

}
