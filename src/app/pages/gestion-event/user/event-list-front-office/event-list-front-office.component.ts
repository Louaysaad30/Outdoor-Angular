import { Component, OnInit, ViewChild } from '@angular/core';
    import {FormsModule, ReactiveFormsModule, UntypedFormBuilder} from "@angular/forms";
    import {ModalDirective, ModalModule} from "ngx-bootstrap/modal";
    import {PageChangedEvent, PaginationModule} from "ngx-bootstrap/pagination";
    import { EventService } from '../../services/event.service';
    import { EventAreaService } from '../../services/event-area.service';
    import { Event, Status } from '../../models/event.model';
    import { EventArea } from '../../models/event-area.model';
import {BsDropdownModule} from "ngx-bootstrap/dropdown";
import {DropzoneModule} from "ngx-dropzone-wrapper";
import {NgxSliderModule} from "ngx-slider-v2";
import {RouterLink} from "@angular/router";
import {SharedModule} from "../../../../shared/shared.module";
import {SimplebarAngularModule} from "simplebar-angular";
import {TooltipModule} from "ngx-bootstrap/tooltip";
import {Store} from "@ngrx/store";

@Component({
  selector: 'app-event-list-front-office',
  standalone: true,
  imports: [
    BsDropdownModule,
    DropzoneModule,
    ModalModule,
    NgxSliderModule,
    PaginationModule,
    ReactiveFormsModule,
    RouterLink,
    SharedModule,
    SimplebarAngularModule,
    TooltipModule,
    FormsModule
  ],
  templateUrl: './event-list-front-office.component.html',
  styleUrl: './event-list-front-office.component.scss'
})
    export class EventListFrontOfficeComponent implements OnInit {
      // bread crumb items
      breadCrumbItems: Array<{}> = [
        { label: 'Events', active: true },
        { label: 'Event List', active: true }
      ];

      // For events
      events: Event[] = [];
      displayedEvents: Event[] = [];
      eventAreas: EventArea[] = [];
      term: string = '';
      page: number = 1;
      itemsPerPage: number = 8;
      statuses = Object.values(Status);
      selectedStatus: string = '';

      constructor(
       // private formBuilder: UntypedFormBuilder,
        public store: Store,
        private eventService: EventService,
        private eventAreaService: EventAreaService
      ) {}

      ngOnInit(): void {
        this.loadEvents();
        this.loadEventAreas();
      }

      loadEvents(): void {
        document.getElementById('elmLoader')?.classList.remove('d-none');

        this.eventService.getAllEvents().subscribe({
          next: (data) => {
            this.events = data;
            this.displayedEvents = this.events.slice(0, this.itemsPerPage);
            document.getElementById('elmLoader')?.classList.add('d-none');
          },
          error: (error) => {
            console.error('Error loading events:', error);
            document.getElementById('elmLoader')?.classList.add('d-none');
          }
        });
      }

      loadEventAreas(): void {
        this.eventAreaService.getAllEventAreas().subscribe({
          next: (areas) => {
            this.eventAreas = areas;
          },
          error: (error) => console.error('Error loading event areas:', error)
        });
      }

      getEventAreaName(areaId?: number): string {
        if (!areaId) return 'N/A';
        const area = this.eventAreas.find(a => a.id === areaId);
        return area ? area.name : 'N/A';
      }

      searchList(): void {
        if (this.term) {
          this.displayedEvents = this.events.filter(event =>
            event.title?.toLowerCase().includes(this.term.toLowerCase())
          );
        } else {
          this.displayedEvents = this.events.slice(0, this.itemsPerPage);
        }
        this.updateNoResultDisplay();
      }

      filterByStatus(status: string): void {
        if (status && status !== 'all') {
          this.displayedEvents = this.events.filter(event => event.status === status);
        } else {
          this.displayedEvents = this.events.slice(0, this.itemsPerPage);
        }
        this.updateNoResultDisplay();
      }

      pageChanged(event: PageChangedEvent): void {
        const startItem = (event.page - 1) * event.itemsPerPage;
        const endItem = event.page * event.itemsPerPage;
        this.displayedEvents = this.events.slice(startItem, endItem);
      }

      updateNoResultDisplay(): void {
        const noResultElement = document.getElementById('noresult');
        const paginationElement = document.getElementById('pagination-element');

        if (this.displayedEvents.length === 0) {
          if (noResultElement) noResultElement.style.display = 'block';
          if (paginationElement) paginationElement.classList.add('d-none');
        } else {
          if (noResultElement) noResultElement.style.display = 'none';
          if (paginationElement) paginationElement.classList.remove('d-none');
        }
      }
    }
