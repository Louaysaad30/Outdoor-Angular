import { Component } from '@angular/core';
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
        SlickCarouselModule
    ],
  templateUrl: './event-area-details.component.html',
  styleUrl: './event-area-details.component.scss'
})
export class EventAreaDetailsComponent {

  eventArea!: EventArea;
  options: any;
  marker: any;

  constructor(
    private route: ActivatedRoute,
    private eventAreaService: EventAreaService,
    private reverseGeocodingService: ReverseGeocodingService
  ) { }

  // bread crumb items
  breadCrumbItems!: Array<{}>;

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
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap contributors'
            })
          ],
          zoom: 15,
          center: L.latLng(data.latitude, data.longitude)
        };

        this.marker = L.marker([data.latitude, data.longitude], { icon: customIcon })
          .bindPopup(`<b>${data.name}</b><br>${data.address}`);      });
    }
  }

  slidesConfig = {
    // Configuration options for the ngx-slick-carousel
    slidesToShow: 1,
    slidesToScroll: 1
  }

  // open chat detail
  openChatbox() {
    document.querySelector('.email-chat-detail')?.classList.toggle('d-block')
  }


}
