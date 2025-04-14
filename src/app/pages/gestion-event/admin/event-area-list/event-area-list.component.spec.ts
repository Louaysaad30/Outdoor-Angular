import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventAreaListComponent } from './event-area-list.component';

describe('EventAreaListComponent', () => {
  let component: EventAreaListComponent;
  let fixture: ComponentFixture<EventAreaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventAreaListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventAreaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
