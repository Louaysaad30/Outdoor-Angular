import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VehiculeService } from '../../services/vehicule.service';
import { Vehicule } from '../../models/vehicule.model';

@Component({
  selector: 'app-update-vehicule',
  templateUrl: './update-vehicule.component.html',
})
export class UpdateVehiculeComponent implements OnInit {

  vehiculeForm!: FormGroup;
  vehiculeId!: number;
  selectedFile!: File;
  currentImage: string = '';
  showToast = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private vehiculeService: VehiculeService
  ) {}

  ngOnInit(): void {
    this.vehiculeId = +this.route.snapshot.paramMap.get('id')!;
    this.initForm();
    this.loadVehicule();
  }

  initForm(): void {
    this.vehiculeForm = this.fb.group({
      modele: ['', Validators.required],
      type: ['', Validators.required],
      nbPlace: ['', [Validators.required, Validators.min(1)]],
      prixParJour: ['', [Validators.required, Validators.min(0)]],
      localisation: ['', Validators.required],
      statut: ['', Validators.required],
      description: ['', Validators.required],
      disponible: [true],
      rating: [0],
      agenceId: [1] // Statique temporairement
    });
  }

  loadVehicule(): void {
    this.vehiculeService.getVehiculeById(this.vehiculeId).subscribe({
      next: (vehicule: Vehicule) => {
        this.currentImage = vehicule.image || '';
        this.vehiculeForm.patchValue({
          modele: vehicule.modele,
          type: vehicule.type,
          nbPlace: vehicule.nbPlace,
          prixParJour: vehicule.prixParJour,
          localisation: vehicule.localisation,
          statut: vehicule.statut,
          description: vehicule.description, 
          disponible: vehicule.disponible,
          rating: vehicule.rating,
          agenceId: vehicule.agence?.id
        });
      },
      error: err => console.error('Erreur chargement véhicule', err)
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit(): void {
    if (this.vehiculeForm.invalid) return;

    const formData = new FormData();
    Object.entries(this.vehiculeForm.value).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.vehiculeService.updateVehicule(this.vehiculeId, formData).subscribe({
      next: () => {
        this.showToast = true;

        setTimeout(() => {
          this.showToast = false;
          const agenceId = this.vehiculeForm.value.agenceId; // ID de l'agence
          this.router.navigate([`/transportfront/agence/vehicules/list/agences/${agenceId}`]);
        }, 2000); // Laisse un peu de temps pour afficher le toast
      },
      error: err => console.error('Erreur mise à jour véhicule', err)
    });
  }

  onCancel(): void {
    const agenceId = this.vehiculeForm.value.agenceId; // Récupérer l'ID de l'agence
    this.router.navigate([`/transportfront/agence/vehicules/list/agences/${agenceId}`]);
  }
}
