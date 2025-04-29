import { Component, OnInit, ViewChild } from '@angular/core';
        import { FormBuilder, FormGroup, Validators } from '@angular/forms';
        import { ModalDirective } from 'ngx-bootstrap/modal';
        import { EventAreaService } from '../../services/event-area.service';
        import { EventArea } from '../../models/event-area.model';
        import { CommonModule } from '@angular/common';
        import { ReactiveFormsModule, FormsModule } from '@angular/forms';
        import { ModalModule } from 'ngx-bootstrap/modal';
        import { SharedModule } from '../../../../shared/shared.module';
        import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
        import { TabsModule } from 'ngx-bootstrap/tabs';
import {ReverseGeocodingService} from "../../services/reverse-geocoding.service";

        @Component({
          selector: 'app-event-area-approval',
          standalone: true,
          imports: [
            CommonModule,
            ReactiveFormsModule,
            FormsModule,
            ModalModule,
            SharedModule,
            BsDropdownModule,
            TabsModule
          ],
          templateUrl: './event-area-approval.component.html',
          styleUrls: ['./event-area-approval.component.scss']
        })
        export class EventAreaApprovalComponent implements OnInit {
          breadCrumbItems = [
            { label: 'Event Areas', active: false },
            { label: 'Approval Management', active: true }
          ];

          loading: boolean = true;
          pendingAreas: EventArea[] = [];
          approvedAreas: EventArea[] = [];
          rejectedAreas: EventArea[] = [];
          selectedArea: EventArea | null = null;
          rejectionForm: FormGroup;
          approvalForm: FormGroup;
          activeTab: string = 'pending';

          @ViewChild('detailsModal', { static: false }) detailsModal?: ModalDirective;
          @ViewChild('rejectModal', { static: false }) rejectModal?: ModalDirective;
          @ViewChild('approveModal', { static: false }) approveModal?: ModalDirective;

          constructor(
            private eventAreaService: EventAreaService,
            private fb: FormBuilder,
            private reverseGeocodingService: ReverseGeocodingService

          ) {
            this.rejectionForm = this.fb.group({
              rejectionMessage: ['', [Validators.required, Validators.minLength(10)]]
            });

            this.approvalForm = this.fb.group({
              approvalNote: ['']
            });
          }

          ngOnInit(): void {
            this.loadAllAreas();
          }

          loadAllAreas(): void {
            this.loading = true;

            // Load pending areas
            this.eventAreaService.getPendingEventAreas().subscribe({
              next: (areas) => {
                this.pendingAreas = areas;
                this.fetchAddresses(this.pendingAreas);

                // Load approved areas
                this.eventAreaService.getApprovedEventAreas().subscribe({
                  next: (areas) => {
                    this.approvedAreas = areas;
                    this.fetchAddresses(this.approvedAreas);

                    // Load rejected areas
                    this.eventAreaService.getRejectedEventAreas().subscribe({
                      next: (areas) => {
                        this.rejectedAreas = areas;
                        this.fetchAddresses(this.rejectedAreas);
                        this.loading = false;
                      },
                      error: this.handleError
                    });
                  },
                  error: this.handleError
                });
              },
              error: this.handleError
            });
          }

          private handleError(error: any): void {
            console.error('Error loading areas:', error);
            this.loading = false;
          }

          viewDetails(area: EventArea, status: string): void {
            this.selectedArea = area;
            this.activeTab = status;
            this.detailsModal?.show();
          }

          openRejectModal(): void {
            this.rejectModal?.show();
            this.rejectionForm.reset();
          }

          openApproveModal(): void {
            this.approveModal?.show();
            this.approvalForm.reset();
          }

          approveArea(areaId?: number): void {
            const id = areaId || this.selectedArea?.id;
            if (id) {
              this.eventAreaService.approveEventArea(id).subscribe({
                next: () => {
                  this.approveModal?.hide();
                  this.detailsModal?.hide();
                  this.loadAllAreas(); // Refresh all lists
                },
                error: (error) => console.error('Error approving area:', error)
              });
            }
          }

          rejectArea(): void {
            if (this.selectedArea?.id && this.rejectionForm.valid) {
              const rejectionMessage = this.rejectionForm.get('rejectionMessage')?.value;
              this.eventAreaService.rejectEventArea(this.selectedArea.id, rejectionMessage).subscribe({
                next: () => {
                  this.rejectModal?.hide();
                  this.detailsModal?.hide();
                  this.loadAllAreas(); // Refresh all lists
                },
                error: (error) => console.error('Error rejecting area:', error)
              });
            }
          }

          setActiveTab(tabId: string): void {
            this.activeTab = tabId;
          }

          getAreaCount(status: string): number {
            switch(status) {
              case 'pending': return this.pendingAreas.length;
              case 'approved': return this.approvedAreas.length;
              case 'rejected': return this.rejectedAreas.length;
              default: return 0;
            }
          }

          getAreasForTab(): EventArea[] {
            switch (this.activeTab) {
              case 'pending':
                return this.pendingAreas;
              case 'approved':
                return this.approvedAreas;
              case 'rejected':
                return this.rejectedAreas;
              default:
                return this.pendingAreas;
            }
          }

          private fetchAddresses(areas: EventArea[]): void {
            areas.forEach(area => {
              this.reverseGeocodingService.reverseGeocode(area.latitude, area.longitude)
                .subscribe((address: string) => {
                  area.address = address;
                });
            });
          }




        }
