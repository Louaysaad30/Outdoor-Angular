import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap/modal';
import { FlatpickrModule } from 'angularx-flatpickr';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormationListService } from '../../services/formation-list.service';
import { ToastService } from '../../services/toast.service';
import { Formation } from '../../models/formation.model';

@Component({
  selector: 'app-formateur-dashboard',
  standalone: true,
  templateUrl: './formateur-dashboard.component.html',
  styleUrls: ['./formateur-dashboard.component.scss'],
  imports: [CommonModule, FormsModule, SharedModule, FlatpickrModule, ModalModule]
})
export class FormateurDashboardComponent implements OnInit {

  formations: Formation[] = [];
  filteredFormations: Formation[] = [];

  formateurNomComplet: string = '';
  formateurImage: string = 'assets/images/users/avatar-1.jpg';
  selectedDate: Date = new Date(); // 📅 Default today
  loading: boolean = false;
  breadCrumbItems: { label: string, link?: string, active?: boolean }[] = [];

  constructor(
    private formationService: FormationListService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Home', link: '/' },
      { label: 'My Courses', active: true }
    ];

    this.loadFormateurData();
    this.loadFormations();
  }

  private loadFormateurData(): void {
    const userString = localStorage.getItem('user');
    if (!userString) {
      this.toast.error('You are not logged in.');
      return;
    }

    try {
      const user = JSON.parse(userString);
      this.formateurNomComplet = `${user.nom ?? ''} ${user.prenom ?? ''}`.trim();
      this.formateurImage = user.image || 'assets/images/users/avatar-1.jpg';
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      this.toast.error('Invalid user data.');
    }
  }

  private loadFormations(): void {
    const userString = localStorage.getItem('user');
    if (!userString) return;

    const userId = JSON.parse(userString).id;
    if (!userId) return;

    this.loading = true;
    this.formationService.getFormationsByFormateur(userId).subscribe({
      next: (formations) => {
        this.formations = formations;
        this.filteredFormations = this.filterFormationsBySelectedDate();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading formations:', error);
        this.toast.error('Failed to load formations.');
        this.loading = false;
      }
    });
  }

  filterByDate(): void {
    this.filteredFormations = this.filterFormationsBySelectedDate();
  }

  private filterFormationsBySelectedDate(): Formation[] {
    if (!this.selectedDate) return [];

    const selected = new Date(this.selectedDate);
    return this.formations.filter(formation => {
      if (!formation.dateDebut) return false;
      const debut = new Date(formation.dateDebut);

      // 📅 Compare day, month and year
      return debut.getFullYear() === selected.getFullYear()
        && debut.getMonth() === selected.getMonth()
        && debut.getDate() === selected.getDate();
    });
  }

  trackByFormation(index: number, formation: Formation): number {
    return formation.id ?? index;
  }
}
