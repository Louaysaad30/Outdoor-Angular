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
  currentUser: any;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private vehiculeService: VehiculeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(localStorage.getItem('user')!);
    if (!this.currentUser?.id) {
      this.router.navigate(['/login']);
      return;
    }
    this.initializeForm();
  }

  initializeForm(): void {
    this.vehiculeForm = this.fb.group({
      modele: ['', Validators.required],
      type: ['', Validators.required],
      nbPlace: ['', [Validators.required, Validators.min(1)]],
      prixParJour: ['', [Validators.required, Validators.min(1)]],
      localisation: ['', Validators.required],
      statut: ['DISPONIBLE'],
      description: ['', Validators.required],
      disponible: [true],
      rating: [0]
    });
  }

  onFileChange(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onSubmit(): void {
    if (this.vehiculeForm.invalid) {
      this.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    if (!this.selectedFile) {
      this.errorMessage = 'Please select an image for the vehicle';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const formData = new FormData();
    Object.keys(this.vehiculeForm.controls).forEach(key => {
      formData.append(key, this.vehiculeForm.get(key)?.value);
    });
    
    formData.append('agenceId', this.currentUser.id.toString());
    formData.append('image', this.selectedFile);

    this.vehiculeService.addVehicule(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/transportback/agence']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to add vehicle. Please try again.';
        console.error('Error adding vehicle:', err);
      }
    });
  }

  generateVehicule(): void {
    if (!this.vehiculeForm.get('type')?.value || !this.vehiculeForm.get('modele')?.value) {
      this.errorMessage = 'Please at least specify type and model to generate suggestions';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

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
        this.isLoading = false;
        try {
          const vehicleData = JSON.parse(response.choices[0].message.content);
          this.vehiculeForm.patchValue({
            modele: vehicleData.modele,
            type: vehicleData.type,
            nbPlace: vehicleData.nbPlace,
            prixParJour: vehicleData.prixParJour,
            localisation: vehicleData.localisation,
            statut: vehicleData.statut,
            description: vehicleData.description
          });
          this.vehiculeForm.markAsDirty();
        } catch (e) {
          this.errorMessage = 'Failed to parse generated vehicle data';
          console.error('Parsing error:', e);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to generate vehicle. Please try again.';
        console.error('Error generating vehicle:', err);
      }
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.vehiculeForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}