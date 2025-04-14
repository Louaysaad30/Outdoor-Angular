import { Component, OnInit } from '@angular/core';
import { VehiculeService } from '../../services/vehicule.service';
import { Vehicule } from '../../models/vehicule.model';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-list-vehicule-agence',
  templateUrl: './list-vehicule-agence.component.html',
  styleUrls: ['./list-vehicule-agence.component.scss']
})
export class ListVehiculeAgenceComponent implements OnInit {
  vehicules: Vehicule[] = [];
  filteredVehicules: Vehicule[] = [];
  agenceId = 1; // temporaire, tu peux le rendre dynamique
  isLoading = true;

  constructor(
    private vehiculeService: VehiculeService,
    private router: Router ,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    const agenceId = +this.route.snapshot.paramMap.get('agenceId')!;
    this.vehiculeService.getVehiculesByAgence(this.agenceId).subscribe({
      next: (data) => {
        this.vehicules = data;
        this.filteredVehicules = data; // Par défaut, on montre tous les véhicules
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur récupération véhicules:', err);
        this.isLoading = false;
      }
    });
  }

  updateVehicule(vehiculeId: number): void {
    // Redirection vers la page de mise à jour
    this.router.navigate([`/update-vehicule/${vehiculeId}`]);
  }

  deleteVehicule(id: number): void {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      this.vehiculeService.deleteVehicule(id).subscribe({
        next: () => {
          // Remove the vehicle from the list in the UI
          this.filteredVehicules = this.filteredVehicules.filter(v => v.id !== id);
          this.vehicules = this.vehicules.filter(v => v.id !== id);
          console.log('Vehicle deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting vehicle:', err);
        }
      });
    }
  }
  
}
