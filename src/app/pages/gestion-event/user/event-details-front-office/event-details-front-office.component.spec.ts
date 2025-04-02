import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDetailsFrontOfficeComponent } from './event-details-front-office.component';

describe('EventDetailsFrontOfficeComponent', () => {
  let component: EventDetailsFrontOfficeComponent;
  let fixture: ComponentFixture<EventDetailsFrontOfficeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventDetailsFrontOfficeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventDetailsFrontOfficeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
