import { Component, OnInit, ViewChild } from '@angular/core';
      import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
      import { ModalDirective, ModalModule } from "ngx-bootstrap/modal";
      import { DropzoneConfigInterface, DropzoneModule } from "ngx-dropzone-wrapper";
      import { AccordionModule } from "ngx-bootstrap/accordion";
      import { BsDropdownModule } from "ngx-bootstrap/dropdown";
      import { RatingModule } from "ngx-bootstrap/rating";
      import { RouterLink, ActivatedRoute } from "@angular/router";
      import { SharedModule } from "../../../../shared/shared.module";
      import { SimplebarAngularModule } from "simplebar-angular";
      import { EventService } from '../../services/event.service';
      import { EventAreaService } from '../../services/event-area.service';
      import { Event } from '../../models/event.model';
      import { EventArea } from '../../models/event-area.model';
      import { icon, latLng, marker, tileLayer } from "leaflet";
      import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import {ReverseGeocodingService} from "../../services/reverse-geocoding.service";

      @Component({
        selector: 'app-event-details-front-office',
        standalone: true,
        imports: [
          AccordionModule,
          BsDropdownModule,
          DropzoneModule,
          ModalModule,
          RatingModule,
          ReactiveFormsModule,
          RouterLink,
          SharedModule,
          SimplebarAngularModule,
          LeafletModule
        ],
        templateUrl: './event-details-front-office.component.html',
        styleUrl: './event-details-front-office.component.scss'
      })
      export class EventDetailsFrontOfficeComponent implements OnInit {
        // bread crumb items
        breadCrumbItems!: Array<{}>;
        reviewForm!: UntypedFormGroup;
        reviewData: any;
        submitted: boolean = false;
        deleteId: any;
        files: File[] = [];
        rate: any;
        currentTab = 'description';
        loading: boolean = true;
        event: Event | null = null;
        eventArea: EventArea | null = null;

        // Map configuration
        options = {
          layers: [
            tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap contributors'
            })
          ],
          zoom: 15,
          center: latLng(34.0, 9.0)
        };

        marker: any;

        @ViewChild('addReview', { static: false }) addReview?: ModalDirective;
        @ViewChild('removeItemModal', { static: false }) removeItemModal?: ModalDirective;

        constructor(
          private formBuilder: UntypedFormBuilder,
          private route: ActivatedRoute,
          private eventService: EventService,
          private eventAreaService: EventAreaService ,
          private reverseGeocodingService: ReverseGeocodingService
        ) {}

        ngOnInit(): void {
          /**
           * BreadCrumb
           */
          this.breadCrumbItems = [
            { label: 'Events', active: true },
            { label: 'Event Details', active: true }
          ];

          /**
           * Form Validation
           */
          this.reviewForm = this.formBuilder.group({
            _id: [''],
            title: ['', [Validators.required]],
            content: ['', [Validators.required]],
            rate: ['', [Validators.required]],
            img: ['']
          });

          // Get event ID from route params and load event
          this.route.paramMap.subscribe(params => {
            const eventId = Number(params.get('id'));
            if (eventId) {
              this.loadEvent(eventId);
            }
          });
        }

        loadEvent(eventId: number): void {
          this.loading = true;
          this.eventService.getEventById(eventId).subscribe({
            next: (event) => {
              this.event = event;
              if (event.eventArea && event.eventArea.id) {
                this.loadEventArea(event.eventArea.id);
              } else {
                this.loading = false;
              }
            },
            error: (error) => {
              console.error('Error loading event:', error);
              this.loading = false;
            }
          });
        }

        loadEventArea(areaId: number): void {
          this.eventAreaService.getEventAreaById(areaId).subscribe({
            next: (area) => {
              this.eventArea = area;

              if (area.latitude && area.longitude) {
                this.reverseGeocodingService.reverseGeocode(area.latitude, area.longitude)
                  .subscribe((address: string) => {
                    this.eventArea!.address = address;
                  });
              }

              // Update map center to event area location
              if (area.latitude && area.longitude) {
                this.options = {
                  ...this.options,
                  center: latLng(area.latitude, area.longitude)
                };

                // Create marker for event location
                this.marker = marker([area.latitude, area.longitude], {
                  icon: icon({
                    iconSize: [25, 41],
                    iconAnchor: [13, 41],
                    iconUrl: 'assets/images/leaflet/marker-icon.png',
                    shadowUrl: 'assets/images/leaflet/marker-shadow.png'
                  })
                });
              }

              this.loading = false;
            },
            error: (error) => {
              console.error('Error loading event area:', error);
              this.loading = false;
            }
          });
        }

        // Open & close chatbox
        openChatbox(): void {
          document.getElementById('emailchat-detailElem')?.classList.add('d-block');
        }

        closeChatbox(): void {
          document.getElementById('emailchat-detailElem')?.classList.remove('d-block');
        }

        changeTab(tab: string): void {
          this.currentTab = tab;
        }
      }
