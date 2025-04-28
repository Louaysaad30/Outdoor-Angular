import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropzoneModule } from 'ngx-dropzone-wrapper';
import { ModalModule, BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { CentreCamping } from '../../model/centrecamping.model';
import { CentreCampingService } from '../../services/centrecamping.service';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import Swal from "sweetalert2";
import { ReservationService } from "../../services/reservation.service";
import { ReviewService } from "../../services/review.service";
import { CountUpModule } from "ngx-countup";
import { UserDto } from "../../model/userDTO.model";
import { finalize } from "rxjs/operators";

@Component({
  selector: 'app-camping-admin',
  standalone: true,
  imports: [CommonModule, DropzoneModule, ModalModule, PaginationModule, ReactiveFormsModule, FormsModule, RouterLink, SharedModule, CountUpModule],
  templateUrl: './camping-admin.component.html',
  styleUrl: './camping-admin.component.scss'
})
export class CampingAdminComponent {
  @ViewChild('centerDetailsModal') centerDetailsModal: any;

  centre: CentreCamping[] = [];
  centrelist: CentreCamping[] = [];
  filteredCentreList: CentreCamping[] = [];
  term: string = '';
  direction: string = 'asc';
  masterSelected: boolean = false;
  checkedValGet: any[] = [];

  // Statistics properties
  totalCenters: number = 0;
  totalReservations: number = 0;
  totalReviews: number = 0;
  verifiedCenters: number = 0;
  mostReviewedCenters: any[] = [];
  mostReservedCenters: any[] = [];
  recentReviews: any[] = [];

  // Selected center details
  selectedCenter: CentreCamping | null = null;
  ownerDetails: UserDto | null = null;
  isLoadingOwner: boolean = false;

  constructor(
    private centreCampingService: CentreCampingService,
    private reservationService: ReservationService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.getCentreCampingList();
    this.fetchStatistics();
  }

  getCentreCampingList(): void {
    this.centreCampingService.getAllCentreCamping().subscribe((data: CentreCamping[]) => {
      this.centrelist = data;
      this.filteredCentreList = data; // Initialize filtered list
      this.centre = this.filteredCentreList.slice(0, 4); // Show first 4 items initially
    });
  }

  fetchStatistics(): void {
    this.centreCampingService.getAllCentreCamping().subscribe(centers => {
      this.totalCenters = centers.length;
      this.verifiedCenters = centers.filter(center => center.verified).length;
    });

    this.reservationService.getAllReservations().subscribe(reservations => {
      this.totalReservations = reservations.length;

      const centerReservationCount = this.groupByCount(reservations, 'centerId');
      this.mostReservedCenters = Object.keys(centerReservationCount)
        .map(id => ({ centerId: id, count: centerReservationCount[id] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      this.mostReservedCenters.forEach(item => {
        this.centreCampingService.getCentreCamping(+item.centerId).subscribe(center => {
          item.centerName = center.name;
        });
      });
    });

    this.reviewService.getAllReviews().subscribe(reviews => {
      this.totalReviews = reviews.length;

      const centerReviewCount = this.groupByCount(reviews, 'centerId');
      this.mostReviewedCenters = Object.keys(centerReviewCount)
        .map(id => ({ centerId: id, count: centerReviewCount[id] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      this.mostReviewedCenters.forEach(item => {
        this.centreCampingService.getCentreCamping(+item.centerId).subscribe(center => {
          item.centerName = center.name;
        });
      });

      this.recentReviews = reviews.slice(0, 5);

      this.recentReviews.forEach(review => {
        this.reservationService.getUserById(review.userId).subscribe(user => {
          review.user = user;
        });

        this.centreCampingService.getCentreCamping(review.centerId).subscribe(center => {
          review.center = center;
        });
      });
    });
  }

  // View detailed center information and owner
  viewCenterDetails(centerId: number): void {
    this.selectedCenter = null;
    this.ownerDetails = null;
    this.isLoadingOwner = true;

    this.centreCampingService.getCentreCamping(centerId).subscribe({
      next: (centerData) => {
        this.selectedCenter = centerData;

        // If the center has an owner, fetch the owner details
        if (this.selectedCenter?.idOwner) {
          this.reservationService.getUserById(this.selectedCenter.idOwner).subscribe({
            next: (ownerData) => {
              this.ownerDetails = ownerData;
              this.isLoadingOwner = false;
            },
            error: (error) => {
              console.error('Error fetching owner details:', error);
              this.isLoadingOwner = false;
            }
          });
        } else {
          this.isLoadingOwner = false;
        }

        this.centerDetailsModal.show();
      },
      error: (error) => {
        console.error('Error fetching center details:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to load center details',
          icon: 'error',
          confirmButtonColor: '#ef476f'
        });
      }
    });
  }

  // Verify the selected center from the modal
  verifySelectedCenter(): void {
    if (!this.selectedCenter?.idCentre) return;

    this.verifyCenter(this.selectedCenter.idCentre);
    this.selectedCenter.verified = true;
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

  private groupByCount(array: any[], key: string): {[key: string]: number} {
    return array.reduce((result, item) => {
      const keyValue = item[key].toString();
      result[keyValue] = (result[keyValue] || 0) + 1;
      return result;
    }, {});
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
