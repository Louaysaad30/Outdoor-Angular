import { Component, OnInit, ViewChild } from '@angular/core';
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {SharedModule} from "../../../../shared/shared.module";
import {SimplebarAngularModule} from "simplebar-angular";
import {SlickCarouselModule} from "ngx-slick-carousel";
import * as L from "leaflet";
import {ActivatedRoute} from "@angular/router";
import {EventAreaService} from "../../services/event-area.service";
import {EventArea} from "../../models/event-area.model";
import {ReverseGeocodingService} from "../../services/reverse-geocoding.service";
import {NlpService} from "../../services/nlp.service";
import {CommonModule} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalDirective, ModalModule} from 'ngx-bootstrap/modal';
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
        ModalModule
    ],
  templateUrl: './event-area-details.component.html',
  styleUrl: './event-area-details.component.scss'
})
export class EventAreaDetailsComponent {

  eventArea!: EventArea;
  options: any;
  marker: any;

  // bread crumb items
  breadCrumbItems!: Array<{}>;

  // Extracted keywords
  extractedKeywords: string[] = [];
  isExtractingKeywords: boolean = false;

  @ViewChild('addProperty', { static: false }) addProperty?: ModalDirective;
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;
  propertyForm!: FormGroup;
  uploadedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private eventAreaService: EventAreaService,
    private reverseGeocodingService: ReverseGeocodingService ,
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
      this.eventAreaService.getEventAreaById(+id).subscribe((data: EventArea) => {
        this.eventArea = data;
        this.reverseGeocodingService.reverseGeocode(data.latitude, data.longitude)
          .subscribe((address: string) => {
            this.eventArea.address = address;
          });

        // Set map options and marker
        this.options = {
          layers: [
            L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGhlbWVzYnJhbmQiLCJhIjoiY2xmbmc3bTV4MGw1ejNzbnJqOWpubzhnciJ9.DNkdZVKLnQ6I9NOz7EED-w', {
              maxZoom: 18,
              attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
              id: 'mapbox/streets-v11',
              tileSize: 512,
              zoomOffset: -1
            })
          ],
          zoom: 15,
          center: L.latLng(data.latitude, data.longitude)
        };

        this.marker = L.marker([data.latitude, data.longitude], { icon: customIcon })
          .bindPopup(`<b>${data.name}</b><br>${data.address}`);

        this.extractKeywords();
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

      this.eventAreaService.updateEventArea(this.eventArea.id, updatedEventArea, this.uploadedFile || undefined).subscribe({
        next: (response) => {
          // Update the displayed event area with the new data
          this.eventArea = response;

          // Update the address
          this.reverseGeocodingService.reverseGeocode(response.latitude, response.longitude)
            .subscribe((address: string) => {
              this.eventArea.address = address;
            });

          // Update the map marker
          this.options = {
            layers: [
              L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGhlbWVzYnJhbmQiLCJhIjoiY2xmbmc3bTV4MGw1ejNzbnJqOWpubzhnciJ9.DNkdZVKLnQ6I9NOz7EED-w', {
                maxZoom: 18,
                attribution: '© OpenStreetMap contributors',
                id: 'mapbox/streets-v11',
                tileSize: 512,
                zoomOffset: -1
              })
            ],
            zoom: 15,
            center: L.latLng(response.latitude, response.longitude)
          };

          this.marker = L.marker([response.latitude, response.longitude], { icon: customIcon })
            .bindPopup(`<b>${response.name}</b><br>${response.address}`);

          this.addProperty?.hide();
          this.extractKeywords(); // Re-extract keywords
        },
        error: (error) => {
          console.error('Error updating event area:', error);
        }
      });
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

}
