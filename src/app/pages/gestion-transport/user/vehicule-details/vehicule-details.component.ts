import { Component, OnInit } from '@angular/core';
import { VehiculeService } from '../../services/vehicule.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Vehicule } from '../../models/vehicule.model';

@Component({
  selector: 'app-vehicule-details',
  templateUrl: './vehicule-details.component.html',
  styleUrl: './vehicule-details.component.scss'
})
export class VehiculeDetailsComponent implements OnInit {
  vehicule: Vehicule | null = null;

  constructor(
    private route: ActivatedRoute,
    private vehiculeService: VehiculeService
  ) {}

  ngOnInit(): void {
    const vehiculeId = this.route.snapshot.paramMap.get('id');
    if (vehiculeId) {
      this.vehiculeService.getVehiculeById(+vehiculeId).subscribe((data: Vehicule) => {
        this.vehicule = data;
      });
    }
  }

  reservevehicule() {
    // Implement reservation logic here
    console.log('Reservation logic goes here');
  }
}