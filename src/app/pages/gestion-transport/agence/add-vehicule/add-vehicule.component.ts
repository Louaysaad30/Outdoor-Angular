import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiculeService } from '../../services/vehicule.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-vehicule',
  templateUrl: './add-vehicule.component.html',
  styleUrl: './add-vehicule.component.scss'
})
export class AddVehiculeComponent implements OnInit {

  vehiculeForm!: FormGroup;
  selectedFile!: File;
  agenceId: number = 1; // temporaire, tu peux le rendre dynamique

  constructor(
    private fb: FormBuilder,
    private vehiculeService: VehiculeService,
    private router: Router,
    
  ) {}

  ngOnInit(): void {
    this.vehiculeForm = this.fb.group({
      modele: ['', Validators.required],
      type: ['', Validators.required],
      nbPlace: ['', [Validators.required, Validators.min(1)]],
      prixParJour: ['', [Validators.required, Validators.min(1)]],
      localisation: ['', Validators.required],
      statut: ['DISPONIBLE'],
      disponible: [true],
      rating: [0],
      agenceId: [this.agenceId]
    });

  }

  onFileChange(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onSubmit(): void {
    if (this.vehiculeForm.invalid || !this.selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append('modele', this.vehiculeForm.get('modele')?.value);
    formData.append('type', this.vehiculeForm.get('type')?.value);
    formData.append('nbPlace', this.vehiculeForm.get('nbPlace')?.value);
    formData.append('prixParJour', this.vehiculeForm.get('prixParJour')?.value);
    formData.append('localisation', this.vehiculeForm.get('localisation')?.value);
    formData.append('statut', this.vehiculeForm.get('statut')?.value);
    formData.append('disponible', this.vehiculeForm.get('disponible')?.value);
    formData.append('rating', this.vehiculeForm.get('rating')?.value);
    formData.append('agenceId', this.agenceId.toString());
    formData.append('image', this.selectedFile);



    this.vehiculeService.addVehicule(formData).subscribe({
      next: (response) => {
        console.log('Véhicule ajouté :', response);
        const agenceId = this.vehiculeForm.get('agenceId')?.value;
        console.log('Agence ID:', agenceId); // Vérification de l'ID de l'agence
        this.router.navigate(['/transportfront/agence/vehicules/list/agences', agenceId]);

      },
      error: (err) => {
        console.error('Erreur lors de l’ajout du véhicule :', err);
      }
    });

  }
}