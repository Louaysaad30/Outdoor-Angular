import { Component } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { DropzoneModule } from 'ngx-dropzone-wrapper';
  import { ModalModule } from 'ngx-bootstrap/modal';
  import { PaginationModule } from 'ngx-bootstrap/pagination';
  import { ReactiveFormsModule, FormsModule } from '@angular/forms';
  import { RouterLink } from '@angular/router';
  import { SharedModule } from '../../../../shared/shared.module';
  import { CentreCamping } from '../../model/centrecamping.model';
  import { CentreCampingService } from '../../services/centrecamping.service';
  import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import Swal from "sweetalert2";

  @Component({
    selector: 'app-camping-admin',
    standalone: true,
    imports: [CommonModule, DropzoneModule, ModalModule, PaginationModule, ReactiveFormsModule, FormsModule, RouterLink, SharedModule],
    templateUrl: './camping-admin.component.html',
    styleUrl: './camping-admin.component.scss'
  })
  export class CampingAdminComponent {
    centre: CentreCamping[] = [];
    centrelist: CentreCamping[] = [];
    filteredCentreList: CentreCamping[] = [];
    term: string = '';
    direction: string = 'asc';
    masterSelected: boolean = false;
    checkedValGet: any[] = [];

    constructor(private centreCampingService: CentreCampingService) {}

    ngOnInit(): void {
      this.getCentreCampingList();
    }

    getCentreCampingList(): void {
      this.centreCampingService.getAllCentreCamping().subscribe((data: CentreCamping[]) => {
        this.centrelist = data;
        this.filteredCentreList = data; // Initialize filtered list
        this.centre = this.filteredCentreList.slice(0, 4); // Show first 4 items initially
      });
    }

    filterData(): void {
      if (this.term) {
        const lowerTerm = this.term.toLowerCase();
        this.filteredCentreList = this.centrelist.filter(centre =>
          (centre.name && centre.name.toLowerCase().includes(lowerTerm)) ||
          (centre.address && centre.address.toLowerCase().includes(lowerTerm)) ||
          (centre.idCentre && centre.idCentre.toString().includes(lowerTerm)) ||
          (centre.latitude && centre.latitude.toString().includes(lowerTerm)) ||
          (centre.longitude && centre.longitude.toString().includes(lowerTerm)) ||
          (centre.capcite && centre.capcite.toString().includes(lowerTerm)) ||
          (centre.verified !== undefined && centre.verified.toString().includes(lowerTerm))
        );
      } else {
        this.filteredCentreList = this.centrelist;
      }
      this.centre = this.filteredCentreList.slice(0, 4); // Update displayed items
      this.updateNoResultDisplay();
    }

    updateNoResultDisplay() {
      const noResultElement = document.querySelector('.noresult') as HTMLElement;
      if (noResultElement) {
        if (this.term && this.filteredCentreList.length == 0) {
          noResultElement.style.display = 'block';
        } else {
          noResultElement.style.display = 'none';
        }
      }
    }

    onSort(column: string): void {
      this.direction = this.direction === 'asc' ? 'desc' : 'asc';
      this.filteredCentreList.sort((a, b) => {
        const valueA = a[column as keyof CentreCamping];
        const valueB = b[column as keyof CentreCamping];

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return this.direction === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        } else if (typeof valueA === 'number' && typeof valueB === 'number') {
          return this.direction === 'asc'
            ? valueA - valueB
            : valueB - valueA;
        } else {
          const strA = String(valueA);
          const strB = String(valueB);
          return this.direction === 'asc'
            ? strA.localeCompare(strB)
            : strB.localeCompare(strA);
        }
      });
      this.centre = this.filteredCentreList.slice(0, 4); // Update displayed items
    }

    trackById(index: number, item: CentreCamping): number {
      return item.idCentre;
    }

    pageChanged(event: PageChangedEvent): void {
      const startItem = (event.page - 1) * event.itemsPerPage;
      const endItem = Math.min(event.page * event.itemsPerPage, this.filteredCentreList.length);
      this.centre = this.filteredCentreList.slice(startItem, endItem);
    }

    onCheckboxChange(e: any) {
      this.updateCheckedValues();
    }

    updateCheckedValues() {
      this.checkedValGet = this.centre
        .map(item => item.idCentre);

      const removeActions = document.getElementById("remove-actions");
      if (removeActions) {
        this.checkedValGet.length > 0
          ? removeActions.classList.remove('d-none')
          : removeActions.classList.add('d-none');
      }
    }

    verifyCenter(id: number): void {
      this.centreCampingService.verifyCentreCamping(id).subscribe({
        next: () => {
          this.getCentreCampingList(); // Refresh the list of camping centers
          Swal.fire({
            title: 'Verified!',
            text: 'Camping center has been verified.',
            icon: 'success',
            confirmButtonColor: '#4b93ff',
          });
        },
        error: (error) => {
          console.error('Error verifying camping center:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Error while verifying camping center',
            icon: 'error',
            confirmButtonColor: '#ef476f',
          });
        }
      });
    }

    deactivateCenter(id: number): void {
      this.centreCampingService.deactivateCentreCamping(id).subscribe({
        next: () => {
          this.getCentreCampingList(); // Refresh the list of camping centers
          Swal.fire({
            title: 'Deactivated!',
            text: 'Camping center has been deactivated.',
            icon: 'success',
            confirmButtonColor: '#4b93ff',
          });
        },
        error: (error) => {
          console.error('Error deactivating camping center:', error);
          Swal.fire({
            title: 'Error!',
            text: 'Error while deactivating camping center',
            icon: 'error',
            confirmButtonColor: '#ef476f',
          });
        }
      });
    }
  }
