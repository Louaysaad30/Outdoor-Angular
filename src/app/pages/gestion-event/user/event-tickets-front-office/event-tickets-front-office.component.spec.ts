import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventTicketsFrontOfficeComponent } from './event-tickets-front-office.component';

describe('EventTicketsFrontOfficeComponent', () => {
  let component: EventTicketsFrontOfficeComponent;
  let fixture: ComponentFixture<EventTicketsFrontOfficeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTicketsFrontOfficeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventTicketsFrontOfficeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
