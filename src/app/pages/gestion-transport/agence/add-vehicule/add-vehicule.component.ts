import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiculeService } from '../../services/vehicule.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-vehicule',
  templateUrl: './add-vehicule.component.html',
  styleUrls: ['./add-vehicule.component.scss']
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
      description: ['', Validators.required],
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
    formData.append('description', this.vehiculeForm.get('description')?.value);
    formData.append('rating', this.vehiculeForm.get('rating')?.value);
    formData.append('agenceId', this.agenceId.toString());
    formData.append('image', this.selectedFile);

    this.vehiculeService.addVehicule(formData).subscribe({
      next: (response) => {
        console.log('Véhicule ajouté :', response);
        const agenceId = this.vehiculeForm.get('agenceId')?.value;
        this.router.navigate(['/transportfront/agence/vehicules/list/agences', agenceId]);
      },
      error: (err) => {
        console.error('Erreur lors de l’ajout du véhicule :', err);
      }
    });
  }

  // New method to call the generate API and populate the form fields
  generateVehicule(): void {
    const attributes = {
      type: this.vehiculeForm.get('type')?.value,
      modele: this.vehiculeForm.get('modele')?.value,
      nbPlace: this.vehiculeForm.get('nbPlace')?.value,
      prixParJour: this.vehiculeForm.get('prixParJour')?.value,
      localisation: this.vehiculeForm.get('localisation')?.value,
      statut: this.vehiculeForm.get('statut')?.value,
      description: this.vehiculeForm.get('description')?.value,
    };
  
    this.vehiculeService.generateVehiculeFromGroq(attributes).subscribe({
      next: (response) => {
        console.log('Generated Vehicle Response:', response);  // Log the response
  
        // Parse the 'content' from the response to get the vehicle data
        const vehicleData = JSON.parse(response.choices[0].message.content);
  
        // Populate the form with the generated data
        this.vehiculeForm.patchValue({
          modele: vehicleData.modele,
          type: vehicleData.type,
          nbPlace: vehicleData.nbPlace,
          prixParJour: vehicleData.prixParJour,
          localisation: vehicleData.localisation,
          statut: vehicleData.statut,
          description: vehicleData.description
        });
  
        // Ensure Angular detects the changes and marks the form as dirty
        this.vehiculeForm.markAsDirty();
        this.vehiculeForm.updateValueAndValidity();
      },
      error: (err) => {
        console.error('Erreur lors de la génération du véhicule:', err);
      }
    });
  }
  
}
