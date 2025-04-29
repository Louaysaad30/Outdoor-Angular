import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaginationModule, PageChangedEvent } from 'ngx-bootstrap/pagination';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { SimplebarAngularModule } from 'simplebar-angular';
import { SharedModule } from '../../../../shared/shared.module';

import { FormationListService } from '../../services/formation-list.service';
import { Formation } from '../../models/formation.model';

@Component({
  selector: 'app-formation-front-office',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalModule,
    PaginationModule,
    BsDropdownModule,
    TooltipModule,
    RouterLink,
    SharedModule,
    SimplebarAngularModule
  ],
  templateUrl: './formation-front-office.component.html',
  styleUrls: ['./formation-front-office.component.scss']
})
export class FormationFrontOfficeComponent implements OnInit {
  breadCrumbItems: Array<{}> = [
    { label: 'Formations', active: true },
    { label: 'Liste des Formations', active: true }
  ];

  formations: Formation[] = [];
  displayedFormations: Formation[] = [];
  term: string = '';
  itemsPerPage = 8;
  currentPage = 1;
  loading = true;
  selectedCategorieId: string = '';
  selectedMode: string = '';
  prixMin: number | null = null;
  prixMax: number | null = null;
  categories: any[] = []; // ou ton vrai modèle Categorie
    
  constructor(private formationService: FormationListService) {}

  ngOnInit(): void {
    this.loadFormations();
    this.loadCategories();
  }

  loadFormations(): void {
    this.loading = true;

    this.formationService.getFormations().subscribe({
      next: (data) => {
        this.formations = data;
        this.pageChanged({ page: 1, itemsPerPage: this.itemsPerPage });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement formations :', err);
        this.loading = false;
      }
    });
  }
  loadCategories(): void {
    this.formationService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error("Erreur chargement catégories", err);
      }
    });
  }
  

  searchList(): void {
    const termLower = this.term.toLowerCase();
    const filtered = this.formations.filter(f =>
      f.titre?.toLowerCase().includes(termLower) ||
      f.description?.toLowerCase().includes(termLower)
    );
    this.displayedFormations = filtered.slice(0, this.itemsPerPage);
  }

  filterByMode(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const mode = selectElement.value;
  
    if (mode === 'online') {
      this.displayedFormations = this.formations.filter(f => f.enLigne);
    } else if (mode === 'offline') {
      this.displayedFormations = this.formations.filter(f => !f.enLigne);
    } else {
      this.pageChanged({ page: 1, itemsPerPage: this.itemsPerPage });
    }
  
    this.updateNoResultDisplay();
  }
  applyFilters(): void {
    let filtered = [...this.formations];
  
    if (this.selectedCategorieId) {
      filtered = filtered.filter(f => f.categorie?.id === Number(this.selectedCategorieId));
    }
  
    if (this.selectedMode === 'online') {
      filtered = filtered.filter(f => f.enLigne);
    } else if (this.selectedMode === 'offline') {
      filtered = filtered.filter(f => !f.enLigne);
    }
  
    if (this.prixMin != null) {
      filtered = filtered.filter(f => f.prix >= this.prixMin!);
    }
  
    if (this.prixMax != null) {
      filtered = filtered.filter(f => f.prix <= this.prixMax!);
    }
  
    this.displayedFormations = filtered.slice(0, this.itemsPerPage);
  }
  
  updateNoResultDisplay(): void {
    const noResultElement = document.getElementById('noresult');
    const paginationElement = document.getElementById('pagination-element');

    if (this.displayedFormations.length === 0) {
      if (noResultElement) noResultElement.style.display = 'block';
      if (paginationElement) paginationElement.classList.add('d-none');
    } else {
      if (noResultElement) noResultElement.style.display = 'none';
      if (paginationElement) paginationElement.classList.remove('d-none');
    }
  }

  pageChanged(event: PageChangedEvent): void {
    this.currentPage = event.page;
    const start = (event.page - 1) * event.itemsPerPage;
    const end = start + event.itemsPerPage;
    this.displayedFormations = this.formations.slice(start, end);
  }
}
