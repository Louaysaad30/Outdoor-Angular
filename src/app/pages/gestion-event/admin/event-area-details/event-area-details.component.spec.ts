import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventAreaDetailsComponent } from './event-area-details.component';

describe('EventAreaDetailsComponent', () => {
  let component: EventAreaDetailsComponent;
  let fixture: ComponentFixture<EventAreaDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventAreaDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventAreaDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
