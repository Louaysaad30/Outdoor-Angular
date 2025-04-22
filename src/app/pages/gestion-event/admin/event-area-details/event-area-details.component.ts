import { Component, OnInit, ViewChild } from '@angular/core';
        import { BsDropdownModule } from "ngx-bootstrap/dropdown";
        import { LeafletModule } from "@asymmetrik/ngx-leaflet";
        import { SharedModule } from "../../../../shared/shared.module";
        import { SimplebarAngularModule } from "simplebar-angular";
        import { SlickCarouselModule } from "ngx-slick-carousel";
        import * as L from "leaflet";
        import { ActivatedRoute, RouterLink } from "@angular/router";
        import { EventAreaService } from "../../services/event-area.service";
        import { EventArea } from "../../models/event-area.model";
        import { ReverseGeocodingService } from "../../services/reverse-geocoding.service";
        import { NlpService } from "../../services/nlp.service";
        import { CommonModule } from "@angular/common";
        import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
        import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';
        import { Router } from '@angular/router';

        const customIcon = L.icon({
          iconSize: [25, 41],
          iconAnchor: [13, 41],
          iconUrl: '/assets/images/leaflet/marker-icon.png',
          shadowUrl: '/assets/images/leaflet/marker-shadow.png'
        });

        @Component({
          selector: 'app-event-area-details',
          standalone: true,
          imports: [
            BsDropdownModule,
            LeafletModule,
            SharedModule,
            SimplebarAngularModule,
            SlickCarouselModule,
            CommonModule,
            ReactiveFormsModule,
            ModalModule,
            FormsModule,
            RouterLink
          ],
          templateUrl: './event-area-details.component.html',
          styleUrl: './event-area-details.component.scss'
        })
        export class EventAreaDetailsComponent implements OnInit {

          eventArea!: EventArea;
          map: L.Map | null = null;
          marker: any;

          // bread crumb items
          breadCrumbItems!: Array<{}>;

          // Extracted keywords
          extractedKeywords: string[] = [];
          isExtractingKeywords: boolean = false;

          imageSource: string = 'upload';
          isGeneratingImage: boolean = false;
          generatedImageBlob: Blob | null = null;

          userDetails: any = null;

          events: any[] = [];
          isLoadingEvents: boolean = false;

          options = {
            layers: [
              L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors © CARTO'
              })
            ],
            zoom: 10,
            center: L.latLng(34.0, 9.0) // Default center, will be updated
          };

          mapMarkers: L.Layer[] = [];

          @ViewChild('addProperty', { static: false }) addProperty?: ModalDirective;
          @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;
          @ViewChild('rejectionModal', { static: false }) rejectionModal?: ModalDirective;

          propertyForm!: FormGroup;
          uploadedFile: File | null = null;

          constructor(
            private route: ActivatedRoute,
            private eventAreaService: EventAreaService,
            private reverseGeocodingService: ReverseGeocodingService,
            private nlpService: NlpService,
            private fb: FormBuilder,
            private router: Router
          ) {
            this.propertyForm = this.fb.group({
              id: [''],
              title: ['', [Validators.required]],
              price: ['', [Validators.required]],
              location: ['', [Validators.required]],
              img: [''],
              Atitude: ['', [Validators.required]],
              Longitude: ['', [Validators.required]]
            });
          }

          ngOnInit(): void {
            const id = this.route.snapshot.paramMap.get('id');
            if (id) {
              this.eventAreaService.getEventAreaWithUserDetails(+id).subscribe((data: any) => {
                this.eventArea = data.eventArea;
                this.userDetails = data.user;
                this.reverseGeocodingService.reverseGeocode(this.eventArea.latitude, this.eventArea.longitude)
                  .subscribe((address: string) => {
                    this.eventArea.address = address;
                  });

                this.extractKeywords();
                this.loadEventsForEventArea();
              });
            }
          }

          slidesConfig = {
            // Configuration options for the ngx-slick-carousel
            slidesToShow: 1,
            slidesToScroll: 1
          }

          editEventArea(): void {
            if (!this.eventArea) return;

            this.propertyForm.patchValue({
              id: this.eventArea.id,
              title: this.eventArea.name,
              price: this.eventArea.capacity,
              location: this.eventArea.description,
              img: this.eventArea.areaImg,
              Atitude: this.eventArea.latitude,
              Longitude: this.eventArea.longitude
            });

            this.addProperty?.show();
          }

          saveProperty(): void {
            if (this.propertyForm.valid && this.eventArea?.id) {
              const updatedEventArea = {
                name: this.propertyForm.value.title,
                capacity: Number(this.propertyForm.value.price),
                latitude: Number(this.propertyForm.value.Atitude),
                longitude: Number(this.propertyForm.value.Longitude),
                description: this.propertyForm.value.location,
                areaImg: this.eventArea.areaImg,
                events: this.eventArea.events || []
              };

              // Only pass the file if we're in upload mode and a file was selected
              const fileToUpload = this.imageSource === 'upload' ? this.uploadedFile : undefined;

              this.eventAreaService.updateEventArea(this.eventArea.id, updatedEventArea, this.uploadedFile || undefined).subscribe({
                next: (response) => {
                  // Update the displayed event area with the new data
                  this.eventArea = response;

                  // Update the address
                  this.reverseGeocodingService.reverseGeocode(response.latitude, response.longitude)
                    .subscribe((address: string) => {
                      this.eventArea.address = address;
                    });

                  this.addProperty?.hide();
                  this.extractKeywords(); // Re-extract keywords
                },
                error: (error) => {
                  console.error('Error updating event area:', error);
                }
              });
            }
          }

          onMapReady(map: L.Map): void {
            this.map = map;

            // Only update map view after event area data is loaded
            if (this.eventArea) {
              map.setView(
                L.latLng(this.eventArea.latitude, this.eventArea.longitude),
                15
              );

              // Add marker for the event area
              this.mapMarkers = [
                L.marker([this.eventArea.latitude, this.eventArea.longitude], {
                  icon: L.icon({
                    iconSize: [25, 41],
                    iconAnchor: [13, 41],
                    iconUrl: '/assets/images/leaflet/marker-icon.png',
                    shadowUrl: '/assets/images/leaflet/marker-shadow.png'
                  })
                }).bindPopup(`<b>${this.eventArea.name}</b><br/>Capacity: ${this.eventArea.capacity}`)
              ];
            }
          }

          onFileSelected(event: Event): void {
            const inputElement = event.target as HTMLInputElement;
            if (inputElement.files && inputElement.files.length > 0) {
              this.uploadedFile = inputElement.files[0];
              const reader = new FileReader();
              reader.onload = () => {
                this.propertyForm.patchValue({ img: reader.result });
              };
              reader.readAsDataURL(this.uploadedFile);
            }
          }

          removeItem(): void {
            this.deleteRecordModal?.show();
          }

          confirmDelete(): void {
            if (!this.eventArea?.id) return;

            this.eventAreaService.deleteEventArea(this.eventArea.id).subscribe({
              next: () => {
                this.deleteRecordModal?.hide();
                // Navigate back to the event area list
                this.router.navigate(['/eventback/admin/event-area-list']);
              },
              error: (error) => {
                console.error('Error deleting event area:', error);
              }
            });
          }

          openChatbox() {
            document.querySelector('.email-chat-detail')?.classList.toggle('d-block')
          }

          extractKeywords(): void {
            if (!this.eventArea?.description || this.isExtractingKeywords) return;

            this.isExtractingKeywords = true;
            this.extractedKeywords = [];

            if (this.eventArea?.id) {
              // Call the NLP service to extract keywords
              this.nlpService.extractEventAreaKeywords(this.eventArea.id).subscribe({
                next: (response) => {
                  if (response && response.keywords) {
                    this.extractedKeywords = response.keywords;
                  }
                  this.isExtractingKeywords = false;
                },
                error: (error) => {
                  console.error('Error extracting keywords:', error);
                  this.isExtractingKeywords = false;
                }
              });
            }
          }

          generateImageFromDescription(): void {
            const description = this.propertyForm.get('location')?.value;
            if (!description) {
              return;
            }

            this.isGeneratingImage = true;
            this.nlpService.generateImage(description).subscribe({
              next: (imageBlob: Blob) => {
                this.generatedImageBlob = imageBlob;

                // Create a URL for the blob to display in the UI
                const imageUrl = URL.createObjectURL(imageBlob);
                this.propertyForm.patchValue({ img: imageUrl });

                // Create a File object from the blob for upload
                const fileName = `generated_${Date.now()}.jpg`;
                this.uploadedFile = new File([imageBlob], fileName, { type: 'image/jpeg' });

                this.isGeneratingImage = false;
              },
              error: (error) => {
                console.error('Error generating image:', error);
                this.isGeneratingImage = false;
              }
            });
          }

          showRejectionMessage(): void {
            if (this.eventArea?.status === 'REJECTED' && this.rejectionModal) {
              this.rejectionModal.show();
            }
          }


          loadEventsForEventArea(): void {
            if (!this.eventArea?.id) return;

            this.isLoadingEvents = true;
            this.eventAreaService.getEventsByEventArea(this.eventArea.id).subscribe({
              next: (events) => {
                this.events = events;
                this.isLoadingEvents = false;
              },
              error: (error) => {
                console.error('Error loading events for this area:', error);
                this.isLoadingEvents = false;
              }
            });
          }

        }
