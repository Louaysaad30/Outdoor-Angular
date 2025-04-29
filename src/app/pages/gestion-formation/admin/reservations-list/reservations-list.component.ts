import { Component, OnInit } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';
import { Reservation, StatutReservation } from '../../models/reservation.model';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexTitleSubtitle
} from "ng-apexcharts";

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    ModalModule,
    FormsModule,
    NgApexchartsModule
  ],
  templateUrl: './reservations-list.component.html',
  styleUrls: ['./reservations-list.component.scss']
})
export class ReservationListComponent implements OnInit {

  breadCrumbItems!: Array<{ label: string, link?: string, active?: boolean }>;
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  searchTerm: string = '';

  pieChartOptions: any = {
    series: [],
    chart: {
      type: 'pie',
      height: 300
    },
    labels: [],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' }
      }
    }]
  };
  
  barChartOptions: any = {
    series: [],
    chart: {
      type: 'bar',
      height: 300
    },
    xaxis: {
      categories: []
    },
    title: {
      text: 'Réservations par Mois',
      align: 'center'
    }
  };

  stats = [
    { title: 'Total Réservations', count: 0, icon: 'bi bi-book', iconColor: 'primary', border: 'primary', percent: '0' },
    { title: 'Confirmées', count: 0, icon: 'bi bi-check2-circle', iconColor: 'success', border: 'success', percent: '0' },
    { title: 'Annulées', count: 0, icon: 'bi bi-x-circle', iconColor: 'danger', border: 'danger', percent: '0' }
  ];

  constructor(
    private reservationService: ReservationService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Home', link: '/' },
      { label: 'Réservations', active: true }
    ];
    this.loadReservations();
  }

  loadReservations(): void {
    this.reservationService.getAllReservations().subscribe({
      next: (data) => {
        this.reservations = data;
        this.filteredReservations = [...data];
        this.updateStats();
        this.prepareCharts();
      },
      error: (err) => {
        console.error('Erreur chargement réservations', err);
        this.toast.error('Erreur de chargement des réservations ❌');
      }
    });
  }

  prepareCharts(): void {
    const statusCounts = {
      CONFIRME: 0,
      EN_ATTENTE: 0,
      ANNULE: 0
    };

    const monthCounts: { [key: string]: number } = {};

    this.reservations.forEach(r => {
      statusCounts[r.statut]++;
      const date = new Date(r.dateReservation);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });

    this.pieChartOptions = {
      series: [statusCounts.CONFIRME, statusCounts.ANNULE, statusCounts.EN_ATTENTE],
      chart: {
        type: "donut"
      },
      labels: ["Confirmées", "Annulées", "En attente"],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: { width: 300 },
          legend: { position: "bottom" }
        }
      }]
    };

    this.barChartOptions = {
      series: [{
        name: "Réservations",
        data: Object.values(monthCounts)
      }],
      chart: {
        type: "bar",
        height: 350
      },
      title: {
        text: "Réservations par mois"
      },
      xaxis: {
        categories: Object.keys(monthCounts)
      }
    };
  }

  updateStats(): void {
    const total = this.reservations.length;
    const confirmed = this.reservations.filter(r => r.statut === StatutReservation.CONFIRME).length;
    const cancelled = this.reservations.filter(r => r.statut === StatutReservation.ANNULE).length;

    this.stats[0].count = total;
    this.stats[0].percent = total > 0 ? '100' : '0';

    this.stats[1].count = confirmed;
    this.stats[1].percent = total ? ((confirmed / total) * 100).toFixed(1) : '0';

    this.stats[2].count = cancelled;
    this.stats[2].percent = total ? ((cancelled / total) * 100).toFixed(1) : '0';
  }

  filterData(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredReservations = this.reservations.filter(r =>
      (r.formationTitre?.toLowerCase().includes(term) ||
       r.participantNom?.toLowerCase().includes(term) ||
       r.participantPrenom?.toLowerCase().includes(term))
    );
  }

  confirmReservation(id: number): void {
    if (confirm('Confirmer cette réservation ?')) {
      this.reservationService.confirmReservation(id).subscribe({
        next: () => {
          this.toast.success('Réservation confirmée avec succès ✅');
          this.loadReservations();
        },
        error: (err) => {
          console.error('Erreur confirmation', err);
          this.toast.error('Erreur lors de la confirmation.');
        }
      });
    }
  }

  cancelReservation(id: number): void {
    if (confirm('Annuler cette réservation ?')) {
      this.reservationService.cancelReservation(id).subscribe({
        next: () => {
          this.toast.warning('Réservation annulée 🚫');
          this.loadReservations();
        },
        error: (err) => {
          console.error('Erreur annulation', err);
          this.toast.error("Erreur lors de l'annulation.");
        }
      });
    }
  }

}
