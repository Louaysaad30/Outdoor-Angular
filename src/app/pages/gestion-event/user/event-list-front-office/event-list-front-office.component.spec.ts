import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventListFrontOfficeComponent } from './event-list-front-office.component';

describe('EventListFrontOfficeComponent', () => {
  let component: EventListFrontOfficeComponent;
  let fixture: ComponentFixture<EventListFrontOfficeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventListFrontOfficeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventListFrontOfficeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
