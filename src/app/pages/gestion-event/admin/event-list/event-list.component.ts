import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
      import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
      import {CommonModule, DatePipe} from '@angular/common';
      import { FlatpickrModule } from 'angularx-flatpickr';
      import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
      import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';
      import {FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
      import { CalendarOptions, EventApi, EventClickArg, EventInput } from '@fullcalendar/core';
      import { createEventId, defaultevent } from '../../../apps/calendar/data';
      import dayGridPlugin from '@fullcalendar/daygrid';
      import listPlugin from '@fullcalendar/list';
      import interactionPlugin from '@fullcalendar/interaction';
      import timeGridPlugin from '@fullcalendar/timegrid';
      import Swal from 'sweetalert2';
      import { EventService } from '../../services/event.service';
      import {EventAreaService} from "../../services/event-area.service";
import { Status, Event as CustomEvent } from '../../models/event.model';
import {ReverseGeocodingService} from "../../services/reverse-geocoding.service";
import {NlpService} from "../../services/nlp.service";
      @Component({
        selector: 'app-event-list',
        standalone: true,
        imports: [
          BsDatepickerModule,
          DatePipe,
          FlatpickrModule,
          FullCalendarModule,
          ModalModule,
          ReactiveFormsModule,
          CommonModule,
          FormsModule
        ],
        templateUrl: './event-list.component.html',
        styleUrl: './event-list.component.scss'
      })
      export class EventListComponent implements OnInit, AfterViewInit {
        calendarEvents: EventInput[] = [];
        editEvent: any;
        newEventDate: any;
        formEditData!: UntypedFormGroup;
        submitted = false;
        formData!: UntypedFormGroup;
        isEditMode: boolean = false;
        upcomingEvents: any;
        eventAreas: any[] = [];
        statuses = Object.values(Status);
        uploadedFile: File | null = null;
        isProcessingText = false;
        improvedText: string | null = null;

        imageSource: 'upload' | 'generate' = 'upload';
        isGeneratingImage = false;
        generatedImageBlob: Blob | null = null;

        @ViewChild('eventModal', { static: false }) eventModal?: ModalDirective;
        @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

        constructor(private formBuilder: UntypedFormBuilder, private eventService: EventService , private eventAreaService: EventAreaService, private reverseGeocodingService: ReverseGeocodingService , private nlpService: NlpService ) { }


        ngOnInit(): void {
          this.formData = this.formBuilder.group({
            title: ['', [Validators.required]],
            description: [''],
            startDate: ['', Validators.required],
            endDate: [''],
            imageUrl: [''],
            status: ['', Validators.required],
            eventArea: ['', Validators.required]
          });

          this.loadEventAreas();
        }

        ngAfterViewInit(): void {
          // Use a longer timeout to ensure the calendar is fully rendered
          setTimeout(() => {
            this.loadEvents();
          }, 500); // Increased from default
        }
        loadEvents(): void {
                  console.log("Loading events...");
                  this.eventService.getAllEvents().subscribe(
                    (eventsData: any[]) => {
                      console.log("Raw events data:", eventsData);

                      // Define color options for variety
                      const colorOptions = [
                        { bg: '#4CAF50', border: '#2E7D32' }, // Green
                        { bg: '#2196F3', border: '#1565C0' }, // Blue
                        { bg: '#F44336', border: '#C62828' }, // Red
                        { bg: '#FF9800', border: '#EF6C00' }, // Orange
                        { bg: '#9C27B0', border: '#7B1FA2' }, // Purple
                        { bg: '#00BCD4', border: '#00838F' }, // Cyan
                        { bg: '#FFEB3B', border: '#FBC02D' }, // Yellow
                        { bg: '#795548', border: '#5D4037' }, // Brown
                        { bg: '#607D8B', border: '#455A64' }  // Blue Grey
                      ];

                      this.calendarEvents = eventsData.map((ev: any) => {
                        // Use undefined instead of null for dates
                        let startDate: Date | undefined = undefined;
                        let endDate: Date | undefined = undefined;

                        if (ev.startDate) {
                          startDate = new Date(ev.startDate);
                          if (isNaN(startDate.getTime())) {
                            console.error('Invalid start date for event:', ev);
                            startDate = undefined;
                          }
                        }

                        if (ev.endDate) {
                          endDate = new Date(ev.endDate);
                          if (isNaN(endDate.getTime())) {
                            console.error('Invalid end date for event:', ev);
                            endDate = undefined;
                          }
                        }

                        // Get a random color from options
                        const randomColorIndex = Math.floor(Math.random() * colorOptions.length);
                        const eventColor = colorOptions[randomColorIndex];

                        // Get a random text style
                        const textStyles = ['normal', 'italic', 'bold'];
                        const randomTextStyle = textStyles[Math.floor(Math.random() * textStyles.length)];

                        const matchingArea = ev.eventArea && this.eventAreas.find(area => area.id === ev.eventArea.id);

                        return {
                          id: ev.id ? ev.id.toString() : '',
                          title: ev.title,
                          start: startDate,
                          end: endDate,
                          backgroundColor: eventColor.bg,
                          borderColor: eventColor.border,
                          textColor: '#FFFFFF', // White text for better contrast
                          borderWidth: 1 + Math.floor(Math.random() * 3), // Random border width (1-3px)
                          allDay: false,
                          extendedProps: {
                            description: ev.description,
                            address: matchingArea && matchingArea.address ? matchingArea.address : 'Address not found',
                            imageUrl: ev.imageUrl,
                            status: ev.status,
                            tickets: ev.tickets,
                            eventAreaId: ev.eventArea ? ev.eventArea.id : '' ,
                            textStyle: randomTextStyle
                          }
                        };
                      });

                      console.log("Mapped calendar events:", this.calendarEvents);

                      const calendarApi = this.calendarComponent.getApi();
                      calendarApi.removeAllEvents();
                      if (this.calendarEvents.length > 0) {
                        calendarApi.addEventSource(this.calendarEvents);
                        if (this.calendarEvents[0].start) {
                          calendarApi.gotoDate(this.calendarEvents[0].start);
                        }
                      }
                    },
                    (error: any) => {
                      console.error('Error fetching events:', error);
                    }
                  );
        }

loadEventAreas(): void {
         this.eventAreaService.getAllEventAreas().subscribe(
           (areas) => {
             this.eventAreas = areas;
             // Process each area to get its address
             const addressPromises = areas.map(area => {
               return new Promise<void>((resolve) => {
                 if (area.latitude && area.longitude) {
                   this.reverseGeocodingService.reverseGeocode(area.latitude, area.longitude)
                     .subscribe(address => {
                       area.address = address;
                       console.log('adress list', address);
                       resolve();
                     }, () => resolve()); // Resolve even on error
                 } else {
                   resolve();
                 }
               });
             });

             // Load events only after all addresses are fetched
             Promise.all(addressPromises).then(() => {
               this.loadEvents();
             });
           },
           (error) => {
             console.error('Error fetching event areas:', error);
             // Load events anyway in case of error
             this.loadEvents();
           }
         );
       }

        /***
                 * Calender Set
                 */
        calendarOptions: CalendarOptions = {
          plugins: [dayGridPlugin, listPlugin, interactionPlugin, timeGridPlugin],
          headerToolbar: {
            right: 'dayGridMonth,dayGridWeek,dayGridDay,listWeek',
            center: 'title',
            left: 'prev,next today'
          },
          initialView: 'dayGridMonth',
          initialEvents: [],
          themeSystem: "bootstrap",
          timeZone: 'local',
          droppable: true,
          editable: true,
          selectable: true,
          navLinks: true,
          select: this.openModal.bind(this),
          eventClick: this.handleEventClick.bind(this),
          eventsSet: this.handleEvents.bind(this),
          eventResizableFromStart: true,
          height: 'auto', // Make sure calendar has proper height
          displayEventTime: true, // Show event times
          eventTimeFormat: { // Format the time for events
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          },
          eventContent: (arg) => {
            let timeDisplay = '';
            if (arg.event.end) {
              const endTime = new Date(arg.event.end);
              // Format the end time to match the time format of arg.timeText
              const formattedEndTime = endTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });
              timeDisplay = ` - ${formattedEndTime}`;
            }
            return {
              html: `
                <div class="custom-event" style="
                  background-color: ${arg.event.backgroundColor};
                  border-left: 4px solid ${arg.event.borderColor};
                  border-radius: 4px;
                  color: ${arg.event.textColor || '#fff'};
                  padding: 3px 6px;
                  height: 100%;
                  overflow: hidden;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                 ">
                  <div class="event-title" style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${arg.event.title}
                  </div>
                  ${arg.timeText ? `<div class="event-time" style="font-size: 0.85em; opacity: 0.8;">${arg.timeText}${timeDisplay}</div>` : ''}
                </div>
              `
            };
          }
        };
        currentEvents: EventApi[] = [];

        /**
         * Event add modal
         */
        openModal(events?: any) {
         this.isEditMode = false;
         this.formData.reset({
           title: '',
           description: '',
           startDate: '',
           endDate: '',
           imageUrl: '',
           status: '',
           eventArea: ''
         });

        setTimeout(() => {
          const modalTitle = document.querySelector('.modal-title') as HTMLElement;
          if (modalTitle) {
            modalTitle.innerHTML = 'Add Event';
          }

          const modalBtn = document.querySelector('#btn-save-event') as HTMLElement;
          if (modalBtn) {
            modalBtn.innerHTML = 'Add Event';
          }

          const deleteBtn = document.getElementById('btn-delete-event');
          if (deleteBtn) {
            deleteBtn.classList.add('d-none');
          }

          const eventDetails = document.querySelector('.event-details') as HTMLElement;
          if (eventDetails) {
            eventDetails.style.display = 'none';
          }

          const eventForm = document.querySelector('.event-form') as HTMLElement;
          if (eventForm) {
            eventForm.style.display = 'block';
          }
        }, 100);

         this.eventModal?.show();
         this.submitted = false;
         this.newEventDate = events;
       }


        /**
         * Event click modal show
         */
handleEventClick(clickInfo: EventClickArg) {
          this.isEditMode = true;
          this.editEvent = clickInfo.event;
          this.eventModal?.show();

          setTimeout(() => {
            (document.querySelector(".event-details") as HTMLElement).style.display = "block";
            (document.querySelector(".event-form") as HTMLElement).style.display = "none";

            document.getElementById('btn-delete-event')?.classList.remove('d-none');

            var editbtn = document.querySelector('#edit-event-btn') as HTMLAreaElement;
            editbtn.innerHTML = 'edit';

            (document.getElementById('btn-save-event') as HTMLElement).setAttribute("hidden", "true");

            var modaltitle = document.querySelector('.modal-title') as HTMLAreaElement;
            modaltitle.innerHTML = this.editEvent.title;
          }, 100);

          this.formData.patchValue({
            title: this.editEvent.title || '',
            description: this.editEvent.extendedProps?.description || '',
            startDate: this.editEvent.start || null,
            endDate: this.editEvent.end || null,
            status: this.editEvent.extendedProps?.status || '',
            imageUrl: this.editEvent.extendedProps?.imageUrl || '',
            eventArea: this.editEvent.extendedProps?.eventAreaId || ''
          });

          // For debugging
          console.log('Event area ID:', this.editEvent.extendedProps?.eventAreaId);
          console.log('Form values:', this.formData.value);
        }
        showeditEvent() {
  //this.editEvent = true;

          if (document.querySelector('#edit-event-btn')?.innerHTML == 'cancel') {
            this.eventModal?.hide();
          } else {
            (document.querySelector(".event-details") as HTMLElement).style.display = "none";
            (document.querySelector(".event-form") as HTMLElement).style.display = "block";
            (document.getElementById('btn-save-event') as HTMLElement).removeAttribute("hidden");
            var modalbtn = document.querySelector('#btn-save-event') as HTMLAreaElement;
            modalbtn.innerHTML = "Update Event";
            var editbtn = document.querySelector('#edit-event-btn') as HTMLAreaElement;
            editbtn.innerHTML = 'cancel';
          }
          this.formData.patchValue({
            title: this.editEvent?.title || '',
            description: this.editEvent?.extendedProps?.description || '',
            startDate: this.editEvent?.start || '',
            endDate: this.editEvent?.end || '',
            status: this.editEvent?.extendedProps?.status || '',
            imageUrl: this.editEvent?.extendedProps?.imageUrl || '',
            eventArea: this.editEvent?.extendedProps?.eventAreaId || ''
          });
        }


        /**
         * Events bind in calander
         * @param events events
         */
        handleEvents(events: EventApi[]) {
          this.currentEvents = events;
        }

        /**
         * Close event modal
         */
        closeEventModal() {

          this.formData = this.formBuilder.group({
            title: '',
            category: '',
            location: '',
            description: '',
            date: '',
            start: '',
            end: ''
          });
          const safeElement = document.querySelector('body') as HTMLElement;
          if (safeElement) safeElement.focus();

          this.formData.reset();
          this.eventModal?.hide();
        }

        /***
         * Model Position Set
         */
        position() {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Event has been saved',
            showConfirmButton: false,
            timer: 1000,
          });
        }

        /***
         * Model Edit Position Set
         */
        Editposition() {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Event has been Updated',
            showConfirmButton: false,
            timer: 1000,
          });
        }
        modalTitle: string = '';
        saveButtonText: string = '';
        editCancelButtonText: string = 'Edit';

        /**
         * Save the event
         */
        saveEvent(): void {
        if (this.formData.valid) {
          this.improvedText = null;
          const formData = new FormData();
          formData.append('title', this.formData.get('title')?.value);
          formData.append('description', this.formData.get('description')?.value);
          formData.append('startDate', this.formData.get('startDate')?.value);
          formData.append('endDate', this.formData.get('endDate')?.value);
          formData.append('status', this.formData.get('status')?.value);

          const eventAreaId = this.formData.get('eventArea')?.value;
          if (eventAreaId && eventAreaId !== '') {
            formData.append('eventAreaId', eventAreaId);
          }

          if (this.uploadedFile) {
            formData.append('image', this.uploadedFile);
          }

          console.log('Sending event data:', formData);

          this.eventService.createEvent(formData).subscribe({
            next: (response) => {
              console.log('Event created:', response);
              this.eventModal?.hide();
              this.loadEvents();
              this.position();
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Event has been created',
                showConfirmButton: false,
                timer: 1000,
              });
            },
            error: (error) => {
              console.error('Error creating event:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to create event.'
              });
            }
          });
        } else {
          console.log('Form is invalid:', this.formData.errors, this.formData.controls);
        }
      }


        selectedFile: File | null = null;
onFileSelected(event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  if (inputElement.files && inputElement.files.length > 0) {
    this.uploadedFile = inputElement.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.formData.patchValue({ imageUrl: reader.result });
    };
    reader.readAsDataURL(this.uploadedFile);
  }
}


        resetForm() {
                        this.formData.reset({
                          title: '',
                          className: '',
                          location: '',
                          description: '',
                          date: '',
                          start: '',
                          end: ''
                        });
                        this.eventModal?.hide();
                      }

        /**
         * save edit event data
         */
editEventSave() {
  if (this.formData.valid && this.editEvent.id) {
    this.improvedText = null;
    const eventData = {
      title: this.formData.get('title')?.value,
      description: this.formData.get('description')?.value,
      startDate: this.formatDate(new Date(this.formData.get('startDate')?.value)),
      endDate: this.formatDate(new Date(this.formData.get('endDate')?.value)),
      status: this.formData.get('status')?.value,
      eventArea: { id: this.formData.get('eventArea')?.value }
    };

    // Fix the null check for uploadedFile
    this.eventService.updateEvent(this.editEvent.id, eventData, this.uploadedFile || undefined)
      .subscribe({
        next: (event) => {
          if (this.eventModal) {
            this.eventModal.hide();
          }
          this.resetForm(); // Changed from resetFormData
          this.loadEvents(); // Changed from fetchEvents
        },
        error: (err) => {
          console.error('Error updating event:', err);
        }
      });
  }
}// Helper method to format dates correctly
formatDate(date: Date): string {
  // Format to 'YYYY-MM-DD HH:mm' which your backend expects
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}



      /**
       * Delete evenT
      **/
        deleteEventData() {
          if (this.editEvent?.id) {
            Swal.fire({
              title: 'Are you sure?',
              text: 'You are about to delete this event.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Yes, delete it',
              cancelButtonText: 'Cancel'
            }).then((result) => {
              if (result.isConfirmed) {
                this.eventService.deleteEvent(this.editEvent.id).subscribe(
                  () => {
                    this.editEvent.remove();
                    Swal.fire({
                      icon: 'success',
                      title: 'Deleted',
                      text: 'Event has been successfully deleted.'
                    });
                    this.formData.reset();
                    this.eventModal?.hide();
                  },
                  (error) => {
                    console.error('Error deleting event:', error);
                    Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'Failed to delete event.'
                    });
                  }
                );
              }
            });
          }
        }



        /**
         * Improve text using NLP service
         */


        previewImprovedText(): void {
          const description = this.formData.get('description')?.value;
          if (!description) return;

          this.isProcessingText = true;
          this.improvedText = null;

          this.nlpService.previewImprovement(description).subscribe({
            next: (response) => {
              this.improvedText = response.improvedText;
              this.isProcessingText = false;
            },
            error: (error) => {
              console.error('Error improving text:', error);
              this.isProcessingText = false;
            }
          });
        }

        applyImprovedText(): void {
          if (this.improvedText) {
            this.formData.patchValue({ description: this.improvedText });
            this.improvedText = null;
          }
        }




        generateImageFromDescription(): void {
          const description = this.formData.get('description')?.value;
          if (!description) {
            return;
          }

          this.isGeneratingImage = true;
          this.nlpService.generateImage(description).subscribe({
            next: (imageBlob: Blob) => {
              this.generatedImageBlob = imageBlob;

              // Create a URL for the blob to display in the UI
              const imageUrl = URL.createObjectURL(imageBlob);
              this.formData.patchValue({ imageUrl: imageUrl });

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
      }
